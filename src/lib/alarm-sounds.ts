// Professional Alarm Sound Engine
// Generates 10 unique alarm sounds using Web Audio API
// Supports: volume control, infinite looping, gradual volume, test preview

import type { AlarmSound } from '@/types/app';

interface AlarmSoundConfig {
  generate: (ctx: AudioContext, gainNode: GainNode) => { nodes: AudioNode[]; duration: number };
}

// ── Sound Definitions ──────────────────────────────────────

const SOUND_CONFIGS: Record<AlarmSound, AlarmSoundConfig> = {
  classic: {
    // Classic alarm clock: alternating high-low beeps
    generate(ctx, gain) {
      const nodes: AudioNode[] = [];
      const dur = 1.6;
      const t = ctx.currentTime;
      for (let i = 0; i < 4; i++) {
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.value = i % 2 === 0 ? 880 : 660;
        osc.connect(gain);
        osc.start(t + i * 0.4);
        osc.stop(t + i * 0.4 + 0.3);
        nodes.push(osc);
      }
      return { nodes, duration: dur };
    },
  },
  digital: {
    // Digital beep pattern: short rapid beeps
    generate(ctx, gain) {
      const nodes: AudioNode[] = [];
      const dur = 1.2;
      const t = ctx.currentTime;
      for (let i = 0; i < 6; i++) {
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.value = 1000;
        osc.connect(gain);
        osc.start(t + i * 0.2);
        osc.stop(t + i * 0.2 + 0.1);
        nodes.push(osc);
      }
      return { nodes, duration: dur };
    },
  },
  gentle: {
    // Gentle wake: soft ascending sine waves
    generate(ctx, gain) {
      const nodes: AudioNode[] = [];
      const dur = 2.4;
      const t = ctx.currentTime;
      const freqs = [330, 392, 440, 523, 587, 659];
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = f;
        const env = ctx.createGain();
        env.gain.setValueAtTime(0, t + i * 0.4);
        env.gain.linearRampToValueAtTime(0.8, t + i * 0.4 + 0.15);
        env.gain.exponentialRampToValueAtTime(0.001, t + i * 0.4 + 0.38);
        osc.connect(env);
        env.connect(gain);
        osc.start(t + i * 0.4);
        osc.stop(t + i * 0.4 + 0.4);
        nodes.push(osc, env);
      });
      return { nodes, duration: dur };
    },
  },
  urgent: {
    // Urgent alarm: fast pulsing sawtooth
    generate(ctx, gain) {
      const nodes: AudioNode[] = [];
      const dur = 1.0;
      const t = ctx.currentTime;
      for (let i = 0; i < 8; i++) {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = 940 + (i % 2) * 200;
        const env = ctx.createGain();
        env.gain.setValueAtTime(0.7, t + i * 0.125);
        env.gain.exponentialRampToValueAtTime(0.001, t + i * 0.125 + 0.1);
        osc.connect(env);
        env.connect(gain);
        osc.start(t + i * 0.125);
        osc.stop(t + i * 0.125 + 0.12);
        nodes.push(osc, env);
      }
      return { nodes, duration: dur };
    },
  },
  nature: {
    // Nature: bird-like chirps with frequency modulation
    generate(ctx, gain) {
      const nodes: AudioNode[] = [];
      const dur = 2.0;
      const t = ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, t + i * 0.7);
        osc.frequency.linearRampToValueAtTime(2400, t + i * 0.7 + 0.1);
        osc.frequency.linearRampToValueAtTime(1600, t + i * 0.7 + 0.25);
        osc.frequency.linearRampToValueAtTime(2000, t + i * 0.7 + 0.35);
        const env = ctx.createGain();
        env.gain.setValueAtTime(0, t + i * 0.7);
        env.gain.linearRampToValueAtTime(0.5, t + i * 0.7 + 0.05);
        env.gain.exponentialRampToValueAtTime(0.001, t + i * 0.7 + 0.45);
        osc.connect(env);
        env.connect(gain);
        osc.start(t + i * 0.7);
        osc.stop(t + i * 0.7 + 0.5);
        nodes.push(osc, env);
      }
      return { nodes, duration: dur };
    },
  },
  bell: {
    // Church bell: rich harmonic sine cluster with long decay
    generate(ctx, gain) {
      const nodes: AudioNode[] = [];
      const dur = 2.5;
      const t = ctx.currentTime;
      const harmonics = [1, 2.76, 4.07, 5.4];
      for (let strike = 0; strike < 2; strike++) {
        harmonics.forEach((h, i) => {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.value = 340 * h;
          const env = ctx.createGain();
          const amp = 0.6 / (i + 1);
          env.gain.setValueAtTime(amp, t + strike * 1.25);
          env.gain.exponentialRampToValueAtTime(0.001, t + strike * 1.25 + 1.2);
          osc.connect(env);
          env.connect(gain);
          osc.start(t + strike * 1.25);
          osc.stop(t + strike * 1.25 + 1.2);
          nodes.push(osc, env);
        });
      }
      return { nodes, duration: dur };
    },
  },
  siren: {
    // Emergency siren: sweeping frequency
    generate(ctx, gain) {
      const nodes: AudioNode[] = [];
      const dur = 2.0;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.linearRampToValueAtTime(1200, t + 1.0);
      osc.frequency.linearRampToValueAtTime(600, t + 2.0);
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.5, t);
      osc.connect(env);
      env.connect(gain);
      osc.start(t);
      osc.stop(t + dur);
      nodes.push(osc, env);
      return { nodes, duration: dur };
    },
  },
  melody: {
    // Musical melody: pleasant ascending/descending pattern
    generate(ctx, gain) {
      const nodes: AudioNode[] = [];
      const dur = 2.0;
      const t = ctx.currentTime;
      const notes = [523, 659, 784, 1047, 784, 659, 523, 659];
      notes.forEach((f, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = f;
        const env = ctx.createGain();
        env.gain.setValueAtTime(0.6, t + i * 0.25);
        env.gain.exponentialRampToValueAtTime(0.001, t + i * 0.25 + 0.22);
        osc.connect(env);
        env.connect(gain);
        osc.start(t + i * 0.25);
        osc.stop(t + i * 0.25 + 0.24);
        nodes.push(osc, env);
      });
      return { nodes, duration: dur };
    },
  },
  chime: {
    // Wind chime: random-ish high frequency pings
    generate(ctx, gain) {
      const nodes: AudioNode[] = [];
      const dur = 2.0;
      const t = ctx.currentTime;
      const freqs = [1318, 1568, 1760, 2093, 1568, 1318, 2093, 1760];
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = f;
        const env = ctx.createGain();
        env.gain.setValueAtTime(0.4, t + i * 0.25);
        env.gain.exponentialRampToValueAtTime(0.001, t + i * 0.25 + 0.5);
        osc.connect(env);
        env.connect(gain);
        osc.start(t + i * 0.25);
        osc.stop(t + i * 0.25 + 0.55);
        nodes.push(osc, env);
      });
      return { nodes, duration: dur };
    },
  },
  rooster: {
    // Rooster crow: rising then falling with vibrato
    generate(ctx, gain) {
      const nodes: AudioNode[] = [];
      const dur = 1.8;
      const t = ctx.currentTime;
      for (let crow = 0; crow < 2; crow++) {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        const base = t + crow * 0.9;
        osc.frequency.setValueAtTime(400, base);
        osc.frequency.linearRampToValueAtTime(900, base + 0.3);
        osc.frequency.linearRampToValueAtTime(700, base + 0.5);
        osc.frequency.linearRampToValueAtTime(500, base + 0.8);
        // Vibrato via LFO
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 12;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 30;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start(base);
        lfo.stop(base + 0.85);
        const env = ctx.createGain();
        env.gain.setValueAtTime(0, base);
        env.gain.linearRampToValueAtTime(0.5, base + 0.1);
        env.gain.setValueAtTime(0.5, base + 0.5);
        env.gain.exponentialRampToValueAtTime(0.001, base + 0.85);
        osc.connect(env);
        env.connect(gain);
        osc.start(base);
        osc.stop(base + 0.85);
        nodes.push(osc, env, lfo, lfoGain);
      }
      return { nodes, duration: dur };
    },
  },
};

