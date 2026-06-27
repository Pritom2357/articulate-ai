const conversationModel = require('../models/conversation.model');
const ProgressModel = require('../models/progress.model');
const aiService = require('../services/aiService');

const XP_CONVERSATION_COMPLETE = 75;

const VOICE_MAP = {
  FEMALE: 'en-US-JennyNeural',
  MALE: 'en-US-GuyNeural',
};

function pickVoice(guidePreference) {
  return VOICE_MAP[guidePreference?.toUpperCase()] || 'en-US-GuyNeural';
}

class ConversationController {
  constructor() {
    this.progressModel = new ProgressModel();
  }

  // POST /api/conversation/start
  // Body: { chapterId }
  startSession = async (req, res) => {
    try {
      const userId = req.user.id;
      const { chapterId } = req.body;
      const voice = pickVoice(req.user.guide_preference);

      if (!chapterId) return res.status(400).json({ error: 'chapterId required' });

      const chapter = await conversationModel.getChapterTopic(chapterId);
      if (!chapter) return res.status(404).json({ error: 'Chapter not found' });

      const keyPoints = Array.isArray(chapter.conversation_key_points)
        ? chapter.conversation_key_points
        : [];
      const topic = chapter.title;

      const session = await conversationModel.createSession(userId, chapterId, topic);

      // Seed the opening: ask GPT to open the conversation naturally
      const openingHistory = [
        {
          role: 'user',
          content: 'BEGIN — open the conversation with a warm greeting and your first question.'
        }
      ];
      const aiText = await aiService.generateConversationResponse(openingHistory, topic, keyPoints);

      // TTS with the correct voice
      let aiAudioBase64 = null;
      try {
        const audioBuf = await aiService.textToSpeech(aiText, voice);
        aiAudioBase64 = audioBuf.toString('base64');
      } catch (e) {
        console.warn('[conversation/start] TTS failed:', e.message);
      }

      // Store AI opening turn (turn 0)
      await conversationModel.addTurn(session.id, 'ai', aiText, null, null, [], [], 0);

      return res.json({
        sessionId: session.id,
        topic,
        keyPoints,
        aiText,
        aiAudio: aiAudioBase64
      });
    } catch (err) {
      console.error('[conversation/start]', err);
      return res.status(500).json({ error: err.message });
    }
  };

  // POST /api/conversation/:id/turn
  // Multipart: audio file
  submitTurn = async (req, res) => {
    try {
      const userId = req.user.id;
      const sessionId = parseInt(req.params.id, 10);
      const voice = pickVoice(req.user.guide_preference);

      if (!req.file) return res.status(400).json({ error: 'Audio file required' });

      const sessionData = await conversationModel.getSessionWithTurns(sessionId, userId);
      if (!sessionData) return res.status(404).json({ error: 'Session not found' });
      if (sessionData.session.status === 'ENDED') return res.status(409).json({ error: 'Session already ended' });

      const { session, turns } = sessionData;
      const keyPoints = Array.isArray(session.conversation_key_points)
        ? session.conversation_key_points
        : [];

      // Azure free-speech assessment (2-pass: STT → pron)
      const pron = await aiService.assessFreeSpeech(req.file.buffer, req.file.mimetype);

      const userTurnIndex = turns.length;
      await conversationModel.addTurn(
        sessionId, 'user',
        pron.transcript || '',
        pron.pron_score,
        pron.fluency_score,
        pron.words || [],
        pron.phonemes || [],
        userTurnIndex
      );

      // Build conversation history for OpenAI (only ai/user messages with real content)
      const history = turns
        .filter(t => t.transcript?.trim())
        .map(t => ({
          role: t.speaker === 'ai' ? 'assistant' : 'user',
          content: t.transcript
        }));
      if (pron.transcript?.trim()) {
        history.push({ role: 'user', content: pron.transcript });
      }

      // Generate AI response using correct voice persona
      const aiText = await aiService.generateConversationResponse(history, session.topic, keyPoints);

      // TTS with the user's preferred voice
      let aiAudioBase64 = null;
      try {
        const audioBuf = await aiService.textToSpeech(aiText, voice);
        aiAudioBase64 = audioBuf.toString('base64');
      } catch (e) {
        console.warn('[conversation/turn] TTS failed:', e.message);
      }

      // Store AI turn
      await conversationModel.addTurn(
        sessionId, 'ai', aiText, null, null, [], [], userTurnIndex + 1
      );

      return res.json({
        transcript: pron.transcript,
        pron_score: pron.pron_score,
        fluency_score: pron.fluency_score,
        words: pron.words || [],
        phonemes: pron.phonemes || [],
        aiText,
        aiAudio: aiAudioBase64
      });
    } catch (err) {
      console.error('[conversation/turn]', err);
      return res.status(500).json({ error: err.message });
    }
  };

  // POST /api/conversation/:id/end
  endSession = async (req, res) => {
    try {
      const userId = req.user.id;
      const sessionId = parseInt(req.params.id, 10);

      const sessionData = await conversationModel.getSessionWithTurns(sessionId, userId);
      if (!sessionData) return res.status(404).json({ error: 'Session not found' });
      if (sessionData.session.status === 'ENDED') {
        return res.json({ report: sessionData.session.report });
      }

      const { session, turns } = sessionData;
      const keyPoints = Array.isArray(session.conversation_key_points)
        ? session.conversation_key_points
        : [];

      const userTurns = turns
        .filter(t => t.speaker === 'user')
        .map(t => ({
          transcript: t.transcript,
          pron_score: t.pron_score,
          fluency_score: t.fluency_score,
          words: t.words || []
        }));

      const report = await aiService.generateConversationReport(userTurns, session.topic, keyPoints);

      await conversationModel.endSession(sessionId, report);

      // Award XP
      try {
        await this.progressModel.addXP(userId, XP_CONVERSATION_COMPLETE, 'conversation_complete');
      } catch (e) {
        console.warn('[conversation/end] XP award failed:', e.message);
      }

      return res.json({ report });
    } catch (err) {
      console.error('[conversation/end]', err);
      return res.status(500).json({ error: err.message });
    }
  };
}

module.exports = new ConversationController();
