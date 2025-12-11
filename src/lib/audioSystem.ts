// Web Audio API based sound system for reliable audio playback

export type BellSound = 'classic' | 'school' | 'gong' | 'chime' | 'schoolbell-loud' | 'boxing';

export const BELL_SOUNDS: { id: BellSound; name: string }[] = [
  { id: 'classic', name: 'Classic Bell' },
  { id: 'school', name: 'School Bell' },
  { id: 'gong', name: 'Gong' },
  { id: 'chime', name: 'Chime' },
  { id: 'schoolbell-loud', name: 'Loud School Bell' },
  { id: 'boxing', name: 'Boxing Bell' },
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
  async playBell(soundId: BellSound = 'classic'): Promise<void> {
    if (this.muted) return;
    
    await this.resume();
    
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
      case 'schoolbell-loud':
        await this.playMP3('/sounds/schoolbell-loud.mp3');
        break;
      case 'boxing':
        await this.playMP3('/sounds/boxing-bell.mp3');
        break;
      default:
        this.playClassicBell();
    }
  }

  // Test a sound (bypasses mute)
  async testSound(soundId: BellSound): Promise<void> {
    const wasMuted = this.muted;
    this.muted = false;
    await this.resume();
    await this.playBell(soundId);
    this.muted = wasMuted;
  }

  // Test warning sound
  async testWarningSound(soundId: BellSound): Promise<void> {
    const wasMuted = this.muted;
    this.muted = false;
    await this.resume();
    this.playWarning(soundId);
    this.muted = wasMuted;
  }

  // Classic bell - original rich bell sound (loud, long)
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
      gain.gain.linearRampToValueAtTime(0.4 - i * 0.06, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 2.5);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 2.5);
    });

    const metalOsc = ctx.createOscillator();
    const metalGain = ctx.createGain();
    
    metalOsc.type = 'triangle';
    metalOsc.frequency.setValueAtTime(2093, now);
    
    metalGain.gain.setValueAtTime(0, now);
    metalGain.gain.linearRampToValueAtTime(0.15, now + 0.005);
    metalGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    
    metalOsc.connect(metalGain);
    metalGain.connect(ctx.destination);
    
    metalOsc.start(now);
    metalOsc.stop(now + 0.6);
  }

  // School bell - rapid ringing pattern (loud)
  private playSchoolBell(): void {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    for (let ring = 0; ring < 6; ring++) {
      const startTime = now + ring * 0.2;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, startTime);
      osc.frequency.setValueAtTime(660, startTime + 0.05);
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.18);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + 0.18);
    }
  }

  // Gong - deep, resonant tone (loud, long)
  private playGong(): void {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const frequencies = [65.41, 130.81, 196.0, 261.63];
    
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      
      const volume = 0.35 - i * 0.06;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 5);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 5);
    });

    const shimmer = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    
    shimmer.type = 'triangle';
    shimmer.frequency.setValueAtTime(1318.5, now);
    
    shimmerGain.gain.setValueAtTime(0, now);
    shimmerGain.gain.linearRampToValueAtTime(0.05, now + 0.1);
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
    
    shimmer.connect(shimmerGain);
    shimmerGain.connect(ctx.destination);
    
    shimmer.start(now);
    shimmer.stop(now + 2.5);
  }

  // Chime - gentle, melodic (loud version for end bell)
  private playChime(): void {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.5, 783.99];
    
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      const startTime = now + i * 0.15;
      osc.frequency.setValueAtTime(freq, startTime);
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 1.2);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + 1.2);
    });
  }

  // 5-minute warning sound (softer, shorter based on bell type)
  playWarning(soundId: BellSound = 'classic'): void {
    if (this.muted) return;
    
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Soft warning based on bell type
    switch (soundId) {
      case 'gong':
        // Soft single gong hit
        this.playSoftGong();
        break;
      case 'school':
        // Two quick soft rings
        this.playSoftSchoolRing();
        break;
      case 'chime':
        // Three ascending notes
        this.playSoftChime();
        break;
      case 'schoolbell-loud':
        // Play MP3 at lower volume for warning
        this.playMP3('/sounds/schoolbell-loud.mp3', 0.3);
        break;
      case 'boxing':
        // Play MP3 at lower volume for warning
        this.playMP3('/sounds/boxing-bell.mp3', 0.4);
        break;
      default:
        // Default ascending tones
        const notes = [392, 493.88, 587.33];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.15);
          
          gain.gain.setValueAtTime(0, now + i * 0.15);
          gain.gain.linearRampToValueAtTime(0.15, now + i * 0.15 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.4);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(now + i * 0.15);
          osc.stop(now + i * 0.15 + 0.4);
        });
    }
  }

  // 2-minute warning sound (more urgent but still softer than end bell)
  playTwoMinuteWarning(soundId: BellSound = 'classic'): void {
    if (this.muted) return;
    
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Double the warning pattern for urgency
    for (let i = 0; i < 2; i++) {
      const offset = i * 0.5;
      
      switch (soundId) {
        case 'gong':
          this.playSoftGong(offset);
          break;
        case 'school':
          this.playSoftSchoolRing(offset);
          break;
        case 'chime':
          this.playSoftChime(offset);
          break;
        case 'schoolbell-loud':
          if (i === 0) this.playMP3('/sounds/schoolbell-loud.mp3', 0.4);
          break;
        case 'boxing':
          if (i === 0) this.playMP3('/sounds/boxing-bell.mp3', 0.5);
          break;
        default:
          const notes = [523.25, 659.25, 783.99];
          notes.forEach((freq, j) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + offset + j * 0.1);
            
            gain.gain.setValueAtTime(0, now + offset + j * 0.1);
            gain.gain.linearRampToValueAtTime(0.2, now + offset + j * 0.1 + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.01, now + offset + j * 0.1 + 0.3);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(now + offset + j * 0.1);
            osc.stop(now + offset + j * 0.1 + 0.3);
          });
      }
    }
  }

  private playSoftGong(offset: number = 0): void {
    const ctx = this.getContext();
    const now = ctx.currentTime + offset;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(130.81, now);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 1.5);
  }

  private playSoftSchoolRing(offset: number = 0): void {
    const ctx = this.getContext();
    const now = ctx.currentTime + offset;

    for (let ring = 0; ring < 2; ring++) {
      const startTime = now + ring * 0.15;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(660, startTime);
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.08, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.12);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + 0.12);
    }
  }

  private playSoftChime(offset: number = 0): void {
    const ctx = this.getContext();
    const now = ctx.currentTime + offset;

    const notes = [523.25, 659.25, 783.99];
    
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      const startTime = now + i * 0.12;
      osc.frequency.setValueAtTime(freq, startTime);
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.12, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + 0.5);
    });
  }

  // Play an MP3 file with optional volume control
  private async playMP3(url: string, volume: number = 1.0): Promise<void> {
    try {
      const ctx = this.getContext();
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      
      const source = ctx.createBufferSource();
      const gainNode = ctx.createGain();
      
      source.buffer = audioBuffer;
      gainNode.gain.value = volume;
      
      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      source.start(0);
    } catch (error) {
      console.error('Error playing MP3:', error);
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
