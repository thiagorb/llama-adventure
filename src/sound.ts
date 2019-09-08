import { cachedInstance } from './utils';

const enum Notes {
    C3 = 130.81,
    Db3 = 138.59,
    D3 = 146.83,
    Eb3 = 155.56,
    C4 = 261.63,
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

const sounds: { [key: string]: SoundPlayer } = {
    jump: (oscillator, gain, audio) => {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(Notes.G4, audio.currentTime);
        oscillator.frequency.linearRampToValueAtTime(Notes.G5, audio.currentTime + 0.25);
        gain.gain.setValueAtTime(0, audio.currentTime);
        gain.gain.linearRampToValueAtTime(1, audio.currentTime + 0.01);
        gain.gain.linearRampToValueAtTime(0, audio.currentTime + 0.25);
    },

    collect: (oscillator, gain, audio) => {
        oscillator.type = 'sine';
        notePlayer.start(oscillator, gain, audio);
        notePlayer.play(Notes.C5, 0.06, 0.00, 0.02, 0.3);
        notePlayer.play(Notes.C7, 0.05, 0, 0.4, 0.7);
    },

    win: (oscillator, gain, audio) => {
        oscillator.type = 'sawtooth';
        notePlayer.start(oscillator, gain, audio);
        notePlayer.play(Notes.C4, 0.1, 0.1, 0.2, 0.5);
        notePlayer.play(Notes.C4, 0.1, 0, 0.1, 0.5);
        notePlayer.play(Notes.G4, 0.1, 0.2, 0.8, 0.5);
    },

    lose: (oscillator, gain, audio) => {
        oscillator.type = 'sawtooth';
        notePlayer.start(oscillator, gain, audio);
        notePlayer.play(Notes.Eb3, 0.3, 0, 0.2, 0.4);
        notePlayer.play(Notes.D3, 0.3, 0, 0.2, 0.4);
        notePlayer.play(Notes.Db3, 0.3, 0, 0.2, 0.4);
        notePlayer.play(Notes.C3, 0.3, 0, 0.8, 0.4);
    },
};

const notePlayer = {
    currentTime: 0,

    gain: null,

    oscillator: null,

    start (oscillator, gain, audio) {
        this.currentTime = audio.currentTime;
        this.oscillator = oscillator;
        this.gain = gain;
    },

    pause (time: number) {
        this.currentTime += time;
    },

    play (frequency: number, attack: number, sustain: number, decay: number, gain: number = 1) {
        const attackEnd = this.currentTime + attack;
        const sustainEnd = attackEnd + sustain;
        const decayEnd = sustainEnd + decay;
        this.oscillator.frequency.setValueAtTime(frequency, this.currentTime);
        this.gain.gain.linearRampToValueAtTime(gain, attackEnd);
        this.gain.gain.linearRampToValueAtTime(gain, sustainEnd);
        this.gain.gain.linearRampToValueAtTime(0, decayEnd);
        this.currentTime = decayEnd;
    }
};

export const play = (sound: keyof typeof sounds) => getSoundPlayer()(sounds[sound]);

