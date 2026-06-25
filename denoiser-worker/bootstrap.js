/**
 * Auto-provisions the Python virtual environment for the denoiser worker, then starts it.
 *
 * denoiser-worker/.venv is gitignored (it's huge — torch alone is hundreds of MB), so every
 * fresh clone is missing it. Without this, `npm run dev` on a new machine just fails with
 * "the system cannot find the path specified" and the backend silently falls back to
 * non-denoised (ffmpeg-only) audio forever, with no indication why.
 *
 * This script is intentionally plain Node with zero npm dependencies (it has to run before
 * any pip install exists), and only uses what's already in backend's node_modules at the
 * point `npm run dev` invokes it.
 *
 * Usage: node bootstrap.js
 */
const { spawnSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const WORKER_DIR = __dirname;
const VENV_DIR = path.join(WORKER_DIR, '.venv');
const SETUP_MARKER = path.join(VENV_DIR, '.setup_complete');
const IS_WINDOWS = process.platform === 'win32';
const BIN_DIR = path.join(VENV_DIR, IS_WINDOWS ? 'Scripts' : 'bin');
const VENV_PYTHON = path.join(BIN_DIR, IS_WINDOWS ? 'python.exe' : 'python');
const VENV_PIP = path.join(BIN_DIR, IS_WINDOWS ? 'pip.exe' : 'pip');
const SYSTEM_PYTHON_CANDIDATES = IS_WINDOWS ? ['python', 'py'] : ['python3', 'python'];

function log(msg) {
  console.log(`[denoiser-bootstrap] ${msg}`);
}

function findSystemPython() {
  for (const candidate of SYSTEM_PYTHON_CANDIDATES) {
    const probe = spawnSync(candidate, ['--version']);
    if (probe.status === 0) return candidate;
  }
  return null;
}

function run(cmd, args) {
  log(`> ${cmd} ${args.join(' ')}`);
  const result = spawnSync(cmd, args, { stdio: 'inherit', cwd: WORKER_DIR });
  if (result.error || result.status !== 0) {
    throw new Error(`Command failed (exit ${result.status}): ${cmd} ${args.join(' ')}`);
  }
}

function setupVenv() {
  if (fs.existsSync(SETUP_MARKER)) {
    log('Virtual environment already set up, skipping install.');
    return;
  }

  log('No completed venv setup found (expected on a fresh clone — .venv is gitignored). Setting it up now, this only happens once per machine...');

  if (!fs.existsSync(VENV_PYTHON)) {
    const systemPython = findSystemPython();
    if (!systemPython) {
      throw new Error(
        `Could not find Python on PATH (tried: ${SYSTEM_PYTHON_CANDIDATES.join(', ')}). ` +
        'Install Python 3.10+ and make sure it is on PATH, then re-run.'
      );
    }
    log(`Creating virtual environment with "${systemPython}"...`);
    run(systemPython, ['-m', 'venv', '.venv']);
  }

  log('Installing Python dependencies (torch + deepfilternet — this can take several minutes the first time)...');
  run(VENV_PIP, ['install', '--upgrade', 'pip']);
  run(VENV_PIP, ['install', '-r', 'requirements.txt']);

  fs.writeFileSync(SETUP_MARKER, new Date().toISOString());
  log('Setup complete.');
}

function startServer() {
  log('Starting uvicorn on port 8001...');
  const proc = spawn(VENV_PYTHON, ['-m', 'uvicorn', 'main:app', '--port', '8001'], {
    stdio: 'inherit',
    cwd: WORKER_DIR
  });
  proc.on('exit', (code) => process.exit(code ?? 1));
  proc.on('error', (err) => {
    log(`Failed to start uvicorn: ${err.message}`);
    process.exit(1);
  });
}

try {
  setupVenv();
  startServer();
} catch (err) {
  log(`Setup failed: ${err.message}`);
  log('The denoiser worker will not run this session. The backend still works without it — ' +
      'pronunciation scoring falls back to ffmpeg-only audio conversion (no noise removal).');
  process.exit(1);
}
