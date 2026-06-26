const OpenAI = require('openai')
const denoiserClient = require('./denoiserClient.js')
const fs = require('fs')
const path = require('path')

class AIService {
  constructor() {
    this.azureKey = process.env.AZURE_SPEECH_KEY
    this.azureRegion = process.env.AZURE_SPEECH_REGION || 'southeastasia'

    // OpenAI client (replaces Gemini)
    this.openaiKey = process.env.OPENAI_API_KEY || ''
    this.openai = null

    if (this.openaiKey) {
      try {
        this.openai = new OpenAI({ apiKey: this.openaiKey })
      } catch (err) {
        console.error('Failed to initialize OpenAI client:', err.message)
      }
    } else {
      console.warn('⚠️ OPENAI_API_KEY is missing. Falling back to mock responses.')
    }

    // Load the chatbot prompt from the text file
    try {
      const promptPath = path.join(__dirname, '../prompts/chatPrompt.txt')
      this.chatSystemPrompt = fs.readFileSync(promptPath, 'utf8')
    }
    catch (error) {
      console.error('Failed to load chat prompt file:', error.message)
      this.chatSystemPrompt = 'You are a helpful AI English tutor.' // fallback
    }

    // Load the assess prompt from the text file
    try {
      const assessPromptPath = path.join(__dirname, '../prompts/assessPrompt.txt')
      this.assessSystemPrompt = fs.readFileSync(assessPromptPath, 'utf8')
    }
    catch (error) {
      console.error('Failed to load assess prompt file:', error.message)
      this.assessSystemPrompt = 'You are an experienced IELTS Speaking Examiner. Evaluate the following conversation transcript between a student and an examiner.' // fallback
    }

    // Load the next session prompt from the text file
    try {
      const nextSessionPath = path.join(__dirname, '../prompts/nextSessionPrompt.txt')
      this.nextSessionPrompt = fs.readFileSync(nextSessionPath, 'utf8')
    }
    catch (error) {
      console.error('Failed to load next session prompt file:', error.message)
      this.nextSessionPrompt = 'You are an AI English Tutor guiding a Bengali student. Generate a personalized next study session recommendation for the student. ' // fallback
    }

    // Load app context for the floating quick assistant
    try {
      const appContextPath = path.join(__dirname, '../prompts/appContext.md')
      this.appContextPrompt = fs.readFileSync(appContextPath, 'utf8')
    } catch (error) {
      console.error('Failed to load appContext.md:', error.message)
      this.appContextPrompt = 'You are a quick in-app assistant for Articulate AI, a spoken English learning platform.'
    }
  }


