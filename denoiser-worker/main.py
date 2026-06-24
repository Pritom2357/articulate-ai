import io
import logging
import subprocess
import sys
import types

import numpy as np
import soundfile as sf
import torch
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import Response

# deepfilternet's df.io imports torchaudio.backend.common.AudioMetaData purely for a type hint.
# That legacy dispatcher module was removed in the torchaudio version available for this Python
# build, breaking the import even though we never call df.io.load_audio/save_audio ourselves
# (we decode/encode via ffmpeg instead). Stub it out before importing df.enhance.
if "torchaudio.backend.common" not in sys.modules:
    _fake_common = types.ModuleType("torchaudio.backend.common")
    _fake_common.AudioMetaData = type("AudioMetaData", (), {})
    _fake_backend = types.ModuleType("torchaudio.backend")
    _fake_backend.common = _fake_common
    sys.modules["torchaudio.backend"] = _fake_backend
    sys.modules["torchaudio.backend.common"] = _fake_common

from df.enhance import enhance, init_df

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("denoiser-worker")

app = FastAPI(title="Articulate AI Denoiser Worker")

# Azure's pronunciation assessment REST endpoint is fed 16kHz mono PCM downstream, but
# DeepFilterNet's bundled model is trained at its own fixed sample rate (48kHz) — denoise there,
# then resample down once on the way out so the Node backend can forward the result unchanged.
TARGET_SR = 16000

logger.info("Loading DeepFilterNet model...")
model, df_state, _ = init_df()
MODEL_SR = df_state.sr()
logger.info(f"Model loaded. model_sr={MODEL_SR}, target_sr={TARGET_SR}")


def _normalize_to_reference_peak(signal: np.ndarray, reference_peak: float, target_peak: float = 0.95) -> np.ndarray:
    """DeepFilterNet's enhanced output comes back at a much lower level than its input (observed
    ~25-40dB quieter on real clips) — it suppresses noise energy but doesn't restore the speech
    energy to its original level. Rescale so the output peak matches the input's peak (capped at
    target_peak to avoid clipping), instead of leaving the result barely audible."""
    signal_peak = float(np.abs(signal).max())
    if signal_peak < 1e-6:
        return signal
    desired_peak = min(reference_peak, target_peak) if reference_peak > 1e-6 else target_peak
    return signal * (desired_peak / signal_peak)


def _ffmpeg_to_wav(raw_bytes: bytes, sample_rate: int) -> bytes:
    """Decode/resample arbitrary input audio (webm/opus, ogg, mp4, wav, ...) into mono PCM16
    WAV at the given sample rate. ffmpeg sniffs the input container/codec from the byte stream
    itself, so no explicit input format flag is needed."""
    process = subprocess.run(
        [
            "ffmpeg", "-hide_banner", "-loglevel", "error",
            "-i", "pipe:0",
            "-ac", "1", "-ar", str(sample_rate), "-f", "wav", "pipe:1",
        ],
        input=raw_bytes,
        capture_output=True,
    )
    if process.returncode != 0:
        raise RuntimeError(process.stderr.decode(errors="ignore") or "unknown ffmpeg error")
    return process.stdout


@app.post("/denoise")
async def denoise(audio: UploadFile = File(...)):
    raw_bytes = await audio.read()
    logger.info(f"[denoise] received '{audio.filename}' ({audio.content_type}), {len(raw_bytes)} bytes")

    try:
        wav_bytes = _ffmpeg_to_wav(raw_bytes, MODEL_SR)
    except Exception as e:
        logger.error(f"[denoise] input decode failed: {e}")
        raise HTTPException(status_code=400, detail=f"Could not decode input audio: {e}")

    audio_np, sr = sf.read(io.BytesIO(wav_bytes), dtype="float32")
    if audio_np.ndim > 1:
        audio_np = audio_np.mean(axis=1)
    input_peak = float(np.abs(audio_np).max())
    audio_tensor = torch.from_numpy(audio_np).unsqueeze(0)
    logger.info(f"[denoise] decoded input -> shape={tuple(audio_tensor.shape)}, sr={sr}, peak={input_peak:.4f}")

    enhanced = enhance(model, df_state, audio_tensor)
    enhanced_np = enhanced.squeeze(0).cpu().numpy()
    raw_output_peak = float(np.abs(enhanced_np).max())
    enhanced_np = _normalize_to_reference_peak(enhanced_np, input_peak)
    logger.info(
        f"[denoise] DeepFilterNet output shape={enhanced_np.shape}, "
        f"raw_peak={raw_output_peak:.4f}, normalized_peak={float(np.abs(enhanced_np).max()):.4f}"
    )

    model_sr_wav = io.BytesIO()
    sf.write(model_sr_wav, enhanced_np, MODEL_SR, format="WAV", subtype="PCM_16")

    try:
        out_bytes = _ffmpeg_to_wav(model_sr_wav.getvalue(), TARGET_SR)
    except Exception as e:
        logger.error(f"[denoise] output resample failed: {e}")
        raise HTTPException(status_code=500, detail=f"Could not resample denoised audio: {e}")

    logger.info(f"[denoise] done -> returning {len(out_bytes)} bytes WAV @ {TARGET_SR}Hz")
    return Response(content=out_bytes, media_type="audio/wav")


@app.get("/health")
def health():
    return {"status": "ok", "model_sr": MODEL_SR, "target_sr": TARGET_SR}
