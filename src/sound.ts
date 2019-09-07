import { cachedInstance } from './utils';

const enum Notes {
    G4 = 392,
    C5 = 523.25,
    G5 = 783.99,
    C6 = 1046.50,
    C7 = 2093.00
}

type SoundPlayer = (oscillator: OscillatorNode, gain: GainNode, audio: AudioContext) => void;

const dummyPlaySound = () => undefined;

export const getAudio = cachedInstance((): AudioContext => {
    if (typeof AudioContext !== 'undefined') {
        return new AudioContext();
    }

    // @ts-ignore
    if (typeof window.webkitAudioContext !== 'undefined') {
        // @ts-ignore
        return new window.webkitAudioContext();
    }

    return null;
});

const jumpSound = (oscillator, gain, audio) => {
    oscillator.frequency.setValueAtTime(Notes.G4, audio.currentTime);
    oscillator.frequency.linearRampToValueAtTime(Notes.G5, audio.currentTime + 0.25);
    gain.gain.setValueAtTime(0, audio.currentTime);
    gain.gain.linearRampToValueAtTime(1, audio.currentTime + 0.01);
    gain.gain.linearRampToValueAtTime(0, audio.currentTime + 0.25);
};

const collectSound = (oscillator, gain, audio) => {
    oscillator.frequency.setValueAtTime(Notes.C5, audio.currentTime);
    oscillator.frequency.setValueAtTime(Notes.C7, audio.currentTime + 0.12);
    gain.gain.setValueAtTime(0, audio.currentTime);
    gain.gain.linearRampToValueAtTime(1, audio.currentTime + 0.04);
    gain.gain.linearRampToValueAtTime(0, audio.currentTime + 0.8);
    gain.gain.linearRampToValueAtTime(1, audio.currentTime + 0.12);
    gain.gain.linearRampToValueAtTime(0, audio.currentTime + 0.5);
};

const getSoundPlayer = cachedInstance(() => {
    const audio = getAudio();

    if (!audio) {
        return dummyPlaySound;
    }

    const createGain = () => {
        const gain = audio.createGain();
        gain.connect(audio.destination);
        gain.gain.setValueAtTime(0, audio.currentTime);
        return gain;
    };

    const createOscillator = (gain: GainNode) => {
        const oscillator = getAudio().createOscillator();
        oscillator.connect(gain);
        oscillator.start();
        return oscillator;
    };

    const MAX_CONCURRENT_SOUNDS = 10;
    const nodes: Array<{ gain: GainNode, oscillator: OscillatorNode }> = [];
    for (let i = 0; i < MAX_CONCURRENT_SOUNDS; i++) {
        const gain = createGain();
        nodes.push({ gain, oscillator: createOscillator(gain) });
    }
    let nextNode = 0;

    return (player: SoundPlayer) => {
        const node = nodes[nextNode];
        nextNode = (nextNode + 1) % MAX_CONCURRENT_SOUNDS;
        player(node.oscillator, node.gain, audio);
    }
});

export const playJumpSound = () => getSoundPlayer()(jumpSound);

export const playCollectSound = () => getSoundPlayer()(collectSound);