// ── Alarm Sound Engine ────────────────────────────────────

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Active alarm loops — keyed by alarm ID
const activeLoops = new Map<string, { stop: () => void }>();

/**
 * Play an alarm sound once (for test/preview).
 * Returns a stop function.
 */
export function playAlarmPreview(sound: AlarmSound, volume: number): () => void {
  if (typeof window === 'undefined') return () => {};
  try {
    const ctx = getAudioContext();
    const masterGain = ctx.createGain();
    masterGain.gain.value = volume / 100;
    masterGain.connect(ctx.destination);
    const { nodes } = SOUND_CONFIGS[sound].generate(ctx, masterGain);
    let stopped = false;
    return () => {
      if (stopped) return;
      stopped = true;
      nodes.forEach(n => { try { if (n instanceof OscillatorNode) n.stop(); } catch {} });
      try { masterGain.disconnect(); } catch {}
    };
  } catch {
    return () => {};
  }
}

/**
 * Start an infinite-looping alarm sound.
 * Sound repeats until stopAlarmSound(id) is called.
 * Supports gradual volume ramp.
 */
export function startAlarmSound(
  id: string,
  sound: AlarmSound,
  volume: number,
  gradual: boolean = false,
): void {
  if (typeof window === 'undefined') return;
  // Stop any existing sound for this alarm
  stopAlarmSound(id);

  try {
    const ctx = getAudioContext();
    const masterGain = ctx.createGain();
    const targetVol = volume / 100;
    masterGain.gain.value = gradual ? 0.05 : targetVol;
    masterGain.connect(ctx.destination);

    // Gradual volume: ramp from 5% to target over 30 seconds
    if (gradual) {
      masterGain.gain.linearRampToValueAtTime(targetVol, ctx.currentTime + 30);
    }

    let cancelled = false;
    let currentNodes: AudioNode[] = [];
    let timeout: ReturnType<typeof setTimeout>;

    const playOnce = () => {
      if (cancelled) return;
      try {
        const { nodes, duration } = SOUND_CONFIGS[sound].generate(ctx, masterGain);
        currentNodes = nodes;
        // Schedule next loop with a small gap
        timeout = setTimeout(playOnce, (duration + 0.3) * 1000);
      } catch {
        // Audio context closed or error — stop
        cancelled = true;
      }
    };

    playOnce();

    activeLoops.set(id, {
      stop: () => {
        cancelled = true;
        clearTimeout(timeout);
        currentNodes.forEach(n => { try { if (n instanceof OscillatorNode) n.stop(); } catch {} });
        try { masterGain.disconnect(); } catch {}
        activeLoops.delete(id);
      },
    });
  } catch {}
}

/**
 * Stop a looping alarm sound by alarm ID.
 */
export function stopAlarmSound(id: string): void {
  const loop = activeLoops.get(id);
  if (loop) loop.stop();
}

/**
 * Stop ALL currently playing alarm sounds.
 */
export function stopAllAlarmSounds(): void {
  activeLoops.forEach(loop => loop.stop());
  activeLoops.clear();
}

/**
 * Update the volume of a currently playing alarm.
 */
export function updateAlarmVolume(id: string, volume: number): void {
  // To change volume of an active alarm, stop and restart
  // This is simpler than tracking gainNode references
  const loop = activeLoops.get(id);
  if (loop) {
    // We'll handle this at the UI level by stopping and restarting
  }
}

/**
 * Check if an alarm sound is currently playing.
 */
export function isAlarmPlaying(id: string): boolean {
  return activeLoops.has(id);
}
