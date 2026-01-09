export const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
};

export const speak = (text, lang = 'th-TH') => {
    if (!('speechSynthesis' in window)) {
        console.warn('Text-to-speech not supported');
        return;
    }

    // Cancel any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9; // Slightly slower for kids
    utterance.pitch = 1.0;

    // Try to set a Thai voice if available
    const voices = window.speechSynthesis.getVoices();
    const thaiVoice = voices.find(v => v.lang === 'th-TH' || v.name.includes('Thai'));

    if (thaiVoice) {
        utterance.voice = thaiVoice;
    }

    window.speechSynthesis.speak(utterance);
};
