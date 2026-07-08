# Changelog

All notable changes made during AI-assisted development sessions are recorded here, grouped by date/session. Each entry lists the files touched and a short summary of what changed and why.

## 2026-07-08 (session 15) — Render cold-start warning on Login/Register

### Conditional cold-start notice for Render-hosted backend
- `frontend/src/utils/apiClient.js` — Added `IS_RENDER_BACKEND` (checks if `API_BASE` contains `onrender.com`), exported alongside `API_BASE`.
- `frontend/src/components/ColdStartNotice.jsx` (new) — Renders nothing unless `IS_RENDER_BACKEND` is true; shows a bilingual amber notice warning that the backend may take 30-50s to wake up after inactivity.
- `frontend/src/pages/Login.jsx`, `frontend/src/pages/Register.jsx` — Render `<ColdStartNotice language={language} />` below the page subtitle; on login/registration failure, append a bilingual "the server may still be waking up, try again in a moment" hint to the error message, but only when `IS_RENDER_BACKEND` is true (no change to the DigitalOcean-backend experience).

## 2026-07-08 (session 14) — CI/CD: deploy backend to DigitalOcean droplet via GitHub Actions

### Automated backend deployment set up
- `.github/workflows/deploy-backend.yml` (new) — On every push to `main` touching `backend/**`, SSHes into the droplet (`appleboy/ssh-action`) and runs `git reset --hard origin/main` + `npm install --omit=dev` + `pm2 reload articulate-ai-backend`. Also runnable manually via `workflow_dispatch`.
- `backend/deploy/setup-droplet.sh` (new) — One-time, manually-run setup script for a fresh Ubuntu 24.04 droplet: installs Node 20 LTS, git, ffmpeg, Nginx, PM2; clones the repo to `/var/www/articulate-ai`; pauses for the operator to hand-create `backend/src/.env` (secrets never go through git); starts the app under PM2 (with `pm2 startup` for reboot survival); configures Nginx as an HTTP reverse proxy on port 80 → 8000. Prints a reminder to run `certbot --nginx` once a domain is pointed at the droplet — no domain was available yet, so SSL is deferred.
- Generated a dedicated ed25519 deploy keypair (kept out of the repo, in the session scratchpad) for the `DROPLET_SSH_KEY` GitHub secret, rather than reusing any personal key.
- **Known gap, flagged to the user:** the droplet currently serves HTTP-only (no domain yet, so no Let's Encrypt cert). Since the frontend is deployed on Render over HTTPS, browsers will block requests to an HTTP-only backend (mixed content) until a domain is pointed at the droplet and `certbot --nginx` is run.

## 2026-07-08 (session 13) — Exam 500 fix (constraints + word_id hallucination) + mobile responsiveness + floating assistant fix

### Exam generation 500 errors — two compounding root causes, both fixed and verified end-to-end
Exam generation had **two independent bugs** that both had to be fixed for it to work; earlier in this session the schema fix below was applied then explicitly reverted at the user's request, then a second bug report (a `word_id` FK violation) led to re-diagnosing and re-fixing both together, this time verified with real end-to-end test runs (not just isolated pieces).

**Bug 1 — erroneous single-column `UNIQUE` constraints (schema bug):**
- `exam_questions` and `exam_answers` had **single-column** `UNIQUE` constraints — `exam_questions(exam_id)`, `exam_questions(order_num)`, `exam_answers(exam_id)`, `exam_answers(question_id)`. Since `order_num`/`question_id` uniqueness was column-wide (not per-exam), at most ONE question could ever be inserted per exam, and — worse — once any exam claimed `order_num=1`, no other exam in the system could ever insert a question with `order_num=1` again. Confirmed via reproduction: a second freshly-created test exam failed on its very first question insert because exam #1's question had already permanently claimed `order_num=1` table-wide.
- The correct uniqueness was already provided by the composite `UNIQUE(exam_id, order_num)` / `UNIQUE(exam_id, question_id)` constraints (also present) — the single-column ones were pure schema authoring mistakes.
- Fix: dropped the four single-column `UNIQUE` constraints live (kept the composites), restored `backend/src/docs/tables.sql` to match (no `UNIQUE` on those four columns).

**Bug 2 — LLM hallucinated `word_id`/`phrase_id`, violating FK constraints:**
- `backend/src/prompts/examGeneratePrompt.txt` instructed the LLM to output a real `word_id`/`phrase_id` "if taken from context" — but `buildContextText()` in `exam.controller.js` never actually included the ID in the context string sent to the LLM (only `word (bangla_meaning)` text pairs, for all four exam types). With no real ID available, the LLM hallucinated plausible-looking integers (likely primed by the prompt's own `"word_id": 42` example), and any ID that didn't exist in `words`/`phrases` violated `exam_questions_word_id_fkey` on insert → 500.
- Fix: `examGeneratePrompt.txt` no longer asks the LLM for `word_id`/`phrase_id` at all. `exam.controller.js` adds `resolveQuestionIds()` — a batched, case-insensitive exact-match lookup against `words.word` / `phrases.phrase_en` (both unique columns) for each generated question's text, run **after** the LLM call. Real DB ID if a match exists, `null` otherwise — never an LLM-supplied value. `word_id`/`phrase_id` are only used downstream for best-effort SRS phoneme logging (`examEvaluator.js`, wrapped in `.catch()`), so `null` is safe.

**Verification (not just unit-level — full controller path, live DB, live OpenAI call):**
- Confirmed the schema bug's exact failure mode by reproduction (see above), then re-applied the fix.
- Ran `examController.generateExam()` directly (bypassing HTTP) twice for a PROGRESS exam: both returned `200 success: true`, 5 and 10 questions respectively (LLM under-generated once — separate pre-existing prompt-adherence variance, not a functional bug, no error either way). Real words resolved to their true DB IDs (e.g. "knowledge" → `word_id: 3530`); phrases/words with no exact match correctly got `null`, no FK violations.
- Cleaned up all test exam rows created during diagnosis (`exams` ids 50-54 and their cascaded `exam_questions`); confirmed `exam_questions`/`exam_answers` were both empty again before finishing.

### Mobile responsiveness + floating assistant fix

### Collapsible off-canvas sidebar (replaces the un-hideable mobile top ribbon)
- **Root cause:** the old `@media (max-width: 768px)` block turned `.site-sidebar` into a full-width sticky top bar with a horizontal-scrolling nav ribbon that always occupied vertical space and could not be minimized.
- `frontend/src/components/Layout.jsx` — Added `sidebarOpen` state, a hamburger toggle button (`.sidebar-toggle-btn`) in the previously-empty `top-bar-left`, a backdrop overlay (`.sidebar-backdrop`), and an in-drawer close button (`.sidebar-close-btn`). A `useEffect` on `location.pathname` closes the drawer on any navigation (covers nav-link taps without per-link handlers). Imported the `Menu` icon.
- `frontend/src/App.css` — Rewrote the mobile media query: the sidebar is now `position: fixed`, off-canvas (`translateX(-100%)`), sliding in when `.open` with a dimmed backdrop; the nav returns to a vertical list and the sign-out footer is visible inside the drawer. Desktop layout unchanged. Added `.sidebar-toggle-btn`/`.sidebar-close-btn`/`.sidebar-backdrop` styles with light-mode variants.

### Global search is now a modal instead of an inline dropdown
- `frontend/src/components/Layout.jsx` — Reworked `GlobalSearch`: the top bar now shows a **search trigger button** (styled like a search field) that opens a centered **command-palette-style modal**. The modal auto-focuses its input, locks body scroll, closes on Escape / backdrop click / result selection, and shows empty/searching/results/no-results states. Reused the existing debounced `searchCurriculum` logic (debounce trimmed 500ms → 400ms). Gives a roomy search surface especially on mobile where the inline bar was cramped.
- `frontend/src/App.css` — Added `.search-trigger` (theme-aware field-style button) and `.search-modal-overlay`/`.search-modal`/`.search-modal-input-row`/`.search-modal-input`/`.search-modal-close`/`.search-modal-results` styles with light-mode variants and safe-area padding.

### Landing page header buttons wrapped to multiple lines on mobile
- **Root cause:** the public Landing navbar uses raw Tailwind classes (not the `.nav-link`/`.glass-button` design-system classes), so the earlier global `nowrap` fix didn't reach it; "Sign In" wrapped to 2 lines and "Get Started Free" to 3 as the flex row got tight.
- `frontend/src/pages/Landing.jsx` — Added `whitespace-nowrap shrink-0` to the Sign In / Get Started Free / Go to Dashboard links; shrank brand text (`text-lg sm:text-xl`) and button text (`text-xs sm:text-sm`) with tighter mobile padding so all three fit on one row at 360px+ without horizontal overflow.

### Mobile text-wrapping & cross-device consistency
- `frontend/src/App.css` — Added `white-space: nowrap` to `.nav-link`/`.nav-button`, `.form-button`/`.secondary-button`, and `.glass-button` so action buttons (Sign in, Sign out, etc.) stay on one line. Added `env(safe-area-inset-top)` padding to the top bar and drawer for notched phones (iPhone). Floating assistant panel width/height now use `min(…, calc(100vw/100dvh − …))` so it never overflows small screens (Pixel/Samsung/iPhone SE).
- `frontend/src/components/Layout.jsx` — Global search container base `min-w-[200px]` → `min-w-0` so it shrinks instead of overflowing the crowded mobile top bar (hamburger + search + 4 action icons).
- `frontend/index.html` — Added `viewport-fit=cover` to the viewport meta so safe-area insets apply on notched devices.
- Audit note: page-level grids already use responsive `grid-cols-1 sm:grid-cols-*` prefixes; remaining base multi-column grids are small stat chips / the 7-day calendar / 4-button rows that hold up at 320px+, so left as-is.

### Floating assistant gave URL routes instead of human directions
- **Root cause:** `appContext.md` and the `generateQuickResponse` system prompt instructed the model to output raw routes like `/progress`, so "how do I see my progress" returned "go to /progress".
- `backend/src/prompts/appContext.md` — Rewrote around the actual UI: maps each destination to its **sidebar menu label** ("open the sidebar and tap My Progress"), documents the mobile hamburger (☰), and forbids emitting URLs/paths.
- `backend/src/services/aiService.js` — Updated the `generateQuickResponse` STRICT RULES to direct users by menu name (never a URL), and fixed the two no-OpenAI/error fallback strings that still referenced `/ai-chat`.

## 2026-06-27 (session 6)

### IELTS Open Conversation — full voice-based AI conversation test

**Backend:**
- `backend/src/docs/tables.sql` — Added `conversation_sessions` and `conversation_turns` table definitions.
- `backend/src/database/migrateConversation.js` — One-shot migration script; run to create both tables + index. Tables are now live in Neon DB.
- `backend/src/services/aiService.js` — Added three new methods:
  - `assessFreeSpeech(buffer, mimeType)`: 2-pass Azure STT + pron assessment (no pre-known reference text needed — STT transcript used as reference).
  - `generateConversationResponse(history, topic, keyPoints)`: OpenAI IELTS examiner partner (short + follow-up question per turn).
  - `generateConversationReport(userTurns, topic, keyPoints)`: OpenAI structured JSON report with band, avg scores, mispronounced words, fluency issues, tips, turn breakdown.
- `backend/src/models/conversation.model.js` — New model: `createSession`, `addTurn`, `getSessionWithTurns`, `getTurnCount`, `endSession`, `getChapterTopic`.
- `backend/src/controllers/conversation.controller.js` — New controller: `startSession` (AI opening + TTS), `submitTurn` (audio → assessFreeSpeech → AI response → TTS), `endSession` (report + 75 XP award).
- `backend/src/routes/conversation.routes.js` — New router: `POST /start`, `POST /:id/turn`, `POST /:id/end`.
- `backend/src/index.js` — Registered `conversationRouter` at `/api/conversation`.

**Frontend:**
- `frontend/src/api/conversation.js` — New API file: `startConversationSession`, `submitConversationTurn`, `endConversationSession`.
- `frontend/src/pages/IELTSConversation.jsx` — Complete rewrite:
  - Phase state machine: idle → starting → active → ending → report.
  - Turn sub-phases: ai_speaking | user_ready | recording | processing.
  - MediaRecorder for user audio capture (webm/ogg/mp4).
  - Azure TTS playback via `new Audio(data:audio/mp3;base64,…)`.
  - Per-turn pronunciation score badges + weak word chips on user messages.
  - "Start Talking" / "Stop Talking" button pair.
  - Sticky "End Conversation" button while session is active.
  - Separate full-page report screen with IELTS band, pronunciation/fluency circles, strengths/weaknesses, mispronounced word chips, fluency issue list, improvement tips, turn-by-turn breakdown.

## 2026-06-29 (session 7)

### Dashboard, consistent loader, flashcard fix, cache

**Shared infrastructure:**
- `frontend/src/components/PageLoader.jsx` — New shared loading component: `Loader2` icon (animate-spin) + optional text. No emojis. Replaces per-page ad-hoc spinners.

**Flashcards (`frontend/src/pages/Flashcards.jsx`):**
- Added `loading` state (starts `true`); empty-state now only renders after `loading === false`, fixing the false "no cards" message shown during fetch.
- Added localStorage cache: key `articulate_flashcards_${userId}`, 2-min TTL, stale-while-revalidate pattern.
- Cache is invalidated on every `reviewFlashcard` call so the queue stays accurate.
- Added hard Refresh button (top-right of header).
- Removed emojis from confidence buttons, session summary, and empty state (replaced with `BookOpen`/`Award` icons).

**Dashboard:**
- `backend/src/models/progress.model.js` — Added `getDashboardData(userId)`: parallel queries for stats, best 3 mastered words (by streak), worst 3 words (by wrong_count), in-progress chapter, 7-day XP log, word familiarity counts.
- `backend/src/controllers/progress.controller.js` — Added `getDashboard` handler.
- `backend/src/routes/progress.routes.js` — Added `GET /api/progress/dashboard`.
- `frontend/src/api/progress.js` — Added `getDashboard()`.
- `frontend/src/pages/Dashboard.jsx` — New page: greeting, screen-time subtitle, level XP bar, 4 stat cards (XP/Streak/Words/Today), word familiarity bar, 7-day XP bar chart with screen-time overlay, current chapter card with progress bar, best/worst word chips, quick-access links. 3-min localStorage cache + stale-while-revalidate + hard Refresh.
- `frontend/src/App.jsx` — Added `/dashboard` route (protected).
- `frontend/src/components/Layout.jsx` — Brand link changed from `/` → `/dashboard`; brand emoji replaced with `Sparkles` icon; `GuideIndicator` emoji replaced with `User` icon; added Dashboard nav link with `LayoutDashboard` icon.

## 2026-06-27 (session 6 — patch 2)

### IELTS Conversation — listen to your own recordings in the report

- `frontend/src/pages/IELTSConversation.jsx` — After the user stops recording, a blob URL is created via `URL.createObjectURL` and stored on the user turn object. A `recordingUrlsRef` accumulates all URLs; a cleanup `useEffect` revokes them all on unmount to free memory. The `turns` array (with `audioUrl` fields) is now passed to `ReportScreen`. Added a "Your Recordings" section in the report that shows each user turn's transcript, pronunciation/fluency score badges, and a custom `AudioPlayer` component (play/pause button + progress bar). The player uses a hidden `<audio>` element backed by the blob URL.

## 2026-06-27 (session 6 — patch)

### IELTS Conversation — voice fix + authentic IELTS question style

- `backend/src/controllers/conversation.controller.js` — Added `pickVoice(guidePreference)` helper mapping `FEMALE→en-US-JennyNeural`, `MALE→en-US-GuyNeural`; reads `req.user.guide_preference` (set by auth middleware) so TTS in both `startSession` and `submitTurn` uses the correct voice without any frontend changes.
- `backend/src/services/aiService.js` — Rewrote `generateConversationResponse` system prompt: strips curriculum labels from topic title (e.g. "Part I (A1)"), instructs the AI to ask authentic IELTS-board-style personal questions (experiences, habits, opinions, comparisons) instead of probing chapter vocabulary. Added explicit "NEVER ask about language learning" rule. Capped response at 40 words + 100 tokens for snappier examiner turns.

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

## 2026-06-26 (session 8)

### LessonDetails — fix missing saveScoreToHistory and PronSparkline
- `frontend/src/pages/LessonDetails.jsx` — Added `saveScoreToHistory(wordKey, score)` which persists the last 10 pronunciation attempts per word to localStorage (`articulate_pron_${wordKey}`). Added `PronSparkline` component which reads that history and renders an inline SVG sparkline (green dots ≥60%, red dots <60%, trend label). Both were referenced in the file but never defined, causing a `ReferenceError` crash during speech assessment and a render crash in step 3.

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

## 2026-07-08 (session 13)

### Root README.md
- `README.md` (new, repo root) — Professional project README for the GitHub repo: live demo + video badges, problem/solution, feature table, AI innovation section, architecture diagram, tech stack, project structure, quick-start commands, docs links, and team credits. Reused verified facts (7,640 words, XP system, Azure/OpenAI/DeepFilterNet3 stack) already gathered for the earlier PPTX report prompts rather than re-deriving them.

## 2026-07-05 (session 12)

### PPTX project report prompt
- `pptx_generation_prompt.md` (new, repo root) — Comprehensive prompt for generating a 6-slide python-pptx project report for the CUET AI Hackathon submission. Covers: Cover/Intro, Problem & Solution, Technical Architecture, AI Innovation, Features & Competitive Analysis, Impact & Roadmap. Includes exact hex colors, font sizes, layout coordinates, all verified facts (7,640 words, 8 AI services, XP values, pricing, team names, market size), and helper function signatures for the script generator.
- `frontend/src/pages/LessonDetails.jsx` — Developer skip mode added then reverted in same session: `import.meta.env.DEV` gate that made all stepper steps freely clickable during recording, with amber DEV badge. Reverted back to normal `maxStep`-gated behavior after recording was done.

## 2026-07-04 (session 11)

### Lesson stepper — quick-access navigation between steps
- `frontend/src/pages/LessonDetails.jsx` — Added `maxStep` state (tracks the highest wizard step ever reached in the session) and a `useEffect` that keeps it updated whenever `wizardStep` advances. The step buttons in the stepper bar now have their `onClick` re-enabled: any step ≤ `maxStep` is clickable and navigates via `goToStep()` (which resets mic/recording state safely). Steps already visited show a ✓ badge instead of a number; the current step stays highlighted in gradient; unvisited/locked steps are dimmed with `opacity-40` and `cursor-not-allowed`. This lets users jump back to review flashcards or vocabulary without being forced through the linear flow again.
- Verified live: `assessPronunciation()`'s response no longer has a `denoised_audio_url` key at all, and scoring still works (`overall_score: 100` on the same test clip).
