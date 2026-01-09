/**
 * Speech Helper for Text-to-Speech
 * Optimized for children - slower rate for better comprehension
 */

/**
 * Speak text using Web Speech API
 * @param {string} text - Text to speak
 * @param {object} options - Speech options
 * @param {number} options.rate - Speech rate (0.1-10, default: 0.5 for kids)
 * @param {string} options.lang - Language code (default: 'th-TH')
 * @param {number} options.pitch - Pitch (0-2, default: 1)
 * @param {number} options.volume - Volume (0-1, default: 1)
 */
export const speakText = (text, options = {}) => {
  if (!text) return;

  // Stop any ongoing speech
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Default settings optimized for children
  utterance.lang = options.lang || 'th-TH';
  utterance.rate = options.rate || 0.5; // Slower for kids (0.5 = half speed)
  utterance.pitch = options.pitch || 1;
  utterance.volume = options.volume || 1;

  // Handle speech end
  utterance.onend = () => {
    if (options.onEnd) options.onEnd();
  };

  // Handle speech error
  utterance.onerror = (error) => {
    console.error('Speech synthesis error:', error);
    if (options.onError) options.onError(error);
  };

  window.speechSynthesis.speak(utterance);
};

/**
 * Stop current speech
 */
export const stopSpeech = () => {
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }
};

/**
 * Check if speech is currently playing
 */
export const isSpeaking = () => {
  return window.speechSynthesis.speaking;
};

/**
 * Speak with pause between words (for better comprehension)
 * @param {string[]} words - Array of words to speak
 * @param {number} pauseMs - Pause between words in milliseconds
 */
export const speakWordsWithPause = (words, pauseMs = 500) => {
  if (!words || words.length === 0) return;

  let currentIndex = 0;

  const speakNext = () => {
    if (currentIndex < words.length) {
      speakText(words[currentIndex], {
        onEnd: () => {
          currentIndex++;
          if (currentIndex < words.length) {
            setTimeout(speakNext, pauseMs);
          }
        }
      });
    }
  };

  speakNext();
};

