import * as Tone from 'tone';

class SoundService {
  private ringtoneLoop: Tone.Pattern<string> | null = null;
  private ringSynth: Tone.Synth | null = null;
  private isRinging: boolean = false;
  private isInitialized: boolean = false;

  private async ensureAudioContext() {
    try {
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }
      this.isInitialized = true;
    } catch {
      // Audio context might be restricted before user gesture
    }
  }

  // Incoming Call Ringtone using Tone.js pattern specified in prompt
  public async startRingtone() {
    if (this.isRinging) return;
    try {
      await this.ensureAudioContext();
      this.stopRingtone();

      this.ringSynth = new Tone.Synth({
        oscillator: { type: 'square' },
        envelope: { attack: 0.05, decay: 0.1, sustain: 0.3, release: 0.1 },
        volume: -8
      }).toDestination();

      const notes = ['G4', 'G4', 'G4', 'E4', 'G4', 'G4', 'G4', 'E4'];
      
      this.ringtoneLoop = new Tone.Pattern((time, note) => {
        if (this.ringSynth) {
          this.ringSynth.triggerAttackRelease(note, 0.1, time);
        }
      }, notes);

      Tone.getTransport().bpm.value = 80;
      this.ringtoneLoop.interval = '8n';
      this.ringtoneLoop.start(0);
      Tone.getTransport().start();
      this.isRinging = true;
    } catch (err) {
      console.warn('Could not start Tone.js ringtone, playing fallback sound', err);
      this.playWebAudioRingtone();
    }
  }

  // Fallback pure Web Audio API synthesizer in case Tone transport is locked
  private webAudioOsc: OscillatorNode | null = null;
  private webAudioInterval: number | null = null;

  private playWebAudioRingtone() {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      let step = 0;
      const notes = [392, 392, 392, 329.63, 392, 392, 392, 329.63]; // G4 and E4
      
      this.webAudioInterval = window.setInterval(() => {
        if (!this.isRinging) {
          if (this.webAudioInterval) clearInterval(this.webAudioInterval);
          return;
        }
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(notes[step % notes.length], ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
        step++;
      }, 250);
      this.isRinging = true;
    } catch {
      // ignore
    }
  }

  public stopRingtone() {
    this.isRinging = false;
    try {
      if (this.ringtoneLoop) {
        this.ringtoneLoop.stop();
        this.ringtoneLoop.dispose();
        this.ringtoneLoop = null;
      }
      if (this.ringSynth) {
        this.ringSynth.dispose();
        this.ringSynth = null;
      }
      Tone.getTransport().stop();
      Tone.getTransport().cancel();
    } catch (e) {
      console.error(e);
    }

    if (this.webAudioInterval) {
      clearInterval(this.webAudioInterval);
      this.webAudioInterval = null;
    }
  }

  // Outgoing ring sound (so caller hears standard calling dial tone)
  public async playOutgoingBeep() {
    try {
      await this.ensureAudioContext();
      const synth = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.1, decay: 0.2, sustain: 0.8, release: 0.2 },
        volume: -12
      }).toDestination();
      synth.triggerAttackRelease('A4', 0.8);
      setTimeout(() => synth.dispose(), 1500);
    } catch {
      // fallback
    }
  }

  // Call connected sound
  public async playCallConnect() {
    try {
      await this.ensureAudioContext();
      const synth = new Tone.Synth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.1 },
        volume: -10
      }).toDestination();
      synth.triggerAttackRelease('C5', '16n');
      setTimeout(() => {
        synth.triggerAttackRelease('G5', '16n');
      }, 100);
      setTimeout(() => synth.dispose(), 1000);
    } catch {
      // ignore
    }
  }

  // Hangup / End call sound
  public async playHangup() {
    try {
      await this.ensureAudioContext();
      const synth = new Tone.Synth({
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.05, decay: 0.2, sustain: 0, release: 0.1 },
        volume: -10
      }).toDestination();
      synth.triggerAttackRelease('E4', '8n');
      setTimeout(() => {
        synth.triggerAttackRelease('C4', '8n');
      }, 150);
      setTimeout(() => synth.dispose(), 1000);
    } catch {
      // ignore
    }
  }

  // Message incoming chime
  public async playMessageChime() {
    try {
      await this.ensureAudioContext();
      const synth = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.05, release: 0.1 },
        volume: -14
      }).toDestination();
      synth.triggerAttackRelease('F5', '32n');
      setTimeout(() => {
        synth.triggerAttackRelease('A5', '16n');
      }, 80);
      setTimeout(() => synth.dispose(), 1000);
    } catch {
      // ignore
    }
  }
}

export const soundService = new SoundService();
