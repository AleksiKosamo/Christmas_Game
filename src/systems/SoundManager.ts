export class SoundManager {
    private context: AudioContext;
    private masterGain: GainNode;

    constructor() {
        this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.masterGain = this.context.createGain();
        this.masterGain.gain.value = 0.3; // Low volume
        this.masterGain.connect(this.context.destination);
    }

    playShoot() {
        // High pitch short beep (snowball throw)
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.context.currentTime + 0.1);

        gain.gain.setValueAtTime(1, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);

        osc.start();
        osc.stop(this.context.currentTime + 0.1);
    }

    playHit() {
        // Low thud
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = 'square';
        osc.frequency.setValueAtTime(150, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.context.currentTime + 0.1);

        gain.gain.setValueAtTime(1, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);

        osc.start();
        osc.stop(this.context.currentTime + 0.1);
    }

    playDash() {
        // Whoosh noise (Noise buffer or swept filter)
        // Simulating noise with many oscillators is expensive, let's use a quick low freq sweep
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.context.currentTime + 0.2);

        gain.gain.setValueAtTime(0.3, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.2);

        osc.start();
        osc.stop(this.context.currentTime + 0.2);
    }

    playLevelUp() {
        // Jingle
        const now = this.context.currentTime;
        this.playTone(523.25, now, 0.2); // C5
        this.playTone(659.25, now + 0.2, 0.2); // E5
        this.playTone(783.99, now + 0.4, 0.4); // G5
        this.playTone(1046.50, now + 0.8, 0.6); // C6
    }

    private playTone(freq: number, time: number, duration: number) {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0.5, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration);

        osc.start(time);
        osc.stop(time + duration);
    }
}
