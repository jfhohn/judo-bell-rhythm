// Web Audio API based sound system for reliable audio playback

export type BellSound = 'classic' | 'school' | 'gong' | 'chime';

export const BELL_SOUNDS: { id: BellSound; name: string }[] = [
  { id: 'classic', name: 'Classic Bell' },
  { id: 'school', name: 'School Bell' },
  { id: 'gong', name: 'Gong' },
  { id: 'chime', name: 'Chime' },
];

class AudioSystem {
  private audioContext: AudioContext | null = null;
  private initialized = false;
  private muted = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.initialized = true;
  }

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.initialized = true;
    }
    return this.audioContext;
  }

  async resume(): Promise<void> {
    const ctx = this.getContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  // Play a specific bell sound
  playBell(soundId: BellSound = 'classic'): void {
    if (this.muted) return;
    
    switch (soundId) {
      case 'classic':
        this.playClassicBell();
        break;
      case 'school':
        this.playSchoolBell();
        break;
      case 'gong':
        this.playGong();
        break;
      case 'chime':
        this.playChime();
        break;
      default:
        this.playClassicBell();
    }
  }

  // Test a sound (bypasses mute)
  testSound(soundId: BellSound): void {
    const wasMuted = this.muted;
    this.muted = false;
    this.playBell(soundId);
    this.muted = wasMuted;
  }

  // Classic bell - original rich bell sound
  private playClassicBell(): void {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const frequencies = [523.25, 659.25, 783.99, 1046.5];
    
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3 - i * 0.05, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 2);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 2);
    });

    const metalOsc = ctx.createOscillator();
    const metalGain = ctx.createGain();
    
    metalOsc.type = 'triangle';
    metalOsc.frequency.setValueAtTime(2093, now);
    
    metalGain.gain.setValueAtTime(0, now);
    metalGain.gain.linearRampToValueAtTime(0.1, now + 0.005);
    metalGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    
    metalOsc.connect(metalGain);
    metalGain.connect(ctx.destination);
    
    metalOsc.start(now);
    metalOsc.stop(now + 0.5);
  }

  // School bell - rapid ringing pattern
  private playSchoolBell(): void {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    for (let ring = 0; ring < 4; ring++) {
      const startTime = now + ring * 0.25;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, startTime);
      osc.frequency.setValueAtTime(660, startTime + 0.05);
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.15, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + 0.2);
    }
  }

  // Gong - deep, resonant tone
  private playGong(): void {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Main gong tone
    const frequencies = [65.41, 130.81, 196.0, 261.63]; // C2, C3, G3, C4
    
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      
      const volume = 0.25 - i * 0.04;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 4);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 4);
    });

    // Add shimmer
    const shimmer = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    
    shimmer.type = 'triangle';
    shimmer.frequency.setValueAtTime(1318.5, now);
    
    shimmerGain.gain.setValueAtTime(0, now);
    shimmerGain.gain.linearRampToValueAtTime(0.03, now + 0.1);
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 2);
    
    shimmer.connect(shimmerGain);
    shimmerGain.connect(ctx.destination);
    
    shimmer.start(now);
    shimmer.stop(now + 2);
  }

  // Chime - gentle, melodic
  private playChime(): void {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.5, 783.99]; // C5, E5, G5, C6, G5
    
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      const startTime = now + i * 0.15;
      osc.frequency.setValueAtTime(freq, startTime);
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 1);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + 1);
    });
  }

  // 5-minute warning sound
  playWarning(): void {
    if (this.muted) return;
    
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const notes = [392, 493.88, 587.33]; // G4, B4, D5
    
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.15);
      
      gain.gain.setValueAtTime(0, now + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.2, now + i * 0.15 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.4);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.4);
    });
  }

  // 2-minute warning sound (more urgent)
  playTwoMinuteWarning(): void {
    if (this.muted) return;
    
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Two quick ascending tones
    for (let i = 0; i < 2; i++) {
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      const offset = i * 0.6;
      
      notes.forEach((freq, j) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + offset + j * 0.1);
        
        gain.gain.setValueAtTime(0, now + offset + j * 0.1);
        gain.gain.linearRampToValueAtTime(0.25, now + offset + j * 0.1 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, now + offset + j * 0.1 + 0.3);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now + offset + j * 0.1);
        osc.stop(now + offset + j * 0.1 + 0.3);
      });
    }
  }

  // Play a soft tick sound
  playTick(): void {
    if (this.muted) return;
    
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.05, now + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.05);
  }
}

export const audioSystem = new AudioSystem();
