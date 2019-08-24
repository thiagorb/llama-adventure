const enum Notes {
    G4 = 392,
    C5 = 523.25,
    G5 = 783.99,
    C6 = 1046.50,
    C7 = 2093.00
}

type SoundPlayer = (oscillator: OscillatorNode, gain: GainNode, audio: AudioContext) => void;

const createSound = (player: SoundPlayer) => {
    const getGain = cachedInstance(() => {
        const audio = getAudio();
        const gain = audio.createGain();
        gain.connect(audio.destination);
        gain.gain.setValueAtTime(0, audio.currentTime);
        return gain;
    });

    const getOscillator = cachedInstance(() => {
        const oscillator = getAudio().createOscillator();
        oscillator.connect(getGain());
        oscillator.start();
        return oscillator;
    });

    return () => player(getOscillator(), getGain(), getAudio())
};

const cachedInstance = <T>(initializer: () => T) => {
    let instance: T = null;

    return () => instance = instance || initializer();
};

const getAudio = cachedInstance(() => new AudioContext());

export const playJumpSound = createSound((oscillator, gain, audio) => {
    oscillator.frequency.setValueAtTime(Notes.G4, audio.currentTime);
    oscillator.frequency.linearRampToValueAtTime(Notes.G5, audio.currentTime + 0.25);
    gain.gain.setValueAtTime(0, audio.currentTime);
    gain.gain.linearRampToValueAtTime(1, audio.currentTime + 0.01);
    gain.gain.linearRampToValueAtTime(0, audio.currentTime + 0.25);
});

export const playCollectSound = createSound((oscillator, gain, audio) => {
    oscillator.frequency.setValueAtTime(Notes.C5, audio.currentTime);
    oscillator.frequency.setValueAtTime(Notes.C7, audio.currentTime + 0.12);
    gain.gain.setValueAtTime(0, audio.currentTime);
    gain.gain.linearRampToValueAtTime(1, audio.currentTime + 0.04);
    gain.gain.linearRampToValueAtTime(0, audio.currentTime + 0.8);
    gain.gain.linearRampToValueAtTime(1, audio.currentTime + 0.12);
    gain.gain.linearRampToValueAtTime(0, audio.currentTime + 0.5);
});