  /**
   * Assess user pronunciation of a word or sentence using Azure Speech REST API
   * @param {Buffer} audioBuffer - Raw audio file buffer
   * @param {string} referenceText - The text the user was supposed to pronounce
   * @returns {Promise<object>} - Score, feedback, and phoneme details
   */
  async assessPronunciation(audioBuffer, referenceText, audioMimeType = null) {
    if (!this.azureKey) {
      console.warn('⚠️ AZURE_SPEECH_KEY is missing. Simulating pronunciation assessment.');
      return this._mockPronunciationAssessment(referenceText);
    }

    // Run the recording through the Python DeepFilterNet worker before handing it to Azure —
    // background noise (room hum, fan, etc.) otherwise gets scored as part of the user's speech.
    // Falls back to the raw recording if the worker is unreachable, so a stopped/missing worker
    // degrades quality rather than breaking the whole assessment flow.
    let denoisedBuffer = audioBuffer;
    let denoisedMimeType = audioMimeType;
    let denoisedAudioDataUrl = null;
    try {
      console.log('[assessPronunciation] >>> sending to denoiser worker', {
        bytes: audioBuffer?.length,
        mimeType: audioMimeType
      });
      denoisedBuffer = await denoiserClient.denoise(audioBuffer, audioMimeType);
      denoisedMimeType = 'audio/wav';
      denoisedAudioDataUrl = `data:audio/wav;base64,${denoisedBuffer.toString('base64')}`;
      console.log('[assessPronunciation] <<< denoised audio received', { bytes: denoisedBuffer.length });
    } catch (denoiseErr) {
      console.warn('[assessPronunciation] denoiser worker unavailable:', denoiseErr.message);
      try {
        console.log('[assessPronunciation] >>> falling back to internal ffmpeg-static converter');
        const audioConverter = require('./audioConverter');
        denoisedBuffer = await audioConverter.convertToWav(audioBuffer);
        denoisedMimeType = 'audio/wav';
        console.log('[assessPronunciation] <<< fallback converter success', { bytes: denoisedBuffer.length });
      } catch (convErr) {
        console.warn('[assessPronunciation] fallback converter also failed, using raw audio:', convErr.message);
      }
    }

    try {
      const url = `https://${this.azureRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed`;

      const pronunciationParams = {
        ReferenceText: referenceText,
        GradingSystem: 'HundredMark',
        Granularity: 'Phoneme',
        Dimension: 'Comprehensive',
        EnableMiscue: true,
        PhonemeAlphabet: 'IPA'
      };

      const paramsJson = JSON.stringify(pronunciationParams);
      const paramsBase64 = Buffer.from(paramsJson).toString('base64');

      // The Content-Type sent to Azure MUST match the actual container/codec of the audio buffer,
      // or Azure will fail to decode it correctly (silently producing garbage/empty recognition
      // rather than an obvious error). The frontend records via MediaRecorder, so this must reflect
      // whatever mimetype it actually used (audio/webm;codecs=opus, audio/ogg;codecs=opus, audio/mp4, ...).
      const contentType = this._mapToAzureContentType(denoisedMimeType);

      console.log('[assessPronunciation] >>> REQUEST', {
        referenceText,
        receivedMimeType: audioMimeType,
        sentMimeType: denoisedMimeType,
        azureContentType: contentType,
        audioBufferBytes: denoisedBuffer?.length,
        region: this.azureRegion
      });

      // Fetch call to Azure Speech REST API
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': this.azureKey,
          'Content-type': contentType,
          'Pronunciation-Assessment': paramsBase64,
          'Accept': 'application/json'
        },
        body: denoisedBuffer
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[assessPronunciation] <<< Azure HTTP error', response.status, response.statusText, errorText);
        throw new Error(`Azure Speech API failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('[assessPronunciation] <<< RAW AZURE RESPONSE', JSON.stringify(data));

      if (data.RecognitionStatus !== 'Success') {
        throw new Error(`Azure STT Recognition failed: ${data.RecognitionStatus}`);
      }

      const bestResult = data.NBest?.[0];
      if (!bestResult) {
        throw new Error('No recognition results returned from Azure Speech.');
      }

      // Azure's REST response puts assessment scores directly on NBest/Word/Phoneme objects,
      // not nested under a "PronunciationAssessment" sub-object (that nesting only applies to
      // the Speech SDK's result shape, not this REST API's JSON).
      if (bestResult.PronScore == null) {
        throw new Error('Pronunciation assessment scores missing in Azure response.');
      }

      // Format feedback
      const accuracyScore = Math.round(bestResult.AccuracyScore || 0);
      const fluencyScore = Math.round(bestResult.FluencyScore || 0);
      const completenessScore = Math.round(bestResult.CompletenessScore || 0);
      const overallScore = Math.round(bestResult.PronScore || 0);
      // Not always present depending on audio format/region — treat as "unknown" (skip quality gate) rather than failing closed.
      const audioQualityScore = bestResult.AudioQualityScore != null ? Math.round(bestResult.AudioQualityScore) : null;

      // Flatten per-word phoneme scores into a single list
      const phonemes = [];
      for (const w of bestResult.Words || []) {
        for (const p of w.Phonemes || []) {
          phonemes.push({
            phoneme: p.Phoneme,
            score: Math.round(p.AccuracyScore || 0),
            word: w.Word
          });
        }
      }

      // Generate a friendly message in Bangla
      let feedback = '';
      if (overallScore >= 85) {
        feedback = 'চমৎকার উচ্চারণ! আপনি একদম সঠিকভাবে বলতে পেরেছেন।';
      } else if (overallScore >= 70) {
        feedback = 'খুব ভালো! কিছু শব্দ আরেকটু স্পষ্ট করার চেষ্টা করুন।';
      } else if (overallScore >= 50) {
        feedback = 'মোটামুটি হয়েছে। আরেকটু অনুশীলন করলে আরও সুন্দর হবে।';
      } else {
        feedback = 'দুঃখিত, আপনার উচ্চারণটি পুরোপুরি বোঝা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।';
      }

      const finalResult = {
        success: true,
        accuracy_score: accuracyScore,
        fluency_score: fluencyScore,
        completeness_score: completenessScore,
        overall_score: overallScore,
        audio_quality_score: audioQualityScore,
        recognized_text: bestResult.Display,
        feedback: feedback,
        phonemes,
        denoised_audio_url: denoisedAudioDataUrl,
        words: bestResult.Words?.map(w => ({
          word: w.Word,
          accuracy_score: Math.round(w.AccuracyScore || 0),
          error_type: w.ErrorType || 'None'
        })) || []
      };

      console.log('[assessPronunciation] === PROCESSED RESULT', JSON.stringify(finalResult));
      return finalResult;

    } catch (error) {
      console.error('Azure Pronunciation Assessment error:', error.message);
      // Fallback to mock on connection error/invalid file format
      return this._mockPronunciationAssessment(referenceText);
    }
  }

  /**
   * Assess IELTS-style open conversation transcript against key points
   * @param {Array} chatMessages - List of { role: 'user'|'assistant', content: string }
   * @param {Array} keyPoints - Key points required for the topic
   * @returns {Promise<object>} - IELTS band score, feedback in Bangla, key points assessment
   */

  async assessConversation(chatMessages, keyPoints) {
    const transcript = chatMessages.map(m => `${m.role === 'user' ? 'Student' : 'Examiner'}: ${m.content}`).join('\n');

    if (!this.openai) {
      return this._mockConversationAssessment(chatMessages, keyPoints);
    }

    try {
      const prompt = `
        ${this.assessSystemPrompt}

        Keypoints:
        ${JSON.stringify(keyPoints)}

        Here is the transcript:
        ${transcript}

        Format the output as a clean, parseable JSON block. DO NOT wrap it in markdown code fences.
      `;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        temperature: 0.3,
      });

      const responseText = completion.choices[0].message.content.trim();
      const cleanJson = responseText.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
      return JSON.parse(cleanJson);

    } catch (error) {
      console.error('OpenAI Conversation Assessment failed, returning mock:', error.message);
      return this._mockConversationAssessment(chatMessages, keyPoints);
    }
  }


  /**
   * Generate next session details (RAG) based on user's mistakes and profile
   * @param {string} name - User's name
   * @param {string} level - User's current level
   * @param {Array} weakWords - List of words the user got wrong or struggled with
   * @returns {Promise<string>} - HTML or markdown formatted recommendations in Bangla
   */
  async generateNextSessionRAG(name, level, weakWords) {
    let weakWordsString = 'None (did great!)';

    if (weakWords.length > 0) {
      const formattedWords = [];
      for (const w of weakWords) {
        formattedWords.push(`"${w.word}" (Bangla: ${w.bangla_meaning}, wrong count: ${w.wrong_count})`);
      }

      weakWordsString = formattedWords.join(', ');
    }

    if (!this.openai) {
      return this._mockRagSession(name, level, weakWords);
    }

    try {
      const prompt = `
        You are an AI English Tutor guiding a Bengali student named "${name}" who is at level "${level}".

        Based on the student's recent performance, here are the English words they struggled with (wrong pronunciation attempts):
        ${weakWordsString}

        ${this.nextSessionPrompt}
      `;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.7,
      });

      return completion.choices[0].message.content.trim();

    }
    catch (error) {
      console.error('OpenAI RAG generation failed, returning mock:', error.message);
      return this._mockRagSession(name, level, weakWords);
    }
  }


  /**
   * General AI English chat response
   * @param {Array} chatMessages - List of { role: 'user'|'assistant', content: string }
   * @returns {Promise<string>} - AI response
   */
  async generateChatResponse(chatMessages) {
    return this.generateChatWithContext(chatMessages, null)
  }

  /**
   * Chat with optional injected profile block
   * @param {Array} chatMessages
   * @param {string|null} profileBlock - Pre-formatted learner profile string to inject
   * @returns {Promise<string>}
   */
  async generateChatWithContext(chatMessages, profileBlock = null) {
    if (!this.openai) {
      return "Hello! I am your Articulate AI English Guide. (Note: OpenAI API key is not configured, running in demo mode.)"
    }

    try {
      let systemContent = this.chatSystemPrompt
      if (profileBlock) {
        systemContent = this.chatSystemPrompt + '\n\n' + profileBlock
      }

      const messages = [
        { role: 'system', content: systemContent },
        // content can be null for word-panel messages — replace with placeholder so
        // OpenAI doesn't reject the history with "expected a string, got null"
        ...chatMessages.map(m => ({
          role: m.role,
          content: m.content ?? (m.wordPanel ? `[Word lookup: ${m.wordPanel.word || 'word'}]` : '[message]')
        }))
      ]

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 500,
        temperature: 0.7,
      })

      return completion.choices[0].message.content.trim()
    }
    catch (error) {
      console.error('AI chat failed:', error.message)
      return "I noticed a connection issue, but let's keep practicing!"
    }
  }

  /**
   * Lightweight quick-assistant response (for floating chat widget)
   * @param {Array} chatMessages
   * @param {string} userContext  - compact profile string (name, level, xp, streak, lessons)
   * @returns {Promise<string>}
   */
  async generateQuickResponse(chatMessages, userContext = '') {
    if (!this.openai) {
      return "I'm your quick app assistant! Visit /ai-chat for full English tutoring."
    }
    try {
      const systemContent = `You are a friendly in-app assistant for Articulate AI, a spoken English learning platform for Bengali learners.

${this.appContextPrompt}

${userContext ? `\n=== CURRENT USER ===\n${userContext}\n=== END USER ===` : ''}

STRICT RULES:
- Max 2-3 sentences per reply. Be direct and helpful.
- Always mention a specific page route (/flashcards, /progress, etc.) when relevant.
- For complex English questions (grammar, pronunciation deep-dive, vocabulary coaching): say "For that, visit the AI Chat Assistant at /ai-chat — it's built for exactly this."
- Speak conversationally, not like a robot. Be encouraging.`

      const messages = [
        { role: 'system', content: systemContent },
        ...chatMessages.map(m => ({ role: m.role, content: m.content ?? '[message]' }))
      ]

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 150,
        temperature: 0.7,
      })
      return completion.choices[0].message.content.trim()
    } catch (error) {
      console.error('Quick chat failed:', error.message)
      return "I had a hiccup! Try asking again, or visit /ai-chat for full support."
    }
  }

  /**
   * Check English grammar errors in a user message
   * @param {string} userMessage
   * @returns {Promise<Array|null>} Array of {original, corrected, explanation} or null if no errors
   */
  async checkGrammar(userMessage) {
    if (!this.openai || !userMessage?.trim()) return null
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a strict English grammar checker for Bengali learners.
Analyze the message for grammatical errors (wrong tense, subject-verb agreement, word form, prepositions, articles, etc.).
Return JSON: { "errors": [ { "original": "...", "corrected": "...", "explanation": "..." } ] }
If no errors exist, return: { "errors": [] }
Return ONLY the JSON — no preamble, no markdown.`
          },
          { role: 'user', content: userMessage }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 300,
        temperature: 0.1,
      })
      const parsed = JSON.parse(completion.choices[0].message.content)
      return Array.isArray(parsed.errors) && parsed.errors.length > 0 ? parsed.errors : null
    } catch (err) {
      console.error('Grammar check failed:', err.message)
      return null
    }
  }

  /**
   * Return structured info for any English word (used when the word is not in the local DB)
   * @param {string} word
   * @returns {Promise<object>} { word, ipa, part_of_speech, bangla_meaning, english_meaning, example, pronunciation_tip }
   */
  async generateWordInfo(word) {
    if (!this.openai) {
      return { word, ipa: null, part_of_speech: null, bangla_meaning: null, english_meaning: null, example: null, pronunciation_tip: null }
    }
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an English dictionary for Bengali learners.
For the given word return ONLY a JSON object with these fields:
{
  "word": "exact word",
  "ipa": "IPA transcription without slashes",
  "part_of_speech": "noun/verb/adjective/etc",
  "bangla_meaning": "accurate Bangla meaning — use real Bangla words, never English",
  "english_meaning": "concise English definition (1 sentence)",
  "example": "a natural example sentence using the word",
  "pronunciation_tip": "syllable-broken pronunciation guide e.g. ih-NIG-muh"
}
No emojis. No markdown. Return ONLY the JSON.`
          },
          { role: 'user', content: word }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 250,
        temperature: 0.1,
      })
      const parsed = JSON.parse(completion.choices[0].message.content)
      return { ...parsed, ai_generated: true }
    } catch (err) {
      console.error('generateWordInfo failed:', err.message)
      return { word, ipa: null, part_of_speech: null, bangla_meaning: null, english_meaning: null, example: null, pronunciation_tip: null, ai_generated: true }
    }
  }

  /**
   * Detect if user is asking about a specific word (meaning, pronunciation, IPA, spelling)
   * @param {string} userMessage
   * @returns {Promise<string|null>} The word in lowercase or null
   */
  async extractWordQuery(userMessage) {
    if (!this.openai || !userMessage?.trim()) return null
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Detect if the user is asking about a specific English word — its meaning, pronunciation, IPA, spelling, or how to say it.
If they are asking about a specific word, return that word in lowercase.
If they are asking about multiple words or no specific word, return null.
Return JSON: { "word": "beautiful" } or { "word": null }
Return ONLY the JSON — no preamble.`
          },
          { role: 'user', content: userMessage }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 50,
        temperature: 0,
      })
      const parsed = JSON.parse(completion.choices[0].message.content)
      return parsed.word || null
    } catch (err) {
      console.error('Word extraction failed:', err.message)
      return null
    }
  }


  /**
   * Generate one short, actionable Bangla tip covering a user's weak phonemes.
   * @param {Array<{phoneme: string, score: number, tipBn: string|null}>} weakPhonemes
   * @returns {Promise<string>} - Bangla tip text only, no preamble
   */
  async getPronunciationFeedback(weakPhonemes) {
    if (!weakPhonemes || weakPhonemes.length === 0) {
      return 'আপনার উচ্চারণ ভালো ছিল, কোনো নির্দিষ্ট দুর্বল ধ্বনি পাওয়া যায়নি।';
    }

    if (!this.openai) {
      return weakPhonemes.map(p => p.tipBn).filter(Boolean)[0]
        || 'এই ধ্বনিগুলো নিয়ে আরেকটু অনুশীলন করুন।';
    }

    try {
      const formattedParts = [];

      for (const p of weakPhonemes) {
        let stringPart = `/${p.phoneme}/ (score: ${p.score}`;

        if (p.tipBn) { // append a known tip if exists
          stringPart += `, known tip: "${p.tipBn}"`;
        }

        stringPart += `)`;
        formattedParts.push(stringPart);
      }

      const phonemeList = formattedParts.join(', '); // convert the array to a single string

      const prompt = `
        A Bengali student learning English pronunciation scored low on these IPA phonemes: ${phonemeList}.
        Write ONE short, actionable tip in BANGLA (max 2 sentences) to help them improve these specific sounds.
        Use the known tips as a base if given, but make it feel like one cohesive piece of advice rather than a list.
        Return ONLY the tip text in Bangla — no preamble, no English, no markdown.
      `;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.5,
      });

      return completion.choices[0].message.content.trim();
    } catch (error) {
      console.error('OpenAI pronunciation feedback failed, returning fallback tip:', error.message);
      return weakPhonemes.map(p => p.tipBn).filter(Boolean)[0]
        || 'এই ধ্বনিগুলো নিয়ে আরেকটু অনুশীলন করুন।';
    }
  }


  /**
   * Convert text to speech using Azure Speech REST API
   * @param {string} text - The text to convert to speech
   * @param {string} voice - Azure voice name (e.g. 'en-US-JennyNeural', 'en-US-GuyNeural')
   * @returns {Promise<Buffer>} - MP3 audio buffer
   */
  async textToSpeech(text, voice = 'en-US-JennyNeural') {
    if (!this.azureKey) {
      throw new Error('Azure Speech key is not configured');
    }

    try {
      const url = `https://${this.azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`;

      // SSML gives us control over voice, language, and speaking style
      const ssml = `
        <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
          <voice name="${voice}">
            ${text}
          </voice>
        </speak>
      `;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': this.azureKey,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-24khz-96kbitrate-mono-mp3',
        },
        body: ssml,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Azure TTS failed: ${response.status} - ${errorText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('Azure TTS failed:', error.message);
      throw error;
    }
  }


  /**
   * Azure's short-audio REST endpoint needs the Content-Type to truthfully describe the
   * audio container/codec it's receiving, or it silently mis-decodes the buffer instead of
   * erroring (producing garbage/near-zero scores rather than an obvious failure).
   * Maps the multer-reported mimetype (from the browser's MediaRecorder) to what Azure expects.
   */
  _mapToAzureContentType(mimeType) {
    if (!mimeType) return 'audio/wav; codecs=audio/pcm; samplerate=16000';
    const mt = mimeType.toLowerCase();

    if (mt.includes('webm')) return 'audio/webm; codecs=opus';
    if (mt.includes('ogg')) return 'audio/ogg; codecs=opus';
    if (mt.includes('wav')) return 'audio/wav; codecs=audio/pcm; samplerate=16000';
    // audio/mp4 (Safari fallback) isn't in Azure's documented supported container list for this
    // endpoint — pass it through as-is and let the raw response/log reveal what actually happens.
    return mimeType;
  }

  // --- PRIVATE MOCK FALLBACKS ---

  _mockPronunciationAssessment(referenceText) {
    const overallScore = Math.floor(Math.random() * 20) + 70; // 70 to 90
    const accuracyScore = overallScore + 2;
    const fluencyScore = overallScore - 4;
    const completenessScore = 100;

    let feedback = '';
    if (overallScore >= 80) {
      feedback = 'খুব চমৎকার উচ্চারণ! (সিমুলেটেড)';
    } else {
      feedback = 'ভালো হয়েছে! কিছু শব্দ আরেকটু অনুশীলন করুন। (সিমুলেটেড)';
    }

    const mockPhonemeSet = ['æ', 'v', 'θ', 'ð', 'z', 'ɪ', 'w', 'k', 't', 's', 'n', 'm'];
    const phonemes = referenceText.toLowerCase().replace(/[^a-z ]/g, '').split('').slice(0, 6).map((ch, i) => ({
      phoneme: mockPhonemeSet[(ch.charCodeAt(0) + i) % mockPhonemeSet.length],
      score: Math.floor(Math.random() * 35) + 65,
      word: referenceText.split(' ')[0]
    }));

    return {
      success: true,
      accuracy_score: accuracyScore,
      fluency_score: fluencyScore,
      completeness_score: completenessScore,
      overall_score: overallScore,
      audio_quality_score: 85,
      recognized_text: referenceText,
      feedback: feedback,
      phonemes,
      words: referenceText.split(' ').map(word => ({
        word: word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ""),
        accuracy_score: Math.floor(Math.random() * 25) + 75,
        error_type: 'None'
      }))
    };
  }

  _mockConversationAssessment(chatMessages, keyPoints) {
    // Find key points from chat transcript
    const userText = chatMessages
      .filter(m => m.role === 'user')
      .map(m => m.content.toLowerCase())
      .join(' ');

    const keyPointsFound = [];
    const keyPointsMissing = [];

    for (const kp of keyPoints) {
      if (userText.includes(kp.toLowerCase())) {
        keyPointsFound.push(kp);
      } else {
        keyPointsMissing.push(kp);
      }
    }

    const hitRatio = keyPoints.length > 0 ? keyPointsFound.length / keyPoints.length : 0;
    let ieltsBand = 5.0;
    if (hitRatio >= 0.8) ieltsBand = 7.5;
    else if (hitRatio >= 0.6) ieltsBand = 6.5;
    else if (hitRatio >= 0.4) ieltsBand = 6.0;
    else if (hitRatio >= 0.2) ieltsBand = 5.5;

    const accuracyScore = Math.round(50 + hitRatio * 45);

    return {
      ielts_band: ieltsBand,
      accuracy_score: accuracyScore,
      feedback_bn: `চমৎকার কথোপকথন! আপনি অনেক সুন্দরভাবে কথা বলেছেন। আপনি মোট ${keyPoints.length}টি মূল বিষয়ের মধ্যে ${keyPointsFound.length}টি বিষয় সফলভাবে তুলে ধরেছেন। আপনার শব্দ চয়ন ভালো ছিল, তবে কিছু বাক্যে ব্যাকরণগত ভুল ও জড়তা ছিল। আগামী সেশনে সেগুলো ঠিক করার চেষ্টা করব। (সিমুলেটেড)`,
      key_points_found: keyPointsFound,
      key_points_missing: keyPointsMissing
    };
  }

  _mockRagSession(name, level, weakWords) {
    const weakList = weakWords.length > 0
      ? weakWords.map(w => `**${w.word}** (${w.bangla_meaning})`)
      : ['সবগুলো শব্দই আপনি চমৎকারভাবে উচ্চারণ করেছেন!'];

    return `
### 📚 টিউটর পরামর্শ: পরবর্তী সেশন প্রস্তুতি (RAG)

প্রিয় **${name}**,

আপনার **${level}** স্তরের দক্ষতা বৃদ্ধির জন্য আমরা আপনার সাম্প্রতিক পারফরম্যান্স বিশ্লেষণ করেছি। আপনার পরবর্তী সেশনের একটি কাস্টমাইজড গাইড নিচে দেওয়া হলো:

#### 🎯 যে শব্দগুলোতে জড়তা ছিল:
${weakList.map(w => `- ${w}`).join('\n')}

#### 💡 টিউটর টিপস (উচ্চারণ সংশোধন):
1. কঠিন শব্দগুলো ছোট ছোট সিলেবলে (syllables) ভাগ করুন। যেমন: **Com-pu-ter**।
2. কথা বলার সময় একটু ধীর গতিতে উচ্চারণ করুন এবং প্রতিটি অক্ষরের দিকে মনোযোগ দিন।
3. আপনার গাইড রোহিত/রিয়ার উচ্চারণ বারবার শুনে রেকর্ড করুন এবং তুলনা করুন।

#### 📝 অনুশীলনের জন্য বাক্য:
- *Please use the computer to submit the report.*
- *It is not difficult to learn a new language.*

পরবর্তী সেশনে দেখা হবে! আপনি খুব দ্রুত উন্নতি করছেন। 🌟
    `.trim();
  }
}

module.exports = new AIService();