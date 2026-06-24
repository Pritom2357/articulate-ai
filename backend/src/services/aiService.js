const { GoogleGenerativeAI } = require('@google/generative-ai');
const denoiserClient = require('./denoiserClient.js');

class AIService {
  constructor() {
    this.azureKey = process.env.AZURE_SPEECH_KEY;
    this.azureRegion = process.env.AZURE_SPEECH_REGION || 'southeastasia';
    
    // For Gemini, support GEMINI_API_KEY or GOOGLE_API_KEY
    this.geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
    this.ai = null;
    
    if (this.geminiKey) {
      try {
        // Initialize Gemini client using GoogleGenAI
        this.ai = new GoogleGenerativeAI(this.geminiKey);
      } catch (err) {
        console.error('Failed to initialize Gemini AI client:', err.message);
      }
    } else {
      console.warn('⚠️ GEMINI_API_KEY is missing. Falling back to mock responses for IELTS conversation assessment.');
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
    
    if (!this.ai) {
      return this._mockConversationAssessment(chatMessages, keyPoints);
    }

    try {
      const model = this.ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `
        You are an experienced IELTS Speaking Examiner. Evaluate the following conversation transcript between a student and an examiner.
        
        The speaking topic had these key conceptual points that the student was expected to hit or mention (directly or conceptually):
        ${JSON.stringify(keyPoints)}

        Here is the transcript:
        ${transcript}

        Analyze the student's speaking performance and output a JSON response containing:
        1. "ielts_band" (float, e.g. 5.5, 6.0, 7.5, etc. out of 9)
        2. "accuracy_score" (integer, 0-100)
        3. "feedback_bn" (string - detailed examiner feedback written in BANGLA first-person, encouraging and professional, outlining strengths and areas of improvement)
        4. "key_points_found" (array of strings - key points from the list that the user successfully mentioned)
        5. "key_points_missing" (array of strings - key points that the user missed)
        
        Format the output as a clean, parseable JSON block. DO NOT wrap it in markdown code fences (\`\`\`json).
      `;

      const result = await model.generateContent(prompt);

      const responseText = result.response.text().trim();
      
      // Clean JSON if wrapped in code fences
      const cleanJson = responseText.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
      return JSON.parse(cleanJson);

    } catch (error) {
      console.error('Gemini Conversation Assessment failed, returning mock:', error.message);
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
    const weakWordsString = weakWords.length > 0
      ? weakWords.map(w => `"${w.word}" (Bangla: ${w.bangla_meaning}, wrong count: ${w.wrong_count})`).join(', ')
      : 'None (did great!)';

    if (!this.ai) {
      return this._mockRagSession(name, level, weakWords);
    }

    try {
      const model = this.ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `
        You are an AI English Tutor guiding a Bengali student named "${name}" who is at level "${level}".
        
        Based on the student's recent performance, here are the English words they struggled with (wrong pronunciation attempts):
        ${weakWordsString}

        Generate a personalized next study session recommendation for the student.
        - The response MUST be written in BANGLA.
        - Give a warm, encouraging message from the tutor.
        - Suggest 3 concrete tips to practice these specific words (explain phoneme errors, e.g. how to pronounce the 't' in 'computer' or syllables).
        - Create 2 simple practice sentences incorporating their weak words.
        - Suggest a fun task for the next lesson.
        
        Keep it concise, well-structured, and highly engaging. Output as standard markdown.
      `;

      const result = await model.generateContent(prompt);

      return result.response.text().trim();

    } catch (error) {
      console.error('Gemini RAG generation failed, returning mock:', error.message);
      return this._mockRagSession(name, level, weakWords);
    }
  }

  /**
   * General AI English chat response
   * @param {Array} chatMessages - List of { role: 'user'|'assistant', content: string }
   * @returns {Promise<string>} - AI response
   */
  async generateChatResponse(chatMessages) {
    if (!this.ai) {
      return "Hello! I am your Articulate AI English Guide. I am here to help you practice English! (Note: Gemini API key is not configured, so I am running in demo mode. Try typing some English sentences!)";
    }

    try {
      const model = this.ai.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: `You are "Articulate AI English Guide", a friendly, encouraging personal English tutor helping a Bengali-speaking student learn and practice English.
        - Respond primarily in simple, correct, and friendly English.
        - If the student makes spelling, grammar, or word choice errors in their message, gently point them out and show how to say it correctly, using a mix of English and simple Bangla where helpful.
        - Keep your responses concise (2-4 sentences max) so it feels like a real chat conversation.`
      });

      // Map chat messages to the format Gemini expects
      const formattedContents = chatMessages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const chat = model.startChat({ history: formattedContents.slice(0, -1) });
      const lastMessage = formattedContents[formattedContents.length - 1];
      const result = await chat.sendMessage(lastMessage?.parts?.[0]?.text || '');

      return result.response.text().trim();
    } catch (error) {
      console.error('Gemini general chat failed:', error.message);
      return "Hello! I noticed a connection issue, but let's keep practicing. Tell me about your day in English!";
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

    if (!this.ai) {
      return weakPhonemes.map(p => p.tipBn).filter(Boolean)[0]
        || 'এই ধ্বনিগুলো নিয়ে আরেকটু অনুশীলন করুন।';
    }

    try {
      const model = this.ai.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: { maxOutputTokens: 150 }
      });

      const phonemeList = weakPhonemes
        .map(p => `/${p.phoneme}/ (score: ${p.score}${p.tipBn ? `, known tip: "${p.tipBn}"` : ''})`)
        .join(', ');

      const prompt = `
        A Bengali student learning English pronunciation scored low on these IPA phonemes: ${phonemeList}.
        Write ONE short, actionable tip in BANGLA (max 2 sentences) to help them improve these specific sounds.
        Use the known tips as a base if given, but make it feel like one cohesive piece of advice rather than a list.
        Return ONLY the tip text in Bangla — no preamble, no English, no markdown.
      `;

      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (error) {
      console.error('Gemini pronunciation feedback failed, returning fallback tip:', error.message);
      return weakPhonemes.map(p => p.tipBn).filter(Boolean)[0]
        || 'এই ধ্বনিগুলো নিয়ে আরেকটু অনুশীলন করুন।';
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
        word: word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,""),
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
