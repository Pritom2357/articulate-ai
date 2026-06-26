# Changelog

All notable changes made during AI-assisted development sessions are recorded here, grouped by date/session. Each entry lists the files touched and a short summary of what changed and why.

## 2026-06-26 (session 5)

### Curriculum overhaul — sequential locking, placement start, caching, 3-col lessons, no emojis

**Backend:**
- `backend/src/models/progress.model.js` — `getUserProgress` now also queries `placement_chapter` from `user_progress` and returns it in the response so the frontend knows where the user's curriculum starts.
- `backend/src/models/user.model.js` — Added `getOnboardingAttemptCount(userId)` query (COUNT from `onboarding_assessments`).
- `backend/src/controllers/user.controller.js` — `saveOnboarding` now checks attempt count before inserting; returns HTTP 403 if ≥ 3 attempts already used. Added `getOnboardingAttempts` handler returning `{ attempts, maxAttempts: 3 }`.
- `backend/src/routes/user.routes.js` — Added `GET /user/onboarding/attempts` route.

**Frontend:**
- `frontend/src/api/user.js` — Added `getOnboardingAttempts()` helper.
- `frontend/src/pages/Onboarding.jsx` — Fetches attempt count on mount; shows a "Placement Test Locked" block screen with a `Lock` icon if attempts ≥ 3; shows "Attempt X of 3" badge during the test flow.
- `frontend/src/pages/Curriculum.jsx` — Full rewrite: localStorage cache (`articulate_curriculum_${userId}`, 5-min TTL) with stale-while-revalidate; hard Refresh button; sequential chapter locking based on `placement_chapter` and completion state (skipped/active/completed/locked states with distinct icons and styles — `Lock`, `CheckCircle2`, `SkipForward`, `PlayCircle`); subtitle updated to explain sequential order; emojis removed.
- `frontend/src/pages/ChapterDetails.jsx` — Full rewrite: localStorage cache (`articulate_chapter_${id}`, 5-min TTL); lessons now displayed in a **3-column grid** (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`) with compact vertical cards; lesson type icons (`BookOpen`, `Mic`, `ClipboardList`, `RotateCcw` for LEARN/PRACTICE/TEST/REVIEW); chapter progress bar in header; emojis removed.

## 2026-06-26 (session 7)

### Vocabulary page — remove emojis + localStorage cache + hard refresh
- `frontend/src/pages/Vocabulary.jsx` — Replaced all emojis: tab labels now use `BookOpen` and `Star` Lucide icons; empty states use the same icons instead of `📚`/`⭐`. Added per-filter localStorage cache (`articulate_vocab_${userId}_${filter}`, 5-min TTL) and a separate bookmarks cache (`articulate_bookmarks_${userId}`). Stale-while-revalidate: cached data shown instantly, background revalidation runs silently. Hard **Refresh** button (`RefreshCw`) in page header clears all vocab cache keys for the user and force-fetches. Bookmark toggle also writes the updated bookmark list back to cache so it stays consistent. Filter chip `bg-gradient-to-r` → `bg-linear-to-r`, search wrapper `flex-grow` → `grow` (Tailwind canonical classes).

## 2026-06-26 (session 6)

### Progress page — localStorage cache + hard refresh button
- `frontend/src/pages/Progress.jsx` — Added `articulate_progress_${userId}` localStorage cache (5-min TTL) with stale-while-revalidate: cached `progress` and `xpLogs` are shown immediately on page load, then silently re-fetched in the background. Hard **Refresh** button (`RefreshCw`) in the page header clears the cache and force-fetches. Calendar data (`getStreakCalendar`) kept in its own effect and not cached (changes per month navigation). Added `useAuth` import; added `useCallback` to imports.

## 2026-06-26 (session 4)

### DB routine — fix wrong Bangla meanings in words table
- `backend/src/database/fixBanglaMeaning.js` (new) — Dedicated one-time script to audit and repair `bangla_meaning` for every word. Fetches word + bangla_meaning in batches of 40, sends each batch to GPT-4o-mini with a strict system prompt that explicitly handles common failures: English text used as meaning (e.g. "in" → "ভেতরে / মধ্যে"), bracket-wrapped phonetics ("[In]"), wrong single characters ("ক" for "a"), and NULL values. Supports `--dry-run` to preview changes and saves progress to `.fixbangla_progress.json` for resumable runs. Performs a pre-scan query at startup to show the count of obviously broken entries before the main loop.

## 2026-06-26 (session 3)

### AIChat — grammar box left-aligned + chat width constrained
- `frontend/src/pages/AIChat.jsx` — Grammar corrections box changed from `ml-auto` (right-side under user bubble) to left-aligned under the assistant response: uses a `flex gap-3` row with an 8px spacer div matching the avatar width, so it visually lines up with the assistant's message column.
- `frontend/src/App.css` — `.ai-chat-card` now has `max-width: 960px; margin: 0 auto` so the entire chat (header, messages, input bar) is constrained and centered rather than filling the full viewport width. Also increased horizontal padding on `.ai-chat-header` and `.ai-chat-form` from `2rem` to `3rem` for breathing room.

## 2026-06-26 (session 2)

### AIChat.jsx full-width redesign + FloatingAssistant
- `frontend/src/pages/AIChat.jsx` — Full rewrite: removed `page-container` wrapper; wraps in `.ai-chat-card` (calc height, no border, transparent bg). Header now has title+subtitle on the left and a small circular tutor avatar + agent-toggle chips on the right. Only the messages div scrolls (`.ai-chat-messages`); input form is fixed at the bottom with mic, mistake-toggle, profile-toggle, and send all in one row. Word panel + grammar correction boxes unchanged in content, styled consistently.
- `frontend/src/components/FloatingAssistant.jsx` (new) — Lightweight 340×460 floating chat panel rendered on all pages except `/ai-chat`. Calls `POST /chatbot/quick-chat` (the lightweight endpoint that loads `appContext.md` for route-aware answers). Panel opens/closes via a fixed indigo FAB in the bottom-right. Typing indicator, auto-scroll, "Full chat" link to `/ai-chat`. Hidden when user is not logged in.
- `frontend/src/components/Layout.jsx` — Imports `FloatingAssistant` and renders it after `<Outlet />`, conditionally excluded when `location.pathname === '/ai-chat'`.
- `frontend/src/App.css` — Added `.floating-assistant-btn` (fixed FAB, gradient, hover scale) after existing `.floating-assistant-panel` styles.

## 2026-06-26

### AI Chat — history persistence (DB + localStorage) and null-content crash fix
- `backend/src/database/migrateChatHistory.js` (new, run once) — creates `chat_sessions` and `chat_messages` tables plus an index on `(session_id, created_at)`.
- `backend/src/models/chat.model.js` (new) — `getOrCreateSession`, `saveMessage`, `getHistory`, `getSessions`.
- `backend/src/services/aiService.js` — `generateChatWithContext` now maps `null` content to `"[Word lookup: word]"` before building the OpenAI payload, fixing the 400 crash when word-panel messages were in the history.
- `backend/src/controllers/chatbot.controller.js` — `generalChat` now resolves/creates a session, saves user + assistant messages to DB, returns `sessionId` in response. Added `getHistory` handler.
- `backend/src/routes/chatbot.routes.js` — Added `GET /chatbot/history?sessionId=` route.
- `frontend/src/api/progress.js` — Added `getChatHistory(sessionId)` helper.
- `frontend/src/pages/AIChat.jsx` — On mount: reads `articulate_chat_${userId}` from localStorage for instant display, then silently syncs from DB. Each send/receive writes updated messages + sessionId back to localStorage. `sessionId` is threaded through every chat request so the server reuses one session per user.

### AI Chat — Word Lookup panel improvements (no emojis, AI fallback, structured layout)
- `backend/src/services/aiService.js` — Added `generateWordInfo(word)` returning structured JSON `{ word, ipa, part_of_speech, bangla_meaning, english_meaning, example, pronunciation_tip }` for words not in the local DB.
- `backend/src/controllers/chatbot.controller.js` — Word lookup now falls back to `generateWordInfo` when the DB has no match; `response` is set to `null` when `wordPanel` is returned so the AI chat text is never shown alongside the panel.
- `frontend/src/pages/AIChat.jsx` — Word panel redesigned: word + part-of-speech badge + IPA at top, separate sections for বাংলা অর্থ / Meaning / Example / pronunciation tip. "Pronounce" button uses real audio_url when available, otherwise calls TTS on the bare word. `handleReadAloud` now strips emoji/symbol characters with a regex before passing text to TTS so Azure reads naturally.

### AI Chat Agents: Grammar Mistake Detector, Personal Profile Tracker, Pronunciation Helper
- `backend/src/services/aiService.js` — Added `generateChatWithContext(messages, profileBlock)` (replaces `generateChatResponse` internally, adds optional learner-profile injection), `checkGrammar(userMessage)` (parallel OpenAI call returning `[{original, corrected, explanation}]` or `null`), and `extractWordQuery(userMessage)` (detects if user is asking about a specific word, returns the word string or `null`).
- `backend/src/controllers/chatbot.controller.js` — Rewrote `generalChat` to accept `{ messages, mistakeCheck, includeProfile }`. Fetches user profile + weak words when `includeProfile` is true, then runs grammar check + main chat response + word detection in `Promise.all`. Adds `wordLookup` handler querying the `words` table by exact (case-insensitive) word match. Returns `{ response, grammarErrors, wordPanel }`.
- `backend/src/routes/chatbot.routes.js` — Added `GET /chatbot/word-lookup?q=word` route for direct word lookup.
- `frontend/src/pages/AIChat.jsx` — Added two toggle buttons in the chat header (Mistakes detector, default ON; Profile tracker, default OFF) persisted in `localStorage`. `handleSend` now passes `mistakeCheck`/`includeProfile` flags and handles new response shape. Grammar errors are attached to the user message that triggered them and rendered as a yellow correction box beneath the bubble. Word panel responses (pronunciation helper) skip the regular AI text bubble and show a teal card with word, IPA, Bangla meaning, syllables, and an audio listen button using `playWordAudio`.

### AI Chatbot & RAG Session Refactoring (OpenAI & Azure TTS)
- `backend/src/services/aiService.js` — Refactored to replace Gemini with OpenAI (`gpt-4o-mini`). Implemented `assessConversation`, `generalChat`, and `generateNextSessionRAG` with optimized temperature settings (0.3 for strict scoring, 0.7 for creative chat and recommendations). Added `textToSpeech()` using Azure's REST TTS API and SSML.
- `backend/src/prompts/` (new) — Extracted large system prompts (`chatPrompt.txt`, `assessPrompt.txt`, `nextSessionPrompt.txt`) from code logic. `aiService.js` now reads these via `fs.readFileSync` during initialization.
- `backend/src/controllers/chatbot.controller.js` (new) & `backend/src/routes/chatbot.routes.js` (new) — Extracted chatbot and TTS logic from `assess.controller.js` and `assess.routes.js` to adhere to single-responsibility principles. The endpoints `/chat` and `/tts` are now isolated here.
- `backend/src/index.js` — Mounted the new `chatbotRouter` at `/api/chatbot`.
- `frontend/src/api/progress.js` — Updated `generalChat` and added `textToSpeech` fetch wrappers to point to the new `/chatbot` endpoints.
- `frontend/src/pages/AIChat.jsx` — Implemented frontend audio playback (`handleReadAloud`). Added clickable speaker icons under AI responses. The voice selection automatically adapts to the user's preferred tutor gender (`en-US-JennyNeural` for Riya, `en-US-GuyNeural` for Rohit).

## 2026-06-16

### Word pronunciation audio: use real audio_url instead of browser TTS
- `frontend/src/utils/audioCache.js` (new) — fetches a word/phrase's `audio_url`, converts to base64, caches in `localStorage` with a 7-day TTL (evicts oldest entries on quota errors).
- `frontend/src/utils/playWordAudio.js` (new) — plays `item.audio_url` via the cache first, falls back to Web Speech API TTS only if the URL is missing or fails.
- `frontend/src/api/curriculum.js` — `getLesson()` now also returns `phrases` (was silently dropped, so the lesson's phrase-speaking step always saw an empty list).
- `frontend/src/pages/LessonDetails.jsx`, `Vocabulary.jsx`, `Flashcards.jsx`, `WordDetails.jsx` — replaced `speakText(...)` calls with `playWordAudio(...)` so real pronunciation audio is used wherever available.

### Lesson "Learn" step: paginated word cards instead of one long list
- `frontend/src/pages/LessonDetails.jsx` — Step 1 (vocabulary list) now shows 3 word cards per page (word top-left, IPA top-right, Bengali meaning centered, audio + bookmark buttons at the bottom) with a "next" button instead of dumping every word at once. Step 2 (flashcard practice) similarly paginated to 2 cards at a time, with "Next" gated until both cards in the pair are flipped.

### Docs: consolidated `tables.sql`
- `backend/src/docs/tables.sql` — rewritten from a scattered CREATE+ALTER migration log into one clean, consolidated schema matching the live DB exactly (column-by-column verified against a live query dump). `views.sql` was already accurate, left untouched.

### Vocabulary-driven curriculum rebuild (CEFR-based, replacing the old IELTS curriculum)
- `data-source/extract_oxford3000.py` (new) — column-aware PDF parser (the source PDF uses a 4-column layout that naive text extraction jumbles) that extracts the Oxford 3000 word list into `data-source/oxford3000_cefr.csv` (word, CEFR level).
- `backend/src/database/seedVocabularyCurriculum.js` (new) — full pipeline: adds `words.cefr_level`, tags ~2,609 words from the Oxford CSV, fallback-tags the rest by splitting the existing `difficulty_level` (BEGINNER→A1/A2, INTERMEDIATE→B1/B2/C1 — there were zero ADVANCED-tagged words) by `frequency_rank` percentile, wipes the old chapters/lessons/tests/phrases (cascade), and rebuilds 8 chapters × 5 lessons × 11 words each, ordered easiest→hardest both across and within chapters.
- Live DB: ran the migration — 7,640 words tagged, old curriculum (8 chapters/37 lessons/1,576 word-links) replaced with the new 8×5×11 structure (440 word links total). `user_progress.placement_chapter` reset to 1 for all users since old chapter IDs no longer exist.

### Phoneme-level pronunciation assessment pipeline
- `backend/src/database/addPhonemeTables.js` (new) — migration adding `user_phoneme_scores` (append-only history) and `user_phoneme_summary` (rolling avg/fail-streak/mastery per user+phoneme), deliberately with no FK to `tests`/`test_progress` (the old `pronunciation_attempts` table's dependency on those broke once the curriculum became pure vocabulary lessons).
- `backend/src/constants/banglaRiskPhonemes.js` (new) — Bangla-language tips for 7 phonemes Bangla speakers commonly mispronounce (/v/, /æ/, /θ/, /ð/, /z/, /ɪ/, /w/).
- `backend/src/services/aiService.js` — `assessPronunciation()` now requests `PhonemeAlphabet: 'IPA'` + `EnableMiscue` from Azure and extracts per-phoneme accuracy scores; added `getPronunciationFeedback()` (Gemini) that turns weak phonemes into one short Bangla tip.
- `backend/src/models/progress.model.js` — added `logPhonemeScores()`: inserts history, upserts the rolling summary, awards the existing `XP_PHONEME_MASTERED` (100xp) on fresh mastery, flags phonemes whose fail-streak just hit 3.
- `backend/src/events/eventsNames.js` — added `RAG_TRIGGER` event, emitted (via the existing `eventBus`) when a phoneme's fail-streak hits 3. No consumer wired up yet (intentionally out of scope).
- `backend/src/controllers/assess.controller.js` — `/pronunciation/assess` now runs the audio-quality gate, phoneme logging, and RAG-trigger emit; added `/pronunciation/feedback` as a separate slow-path endpoint so the score response never blocks on the LLM call.
- `backend/src/routes/assess.routes.js` — registered the new feedback route.
- `frontend/src/api/progress.js` — added `getPronunciationFeedback()`.
- `frontend/src/pages/LessonDetails.jsx` — stopped sending the broken hardcoded `testId`/`questionId` (the old test-based logging path 500'd once the curriculum rebuild emptied the `tests` table); now fires the feedback request in the background after a score lands and shows the Bangla tip inline.

### Bug fixes found via live testing against Azure
- `backend/src/services/aiService.js` — fixed wrong field-nesting: Azure's actual REST response puts `AccuracyScore`/`FluencyScore`/`PronScore` etc. directly on the `NBest`/`Word`/`Phoneme` objects, not nested under a `PronunciationAssessment` sub-object (that nesting only applies to the SDK's result shape). This bug pre-dated this session — pronunciation assessment had likely never returned real Azure data, always silently falling back to mock scores.
- `backend/src/services/aiService.js`, `backend/src/controllers/assess.controller.js` — fixed a second bug: the Content-Type sent to Azure was hardcoded to `audio/ogg; codecs=opus` regardless of what the browser actually recorded (`audio/webm` via MediaRecorder). Added `_mapToAzureContentType()` and now pass `req.file.mimetype` through from the controller. Added console logging at each stage (received file info, outgoing Azure request, raw Azure response, final processed result) for diagnosing future audio-format issues.
- `backend/src/models/progress.model.js` — `updateSrsCard()` now auto-provisions a `user_word_progress` row (using the table's own defaults) on a user's first attempt at a word, instead of throwing "Card not found" for any word the user hadn't already been assigned a progress row for (which is every word in the rebuilt curriculum, since nothing pre-creates these rows).
- `frontend/src/utils/apiClient.js` — access tokens expire after 30 minutes and nothing called the refresh endpoint, so every request started failing with 401 after that. Added `refreshAccessToken()` + automatic refresh-and-retry on 401 (with concurrent-401s sharing one in-flight refresh), force-logout redirect if the refresh token itself is invalid, and `authorizedFetch()` for raw-fetch call sites (FormData uploads) that need the same behavior.
- `frontend/src/api/progress.js` — `assessPronunciation()` now goes through `authorizedFetch` instead of manually reading the token from `localStorage`.

### Lesson UX
- `frontend/src/pages/LessonDetails.jsx` — the 5-step navigator at the top of a lesson is now clickable for free jump-to-step navigation (was previously just a sequential progress indicator); jumping resets any stale pronunciation score/feedback. Also added an "your recording vs. correct pronunciation" comparison: the recorded blob is kept as a playable object URL (cleaned up on every reset path) alongside a button to play the reference `audio_url`, shown side-by-side after every word/phrase pronunciation attempt.

### Onboarding mic-check: volume always read 0%, debugging + likely fix
- `backend/src/controllers/user.controller.js` — `updateMicStatus` now logs the received `{userId, mic_verified, mic_quality_score}` on entry and the saved row on success (was a bare `console.error` on failure only, nothing on the request or success path). Confirmed via live logs the backend was faithfully storing whatever the frontend sent — the 0% was a frontend capture problem, not a backend bug.
- `frontend/src/pages/Onboarding.jsx` — added detailed `[micCheck]`/`[speechTest]` console logging throughout `startMicCheck`, `startRecording`, and `evaluateSpeech`: mic track label/enabled/muted/readyState/settings, `AudioContext` state + sample rate, per-second volume samples (average/frameMax/peakEverSeen/raw byte snippet), full calibration result, and the `assessPronunciation` request/response.
- `frontend/src/pages/Onboarding.jsx` — `startMicCheck` now explicitly calls `audioCtx.resume()` if created in a `suspended` state (a known browser-autoplay-policy cause of analyser data always reading 0).
- `frontend/src/pages/Onboarding.jsx` — both `getUserMedia` calls (mic-check and speech-test fallback) now explicitly set `echoCancellation: false, noiseSuppression: false, autoGainControl: false`. Live logs showed a `live`/unmuted track and a `running` AudioContext but still all-zero samples even while speaking — a known failure mode on laptop array mics with onboard DSP (e.g. Intel Smart Sound Technology) where Chrome's software noise-suppression/AGC stacked on the driver's own processing suppresses real speech to silence before it reaches WebAudio.
- `frontend/src/pages/Onboarding.jsx` — widened the analyser's `minDecibels`/`maxDecibels` range so quieter signals don't clip to a 0 byte value, and added a `peakEverSeen` tracker to distinguish "truly never captured anything" from "meter just isn't reflecting it."
- `frontend/src/pages/Onboarding.jsx` — added voice playback: the mic-check step now has a standalone "record 3 seconds and play it back" button (independent of any AI scoring, for fast self-diagnosis), and the speech-test step keeps each attempt's recording as a playable object URL with a "শুনুন" (listen) button, mirroring the pattern already built in `LessonDetails.jsx`.

### Audio denoising worker (Python/DeepFilterNet) ahead of pronunciation scoring
- `denoiser-worker/main.py` (new), `denoiser-worker/requirements.txt` (new) — standalone FastAPI service exposing `POST /denoise`: decodes whatever container the browser recorded (webm/opus, ogg, mp4, wav — via `ffmpeg`, sniffed automatically) to mono PCM at the DeepFilterNet model's 48kHz, runs DeepFilterNet3 to strip background noise, then resamples down to 16kHz mono WAV (the format Azure's pronunciation endpoint expects) before returning it. Chosen over simple spectral-gating denoising because it handles non-stationary noise (not just steady hum) much better, and runs as a persistent process so the model only loads once instead of paying startup cost per request.
- `backend/src/services/denoiserClient.js` (new) — thin Node client (`denoise(buffer, mimeType)`) that POSTs the raw recording to the worker (`DENOISER_WORKER_URL`, default `http://localhost:8001`) as multipart form data and returns the denoised buffer.
- `backend/src/services/aiService.js` — `assessPronunciation()` now runs the recording through `denoiserClient.denoise()` before building the Azure request; on any failure (worker not running, decode error, etc.) it logs a warning and falls back to the raw recording rather than breaking the whole assessment flow.
- Bug fixes found getting the worker running on Windows + Python 3.13 (verified live end-to-end: synthetic noisy webm clip → `/denoise` → valid 16kHz WAV, ~450ms for a 2s clip): (1) `numpy<2.0` (deepfilternet's pin) has no real Windows wheel for Python 3.13 — pip silently fell back to an experimental MINGW-built wheel that segfaults on import; forced `numpy>=2,<3` instead, which works fine despite the pin (numpy keeps C-API ABI compatibility across the 1.x/2.x line). (2) `deepfilternet`'s `df.io` imports `torchaudio.backend.common.AudioMetaData` for a type hint, but that legacy dispatcher module was removed in the only `torchaudio` build available for Python 3.13 — stubbed the module into `sys.modules` before importing `df.enhance` (safe since we never call `df.io.load_audio`/`save_audio`, only `ffmpeg`-based decode/encode ourselves).
- `.gitignore` — added `denoiser-worker/.venv`, `denoiser-worker/venv`, `__pycache__/`, `*.pyc`.

### Surface the denoised recording + phoneme breakdown in lesson/onboarding pronunciation results
- `backend/src/services/aiService.js` — `assessPronunciation()` now base64-encodes the denoised buffer (when denoising succeeded) and returns it as `denoised_audio_url` (a `data:audio/wav;base64,...` URI) on the result, so the frontend can play back exactly what was actually scored instead of the raw mic capture.
- `frontend/src/pages/LessonDetails.jsx` — `uploadSpeechAttempt()` now swaps the "আপনার রেকর্ডিং" playback source to `response.denoised_audio_url` once it arrives (revoking the raw blob URL), falling back to the raw recording if denoising wasn't available for that attempt. `frontend/src/pages/Onboarding.jsx`'s `evaluateSpeech()` does the same for the placement speech test.
- `frontend/src/pages/LessonDetails.jsx` — added a phoneme-level breakdown ("ধ্বনি বিশ্লেষণ") to both the word-test and phrase-test result cards: each phoneme Azure scored is shown as a colored chip (green ≥80, yellow 60–79, red <60) so the learner can see exactly which sounds were wrong, not just the one overall score. Backed by the `phonemes` array `assessPronunciation` already returned but the UI never rendered.

### Denoised audio was barely audible — DeepFilterNet output volume fix
- `denoiser-worker/main.py` — measured the actual problem first (`ffmpeg -af volumedetect`): DeepFilterNet's enhanced output came back ~25-40dB quieter than its input (it strips noise energy but doesn't restore the speech to its original level — confirmed on a real round-trip: input peak -6.4dB → raw output peak -33.6dB). Added `_normalize_to_reference_peak()`, which rescales the enhanced signal so its peak matches the original input's peak (capped at -0.5dB-ish headroom to avoid clipping) before encoding to WAV. Re-verified live: output peak went from -33.6dB to -9.4dB on the same test clip, now close to the original recording's loudness instead of inaudible.

### Phrase/sentence practice content: LLM-generated CSV, contextual to each lesson's own words
- `backend/src/database/generatePhraseCsv.js` (new) — for each of the 40 lessons, fetches that lesson's actual taught words + CEFR level from the DB, then asks OpenAI (`gpt-4o-mini`, JSON response format) for 4 short natural phrases/sentences using those specific words plus a Bangla translation for each. Chosen over hunting for a public sentence dataset because no free dataset ties sentences to *this* curriculum's specific per-lesson vocabulary or includes Bangla translations — generation is the only way to get phrases that reinforce what was just taught.
- Ran it live: 40/40 lessons succeeded, wrote 160 rows to `data-source/lesson_phrases.csv` (lesson_id, chapter_title, lesson_title, cefr_level, words_used, phrase_en, phrase_bn). This is a review step only — mirrors the existing "generate CSV → review → write a separate DB-import script" pattern already used for the Oxford 3000 word list; nothing has been written to `phrases`/`lesson_phrases` yet.
- `backend/package.json` — added the `openai` SDK dependency.

### Added audio_url column to lesson_phrases.csv (Azure TTS + Cloudinary)
- `data-source/generate_phrase_audio.py` (new) — for each phrase row, synthesizes MP3 via Azure TTS (`en-US-JennyNeural`, same voice as word audio), uploads to Cloudinary (`articulate-ai/audio/phrases/lesson{id}_phrase{index}`), writes the secure URL into a new `audio_url` column. Resume-safe (skips rows that already have a URL) and saves progress every 25 rows, mirroring `generate_audio.py`'s existing pattern for word audio.
- Initial draft of this script hardcoded the Azure/Cloudinary keys directly in the file (copying `generate_audio.py`'s existing style) — the harness's credential-leak check correctly blocked that. Rewrote it to load `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` from `backend/src/.env` via `python-dotenv` instead. (Note: `generate_audio.py` itself still has the old hardcoded-keys pattern — not touched here since it wasn't part of this task, but worth applying the same fix there.)
- Ran it live: 160/160 phrases succeeded. Verified the CSV has the new `audio_url` column and spot-checked two uploaded URLs return HTTP 200.

### Imported lesson_phrases.csv into the DB (phrases + lesson_phrases)
- `backend/src/database/importLessonPhrases.js` (new) — upserts each CSV row into `phrases` (keyed on `phrase_en`'s existing UNIQUE constraint, so re-running is safe) and links it via `lesson_phrases`. `phrases.difficulty` only supports the legacy `BEGINNER/INTERMEDIATE/ADVANCED` enum (no CEFR column like `words` has), so the CSV's A1-C1 level is mapped down (A1/A2→BEGINNER, B1/B2→INTERMEDIATE, C1/C2→ADVANCED) rather than altering the table — nothing in the app reads `phrases.difficulty` today, so a new column wasn't justified. Includes a small hand-written RFC4180 CSV parser (quoted fields, embedded commas/newlines) since the generated CSV has long quoted Bangla/English sentences that a naive `split(',')` would break on — verified against the real file (161 rows, correct column counts, quoted-comma rows parsed correctly) before running it.
- Ran it live: 160 phrases upserted, 160 lesson links created, 0 skipped. Verified by re-querying with the exact shape `curriculum.model.js` uses for a real lesson (id 38) — phrases and audio URLs load correctly.
- Found 22 pre-existing orphaned rows in `phrases` (no `lesson_phrases` link) — leftovers from the old IELTS curriculum wipe, since `phrases` itself has no FK to `lessons`/`chapters` so it wasn't cascade-deleted when chapters were. Left as-is (harmless, just unused dead rows) since cleaning them up wasn't part of this task.

### `npm run dev` now also starts the denoiser worker
- `backend/package.json` — split `dev` into `dev:backend` (the old `nodemon src/index.js`) and `dev:denoiser` (`cd ../denoiser-worker && .venv\Scripts\python.exe -m uvicorn main:app --port 8001`), with `dev` now running both together via the new `concurrently` devDependency, labeled/colored `BACKEND`/`DENOISER` in the combined output. No `--kill-others` — if the worker isn't set up yet, the backend still runs fine in its existing degraded mode (raw audio, no denoising) rather than refusing to start.
- First version used a forward-slash path (`.venv/Scripts/python.exe`); on Windows, npm scripts run through `cmd.exe`, which doesn't resolve that the same way bash does (`'.venv' is not recognized as an internal or external command`) — fixed by switching to a backslash path. Verified live: `npm run dev:denoiser` alone starts the worker and `/health` responds correctly.

### Denoiser worker temporarily detached — moving to a standalone HTTPS service later
- `backend/src/services/aiService.js` — `assessPronunciation()` no longer attempts the local denoiser call at all (was always failing fast anyway since nothing's running it locally right now); goes straight to the `convertToWav()` ffmpeg conversion before sending to Azure. The `denoiserClient.js` import was removed from this file (left as a dead-but-intact module, not deleted) so it's a one-line re-add once the worker comes back as a remote HTTPS service.
- `backend/package.json` — `dev` reverted to just `nodemon src/index.js` (no longer runs `concurrently` with the denoiser). `dev:denoiser` script kept standalone for whenever local testing of the worker is needed again.
- Also built but did not finish verifying before priorities shifted: `denoiser-worker/bootstrap.js`, which auto-creates `.venv` and runs `pip install -r requirements.txt` on first run (logging progress) instead of failing with "the system cannot find the path specified" on a fresh clone. Still present and wired to `npm run dev:denoiser` for whenever the worker is run locally again, but the requirements.txt-resolves-cleanly check was abandoned mid-verification when the denoiser was deprioritized — re-verify before relying on it.
- Re-verified the simplified pipeline live against real Azure: same test clip, `overall_score: 100`, no wasted fetch-and-timeout against a denoiser that isn't running.

### "Your recording" playback was still gated behind denoised audio that no longer exists
- `backend/src/services/aiService.js` — removed the dead `denoisedAudioDataUrl`/`denoised_audio_url` machinery entirely (it was always `null` since the denoiser stopped being called, but the field still existed on the response). Renamed `denoisedBuffer`/`denoisedMimeType` → `azureBuffer`/`azureMimeType` since they're just "whatever bytes get sent to Azure" now (raw, or ffmpeg-converted) — calling them "denoised" was misleading given no denoising happens here at all anymore.
- `frontend/src/pages/LessonDetails.jsx`, `frontend/src/pages/Onboarding.jsx` — removed the `if (response.denoised_audio_url) { swap playback source }` blocks. "আপনার রেকর্ডিং" / "your recording" now always plays the original raw mic capture (the object URL created immediately from the recorded blob), never anything processed — this field would never be present anymore anyway, but the dead conditional and its comments incorrectly implied playback might still be swapped to a "cleaned" version.
- Verified live: `assessPronunciation()`'s response no longer has a `denoised_audio_url` key at all, and scoring still works (`overall_score: 100` on the same test clip).
