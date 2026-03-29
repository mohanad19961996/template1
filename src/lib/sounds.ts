// Sound utility for habit notifications
// Uses Web Audio API with graceful fallback

type SoundType = 'success' | 'error' | 'warning' | 'info' | 'timer-complete' | 'timer-start' | 'timer-pause' | 'timer-resume' | 'alarm' | 'reminder' | 'notification';

// Frequencies and patterns for different notification types
const SOUND_CONFIGS: Record<SoundType, { freqs: number[]; durations: number[]; type: OscillatorType; gain: number }> = {
  success:        { freqs: [523, 659, 784],       durations: [100, 100, 200], type: 'sine',     gain: 0.3 },
  error:          { freqs: [330, 277],             durations: [200, 300],      type: 'square',   gain: 0.2 },
  warning:        { freqs: [440, 440],             durations: [150, 150],      type: 'triangle', gain: 0.25 },
  info:           { freqs: [587],                  durations: [150],           type: 'sine',     gain: 0.2 },
  'timer-complete': { freqs: [784, 988, 1175, 1318], durations: [150, 150, 150, 300], type: 'sine', gain: 0.35 },
  'timer-start':  { freqs: [440, 554],             durations: [100, 150],      type: 'sine',     gain: 0.2 },
  'timer-pause':  { freqs: [440, 349],             durations: [100, 150],      type: 'sine',     gain: 0.2 },
  'timer-resume': { freqs: [349, 440],             durations: [100, 150],      type: 'sine',     gain: 0.2 },
  alarm:          { freqs: [880, 0, 880, 0, 880],  durations: [200, 100, 200, 100, 300], type: 'square', gain: 0.3 },
  reminder:       { freqs: [659, 784, 659],        durations: [150, 150, 200], type: 'sine',     gain: 0.25 },
  notification:   { freqs: [523, 659],             durations: [100, 200],      type: 'sine',     gain: 0.2 },
};

let audioCtx: AudioContext | null = null;
let userInteracted = false;

// Must be called after user interaction (click, etc.)
export function enableAudio() {
  userInteracted = true;
  if (!audioCtx && typeof window !== 'undefined') {
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch { /* ignore */ }
  }
}

export function playSound(type: SoundType): void {
  if (typeof window === 'undefined') return;
  if (!userInteracted) return; // respect browser autoplay policy

  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const config = SOUND_CONFIGS[type];
    let time = audioCtx.currentTime;

    config.freqs.forEach((freq, i) => {
      if (freq === 0) { // silence gap
        time += config.durations[i] / 1000;
        return;
      }
      const osc = audioCtx!.createOscillator();
      const gainNode = audioCtx!.createGain();
      osc.type = config.type;
      osc.frequency.value = freq;
      gainNode.gain.setValueAtTime(config.gain, time);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + config.durations[i] / 1000);
      osc.connect(gainNode);
      gainNode.connect(audioCtx!.destination);
      osc.start(time);
      osc.stop(time + config.durations[i] / 1000 + 0.05);
      time += config.durations[i] / 1000;
    });
  } catch {
    // fail gracefully
  }
}

// Convenience functions
export const playNotificationSound = () => playSound('notification');
export const playSuccessSound = () => playSound('success');
export const playErrorSound = () => playSound('error');
export const playWarningSound = () => playSound('warning');
export const playTimerCompleteSound = () => playSound('timer-complete');
export const playTimerStartSound = () => playSound('timer-start');
export const playTimerPauseSound = () => playSound('timer-pause');
export const playTimerResumeSound = () => playSound('timer-resume');
export const playAlarmSound = () => playSound('alarm');
export const playReminderSound = () => playSound('reminder');
