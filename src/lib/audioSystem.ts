// Web Audio API based sound system for reliable audio playback

class AudioSystem {
  private audioContext: AudioContext | null = null;
  private initialized = false;

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

  // Generate a bell sound using Web Audio API synthesis
  playBell(): void {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Create multiple oscillators for rich bell sound
    const frequencies = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      
      // Bell-like envelope
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3 - i * 0.05, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 2);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 2);
    });

    // Add a slight metallic overtone
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

  // Generate a warning chime (softer, alerting)
  playWarning(): void {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Three ascending tones
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

  // Play a soft tick sound
  playTick(): void {
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
