// Warm up voices as early as possible in standard browsers
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
}

/**
 * Find a voice matching the desired gender preference and lang starts with 'en'
 * @param {string} gender 'MALE' | 'FEMALE'
 * @returns {SpeechSynthesisVoice | null}
 */
export const getVoiceForGender = (gender) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  const voices = window.speechSynthesis.getVoices();
  const englishVoices = voices.filter(v => v.lang.toLowerCase().startsWith('en'));
  if (englishVoices.length === 0) return null;

  const genderLower = (gender || 'MALE').toLowerCase();

  if (genderLower === 'female') {
    // Look for common female English voice names
    const femaleNames = [
      'samantha', 'zira', 'karen', 'veena', 'tessa', 'moira', 'hazel', 
      'susan', 'female', 'google us english', 'ria', 'riya', 'victoria', 
      'natural', 'guy', 'aaron', 'kathy', 'salli', 'joanna', 'ivy', 'kendra'
    ];
    for (const name of femaleNames) {
      const match = englishVoices.find(v => v.name.toLowerCase().includes(name));
      if (match) return match;
    }
    // Fallback: search for voice names that do not contain typical male indicators
    const notMale = englishVoices.find(v => {
      const nameLower = v.name.toLowerCase();
      return !nameLower.includes('david') && !nameLower.includes('mark') && 
             !nameLower.includes('george') && !nameLower.includes('male') && 
             !nameLower.includes('ravi') && !nameLower.includes('microsoft');
    });
    if (notMale) return notMale;
  } else {
    // MALE
    const maleNames = ['david', 'mark', 'george', 'ravi', 'male', 'google uk english male', 'alex', 'daniel', 'natural'];
    for (const name of maleNames) {
      const match = englishVoices.find(v => v.name.toLowerCase().includes(name));
      if (match) return match;
    }
  }
  return englishVoices[0]; // fallback
};

/**
 * Synthesize speech for the given text.
 * @param {string} text The English text to speak
 * @param {string} gender 'MALE' | 'FEMALE'
 * @param {function} onStart Callback on start
 * @param {function} onEnd Callback on end
 */
export const speakText = (text, gender, onStart, onEnd) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this environment.');
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.8; // slightly slower for learners

  const voice = getVoiceForGender(gender);
  if (voice) {
    utterance.voice = voice;
  }

  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;

  window.speechSynthesis.speak(utterance);
};
