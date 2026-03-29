'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import {
  TimerMode, DEFAULT_POMODORO, formatTimerDuration, formatDuration,
  todayString, MoodLevel, Difficulty,
} from '@/types/app';
import { useSearchParams } from 'next/navigation';
import {
  Play, Pause, Square, RotateCcw, Timer, Clock, Zap, Brain,
  Coffee, AlertCircle, Plus, X, Star, Volume2, VolumeX,
  Maximize2, Minimize2, Settings, ChevronDown, GraduationCap,
  ListChecks,
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } }),
};

export default function TimersPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const store = useAppStore();

  const searchParams = useSearchParams();
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [linkedSkillId, setLinkedSkillId] = useState<string>('');
  const [linkedHabitId, setLinkedHabitId] = useState<string>(searchParams.get('habitId') ?? '');
  const [countdownMinutes, setCountdownMinutes] = useState(25);
  const [pomodoroConfig, setPomodoroConfig] = useState(DEFAULT_POMODORO);
  const [labelEn, setLabelEn] = useState('Focus Session');
  const [labelAr, setLabelAr] = useState('جلسة تركيز');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [completionNote, setCompletionNote] = useState('');
  const [completionRating, setCompletionRating] = useState<MoodLevel>(3);
  const [showHistory, setShowHistory] = useState(false);

  const active = store.activeTimer;
  const isRunning = active?.state === 'running';
  const isPaused = active?.state === 'paused';

  // Timer tick is handled globally in app layout — only watch for completion here
  useEffect(() => {
    if (!active || active.state !== 'running') return;
    if (active.targetDuration && active.elapsed >= active.targetDuration) {
      if (active.mode === 'pomodoro') {
        handlePomodoroPhaseComplete();
      } else {
        setShowComplete(true);
        store.updateActiveTimer({ state: 'completed' });
      }
    }
  }, [active?.elapsed, active?.state, active?.targetDuration, active?.mode]);

  const handlePomodoroPhaseComplete = useCallback(() => {
    if (!store.activeTimer) return;
    const phase = store.activeTimer.pomodoroPhase;
    const round = store.activeTimer.pomodoroRound ?? 1;

    if (phase === 'work') {
      if (round >= pomodoroConfig.roundsBeforeLongBreak) {
        store.updateActiveTimer({
          pomodoroPhase: 'long-break',
          elapsed: 0,
          targetDuration: pomodoroConfig.longBreakMinutes * 60,
        });
      } else {
        store.updateActiveTimer({
          pomodoroPhase: 'short-break',
          elapsed: 0,
          targetDuration: pomodoroConfig.shortBreakMinutes * 60,
        });
      }
    } else if (phase === 'short-break') {
      store.updateActiveTimer({
        pomodoroPhase: 'work',
        pomodoroRound: round + 1,
        elapsed: 0,
        targetDuration: pomodoroConfig.workMinutes * 60,
      });
    } else {
      // Long break done — session complete
      setShowComplete(true);
      store.updateActiveTimer({ state: 'completed' });
    }
  }, [store, pomodoroConfig]);

  // Auto-fill label when habit is selected
  const selectedHabit = linkedHabitId ? store.habits.find(h => h.id === linkedHabitId) : null;

  const handleStart = () => {
    let targetDuration: number | undefined;
    if (mode === 'countdown') targetDuration = countdownMinutes * 60;
    if (mode === 'pomodoro') targetDuration = pomodoroConfig.workMinutes * 60;

    const timerType = linkedHabitId ? 'habit-linked' : linkedSkillId ? 'skill-linked' : 'independent';
    const finalLabelEn = selectedHabit ? selectedHabit.nameEn : labelEn;
    const finalLabelAr = selectedHabit ? selectedHabit.nameAr : labelAr;

    store.startTimer({
      type: timerType,
      mode,
      skillId: linkedSkillId || undefined,
      habitId: linkedHabitId || undefined,
      labelEn: finalLabelEn, labelAr: finalLabelAr,
      startedAt: new Date().toISOString(),
      duration: 0,
      targetDuration,
      pomodoroConfig: mode === 'pomodoro' ? pomodoroConfig : undefined,
      pomodoroRound: mode === 'pomodoro' ? 1 : undefined,
    });
  };

  const handlePauseResume = () => {
    if (isRunning) {
      store.updateActiveTimer({ state: 'paused' });
    } else if (isPaused) {
      store.updateActiveTimer({ state: 'running' });
    }
  };

  const handleStop = () => {
    setShowComplete(true);
    if (active) {
      store.updateActiveTimer({ state: 'completed' });
    }
  };

  const handleComplete = () => {
    if (!active) return;
    const timerSession = store.timerSessions.find(t => t.id === active.sessionId);
    const hId = timerSession?.habitId || linkedHabitId;
    const sId = timerSession?.skillId || linkedSkillId;

    store.completeTimer(active.sessionId, completionNote, completionRating);

    // Auto-log to skill if linked
    if (sId && active.elapsed > 60) {
      const durationMin = Math.round(active.elapsed / 60);
      const now = new Date();
      const startTime = new Date(now.getTime() - active.elapsed * 1000);
      store.logSkillSession({
        skillId: sId,
        date: todayString(),
        startTime: startTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        endTime: now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        duration: durationMin,
        sessionType: 'practice',
        qualityRating: completionRating,
        focusRating: completionRating,
        note: completionNote,
        whatLearned: '',
        tags: [],
        timerUsed: true,
      });
    }

    // Auto-log habit if linked
    if (hId && active.elapsed > 0) {
      const durationMin = Math.max(1, Math.round(active.elapsed / 60));
      const alreadyDone = store.habitLogs.some(l => l.habitId === hId && l.date === todayString() && l.completed);
      if (!alreadyDone) {
        store.logHabit({
          habitId: hId,
          date: todayString(),
          time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
          duration: durationMin,
          note: completionNote,
          reminderUsed: false,
          perceivedDifficulty: 'medium' as Difficulty,
          completed: true,
        });
      }
    }

    setShowComplete(false);
    setCompletionNote('');
    setCompletionRating(3);
    setLinkedSkillId('');
    setLinkedHabitId('');
  };

  const handleCancel = () => {
    store.cancelTimer();
    setShowComplete(false);
  };

  // Display values
  const elapsed = active?.elapsed ?? 0;
  const target = active?.targetDuration;
  const remaining = target ? Math.max(0, target - elapsed) : elapsed;
  const displayTime = mode === 'stopwatch' || !target ? elapsed : remaining;
  const progress = target ? Math.min(100, (elapsed / target) * 100) : 0;
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const pomodoroPhaseLabel = useMemo(() => {
    if (!active?.pomodoroPhase) return '';
    const labels: Record<string, { en: string; ar: string }> = {
      'work': { en: 'Focus', ar: 'تركيز' },
      'short-break': { en: 'Short Break', ar: 'استراحة قصيرة' },
      'long-break': { en: 'Long Break', ar: 'استراحة طويلة' },
    };
    return isAr ? labels[active.pomodoroPhase]?.ar : labels[active.pomodoroPhase]?.en;
  }, [active?.pomodoroPhase, isAr]);

  // History
  const recentTimers = useMemo(() =>
    [...store.timerSessions].filter(t => t.completed).sort((a, b) => (b.endedAt ?? '').localeCompare(a.endedAt ?? '')).slice(0, 10),
    [store.timerSessions]
  );

  const todayTotal = useMemo(() =>
    store.timerSessions.filter(t => t.completed && t.startedAt.startsWith(todayString())).reduce((a, t) => a + t.duration, 0),
    [store.timerSessions]
  );

  const containerClass = fullscreen
    ? 'fixed inset-0 z-[var(--z-modal)] bg-[var(--color-background)] flex flex-col items-center justify-center'
    : 'px-4 sm:px-6 lg:px-8 py-6 pb-20 max-w-[1400px] mx-auto';

  return (
    <div className={containerClass}>
      {/* Header */}
      {!fullscreen && (
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{isAr ? 'المؤقتات' : 'Timers'}</h1>
            <p className="text-sm text-[var(--foreground)]/70 mt-1">
              {isAr ? `${formatTimerDuration(todayTotal)} اليوم` : `${formatTimerDuration(todayTotal)} today`}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-2.5 rounded-xl border border-[var(--foreground)]/[0.12] hover:bg-[var(--foreground)]/[0.08]">
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-[var(--foreground)]/30" />}
            </button>
            <button onClick={() => setShowHistory(!showHistory)} className={cn('p-2.5 rounded-xl border transition-all', showHistory ? 'border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10' : 'border-[var(--foreground)]/[0.12]')}>
              <Clock className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}

      <div className={cn(!fullscreen && 'grid lg:grid-cols-3 gap-6')}>
        {/* Timer Area */}
        <motion.div
          initial="hidden" animate="visible" variants={fadeUp} custom={1}
          className={cn(!fullscreen && 'lg:col-span-2', 'flex flex-col items-center')}
        >
          {/* Mode selector - only when idle */}
          {!active && !fullscreen && (
            <div className="flex gap-2 mb-8 p-1 rounded-xl bg-[var(--foreground)]/[0.06]">
              {([
                { mode: 'pomodoro' as TimerMode, labelEn: 'Pomodoro', labelAr: 'بومودورو', icon: Brain },
                { mode: 'countdown' as TimerMode, labelEn: 'Countdown', labelAr: 'عد تنازلي', icon: Timer },
                { mode: 'stopwatch' as TimerMode, labelEn: 'Stopwatch', labelAr: 'ساعة إيقاف', icon: Clock },
              ]).map(m => (
                <button
                  key={m.mode}
                  onClick={() => setMode(m.mode)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium app-toggle',
                    mode === m.mode && 'app-toggle-active'
                  )}
                >
                  <m.icon className="h-4 w-4" />
                  {isAr ? m.labelAr : m.labelEn}
                </button>
              ))}
            </div>
          )}

          {/* Timer Circle */}
          <div className="relative mb-8">
            <svg className="w-64 h-64 sm:w-72 sm:h-72 -rotate-90" viewBox="0 0 260 260">
              {/* Background circle */}
              <circle cx="130" cy="130" r="120" fill="none" stroke="currentColor" strokeWidth="4"
                className="text-[var(--foreground)]/[0.06]" />
              {/* Progress circle */}
              {(mode !== 'stopwatch' || active) && (
                <circle cx="130" cy="130" r="120" fill="none"
                  stroke="var(--color-primary)" strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={mode === 'stopwatch' ? 0 : strokeDashoffset}
                  className="transition-all duration-1000"
                />
              )}
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {active?.pomodoroPhase && (
                <span className={cn(
                  'text-xs font-medium px-2.5 py-0.5 rounded-full mb-2',
                  active.pomodoroPhase === 'work' ? 'bg-red-500/10 text-red-500' :
                  active.pomodoroPhase === 'short-break' ? 'bg-blue-500/10 text-blue-500' :
                  'bg-emerald-500/10 text-emerald-500'
                )}>
                  {pomodoroPhaseLabel} {active.pomodoroRound && `(${active.pomodoroRound}/${pomodoroConfig.roundsBeforeLongBreak})`}
                </span>
              )}
              <span className="text-5xl sm:text-6xl font-bold tracking-tight tabular-nums">
                {formatTimerDuration(displayTime)}
              </span>
              {active && (
                <span className="text-xs text-[var(--foreground)]/60 mt-2">
                  {isRunning ? (isAr ? 'قيد التشغيل' : 'Running') : isPaused ? (isAr ? 'متوقف مؤقتاً' : 'Paused') : ''}
                </span>
              )}
              {selectedHabit && !active && (
                <span className="text-xs text-emerald-500 font-medium mt-1 flex items-center gap-1">
                  <ListChecks className="h-3 w-3" /> {isAr ? selectedHabit.nameAr : selectedHabit.nameEn}
                </span>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 mb-8">
            {!active ? (
              <button onClick={handleStart}
                className="flex h-14 w-14 items-center justify-center rounded-2xl app-btn-primary shadow-lg hover:scale-105">
                <Play className="h-6 w-6 ms-0.5" />
              </button>
            ) : (
              <>
                <button onClick={handleCancel}
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--foreground)]/[0.06] hover:bg-[var(--foreground)]/[0.1] transition-all">
                  <RotateCcw className="h-5 w-5 text-[var(--foreground)]/70" />
                </button>
                <button onClick={handlePauseResume}
                  className="flex h-14 w-14 items-center justify-center rounded-2xl app-btn-primary shadow-lg hover:scale-105">
                  {isRunning ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ms-0.5" />}
                </button>
                <button onClick={handleStop}
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-all">
                  <Square className="h-5 w-5 text-red-500" />
                </button>
              </>
            )}
          </div>

          {/* Distraction counter */}
          {active && (
            <button onClick={() => store.addDistraction()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--foreground)]/[0.12] text-xs text-[var(--foreground)]/70 hover:bg-[var(--foreground)]/[0.08] transition-all mb-4">
              <AlertCircle className="h-3.5 w-3.5" />
              {isAr ? 'تشتت' : 'Distraction'} ({store.timerSessions.find(t => t.id === active.sessionId)?.distractionCount ?? 0})
            </button>
          )}

          {/* Fullscreen toggle */}
          <button onClick={() => setFullscreen(!fullscreen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-[var(--foreground)]/30 hover:text-[var(--foreground)]/70 transition-colors">
            {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            {fullscreen ? (isAr ? 'تصغير' : 'Exit Fullscreen') : (isAr ? 'ملء الشاشة' : 'Fullscreen')}
          </button>
        </motion.div>

        {/* Side panel */}
        {!fullscreen && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2} className="space-y-4">
            {/* Settings */}
            {!active && (
              <>
                {/* Habit Link */}
                <div className="rounded-2xl app-card p-4">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <ListChecks className="h-4 w-4 text-[var(--color-primary)]" />
                    {isAr ? 'ربط بعادة' : 'Link to Habit'}
                  </h3>
                  <select
                    value={linkedHabitId}
                    onChange={e => { setLinkedHabitId(e.target.value); if (e.target.value) setLinkedSkillId(''); }}
                    className="w-full rounded-xl app-input px-3 py-2.5 text-sm"
                  >
                    <option value="">{isAr ? 'بدون ربط' : 'None'}</option>
                    {store.habits.filter(h => !h.archived).map(h => (
                      <option key={h.id} value={h.id}>{isAr ? h.nameAr : h.nameEn}</option>
                    ))}
                  </select>
                </div>

                {/* Skill Link */}
                <div className="rounded-2xl app-card p-4">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-[var(--color-primary)]" />
                    {isAr ? 'ربط بمهارة' : 'Link to Skill'}
                  </h3>
                  <select
                    value={linkedSkillId}
                    onChange={e => { setLinkedSkillId(e.target.value); if (e.target.value) setLinkedHabitId(''); }}
                    className="w-full rounded-xl app-input px-3 py-2.5 text-sm"
                  >
                    <option value="">{isAr ? 'بدون ربط' : 'None'}</option>
                    {store.skills.filter(s => !s.archived).map(s => (
                      <option key={s.id} value={s.id}>{isAr ? s.nameAr : s.nameEn}</option>
                    ))}
                  </select>
                </div>

                {/* Timer Config */}
                {mode === 'countdown' && (
                  <div className="rounded-2xl app-card p-4">
                    <h3 className="text-sm font-semibold mb-3">{isAr ? 'مدة العد التنازلي' : 'Countdown Duration'}</h3>
                    <div className="flex gap-2 flex-wrap">
                      {[5, 10, 15, 25, 30, 45, 60, 90].map(m => (
                        <button key={m} onClick={() => setCountdownMinutes(m)}
                          className={cn('px-3 py-2 rounded-lg text-xs font-medium transition-all',
                            countdownMinutes === m ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--foreground)]/[0.06] text-[var(--foreground)]/70 hover:bg-[var(--foreground)]/[0.08]')}>
                          {m}m
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {mode === 'pomodoro' && (
                  <div className="rounded-2xl app-card p-4 space-y-3">
                    <h3 className="text-sm font-semibold">{isAr ? 'إعدادات بومودورو' : 'Pomodoro Settings'}</h3>
                    {[
                      { key: 'workMinutes', labelEn: 'Work', labelAr: 'عمل', value: pomodoroConfig.workMinutes },
                      { key: 'shortBreakMinutes', labelEn: 'Short Break', labelAr: 'استراحة قصيرة', value: pomodoroConfig.shortBreakMinutes },
                      { key: 'longBreakMinutes', labelEn: 'Long Break', labelAr: 'استراحة طويلة', value: pomodoroConfig.longBreakMinutes },
                      { key: 'roundsBeforeLongBreak', labelEn: 'Rounds', labelAr: 'جولات', value: pomodoroConfig.roundsBeforeLongBreak },
                    ].map(s => (
                      <div key={s.key} className="flex items-center justify-between">
                        <span className="text-xs text-[var(--foreground)]/70">{isAr ? s.labelAr : s.labelEn}</span>
                        <input
                          type="number" min={1} max={120} value={s.value}
                          onChange={e => setPomodoroConfig(c => ({ ...c, [s.key]: Number(e.target.value) }))}
                          className="w-16 rounded-lg app-input px-2 py-1 text-xs text-center"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Session Label */}
                <div className="rounded-2xl app-card p-4">
                  <h3 className="text-sm font-semibold mb-3">{isAr ? 'تسمية الجلسة' : 'Session Label'}</h3>
                  <input value={isAr ? labelAr : labelEn}
                    onChange={e => isAr ? setLabelAr(e.target.value) : setLabelEn(e.target.value)}
                    className="w-full rounded-xl app-input px-3 py-2.5 text-sm"
                    placeholder={isAr ? 'مثال: دراسة البرمجة' : 'e.g., Coding Study'}
                  />
                </div>
              </>
            )}

            {/* Active timer info — shows linked habit/skill when a timer is running */}
            {active && (() => {
              const sess = store.timerSessions.find(t => t.id === active.sessionId);
              const linkedH = sess?.habitId ? store.habits.find(h => h.id === sess.habitId) : null;
              const linkedS = sess?.skillId ? store.skills.find(s => s.id === sess.skillId) : null;
              return (
                <div className="rounded-2xl app-card p-4 space-y-2">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Zap className="h-4 w-4 text-[var(--color-primary)]" />
                    {isAr ? 'الجلسة الحالية' : 'Current Session'}
                  </h3>
                  <p className="text-xs text-[var(--foreground)]/70">
                    {isAr ? (sess?.labelAr || 'جلسة') : (sess?.labelEn || 'Session')}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] px-2 py-1 rounded-full bg-[var(--foreground)]/[0.06] font-medium">
                      {active.mode === 'pomodoro' ? (isAr ? 'بومودورو' : 'Pomodoro') : active.mode === 'countdown' ? (isAr ? 'عد تنازلي' : 'Countdown') : (isAr ? 'ساعة إيقاف' : 'Stopwatch')}
                    </span>
                    {linkedH && (
                      <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-medium flex items-center gap-1">
                        <ListChecks className="h-3 w-3" /> {isAr ? linkedH.nameAr : linkedH.nameEn}
                      </span>
                    )}
                    {linkedS && (
                      <span className="text-[10px] px-2 py-1 rounded-full bg-blue-500/10 text-blue-600 font-medium flex items-center gap-1">
                        <GraduationCap className="h-3 w-3" /> {isAr ? linkedS.nameAr : linkedS.nameEn}
                      </span>
                    )}
                  </div>
                  {active.targetDuration && (
                    <div className="mt-1">
                      <div className="flex items-center justify-between text-[10px] text-[var(--foreground)]/50 mb-1">
                        <span>{formatTimerDuration(active.elapsed)}</span>
                        <span>{formatTimerDuration(active.targetDuration)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[var(--foreground)]/[0.08] overflow-hidden">
                        <div className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-1000 ease-linear"
                          style={{ width: `${Math.min(100, (active.elapsed / active.targetDuration) * 100)}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Timer History */}
            {showHistory && (
              <div className="rounded-2xl app-card p-4">
                <h3 className="text-sm font-semibold mb-3">{isAr ? 'السجل' : 'History'}</h3>
                {recentTimers.length === 0 ? (
                  <p className="text-xs text-[var(--foreground)]/30 text-center py-4">{isAr ? 'لا توجد جلسات سابقة' : 'No sessions yet'}</p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {recentTimers.map(t => {
                      const linkedHabit = t.habitId ? store.habits.find(h => h.id === t.habitId) : null;
                      const linkedSkill = t.skillId ? store.skills.find(s => s.id === t.skillId) : null;
                      return (
                      <div key={t.id} className="flex items-center justify-between rounded-lg bg-[var(--foreground)]/[0.03] px-3 py-2">
                        <div>
                          <p className="text-xs font-medium">{isAr ? t.labelAr : t.labelEn}</p>
                          <p className="text-[10px] text-[var(--foreground)]/30">
                            {t.mode} · {new Date(t.startedAt).toLocaleDateString()}
                            {linkedHabit && <span className="text-emerald-500"> · {isAr ? linkedHabit.nameAr : linkedHabit.nameEn}</span>}
                            {linkedSkill && <span className="text-blue-500"> · {isAr ? linkedSkill.nameAr : linkedSkill.nameEn}</span>}
                          </p>
                        </div>
                        <div className="text-end">
                          <p className="text-xs font-semibold tabular-nums">{formatTimerDuration(t.duration)}</p>
                          {t.productivityRating && (
                            <div className="flex gap-0.5 justify-end">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={cn('h-2 w-2', i < t.productivityRating! ? 'text-amber-400 fill-amber-400' : 'text-[var(--foreground)]/30')} />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                    })}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Completion Modal */}
      <AnimatePresence>
        {showComplete && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[var(--z-overlay)] bg-black/60" />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 40, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-x-4 sm:inset-x-0 sm:mx-auto top-[15%] z-[var(--z-modal)] sm:w-[420px] rounded-2xl bg-[var(--color-background)] border border-[var(--foreground)]/[0.12] shadow-2xl"
            >
              <div className="p-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
                  <Zap className="h-8 w-8 text-emerald-500" />
                </div>
                <h2 className="text-lg font-bold mb-1">{isAr ? 'أحسنت!' : 'Well Done!'}</h2>
                <p className="text-sm text-[var(--foreground)]/70 mb-4">
                  {isAr ? `أكملت ${formatTimerDuration(elapsed)} من التركيز` : `You focused for ${formatTimerDuration(elapsed)}`}
                </p>

                {/* Productivity Rating */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-[var(--foreground)]/70 mb-2">{isAr ? 'تقييم الإنتاجية' : 'Productivity Rating'}</p>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map(r => (
                      <button key={r} onClick={() => setCompletionRating(r as MoodLevel)}>
                        <Star className={cn('h-7 w-7 transition-all', r <= completionRating ? 'text-amber-400 fill-amber-400 scale-110' : 'text-[var(--foreground)]/30')} />
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  value={completionNote}
                  onChange={e => setCompletionNote(e.target.value)}
                  placeholder={isAr ? 'ملاحظات اختيارية...' : 'Optional notes...'}
                  rows={2}
                  className="w-full rounded-xl app-input px-3 py-2.5 text-sm resize-none mb-4"
                />

                <div className="flex gap-3">
                  <button onClick={handleCancel}
                    className="flex-1 py-2.5 rounded-xl border border-[var(--foreground)]/[0.12] text-sm text-[var(--foreground)]/70 hover:bg-[var(--foreground)]/[0.08]">
                    {isAr ? 'إلغاء' : 'Discard'}
                  </button>
                  <button onClick={handleComplete}
                    className="flex-1 py-2.5 rounded-xl app-btn-primary text-sm font-medium">
                    {isAr ? 'حفظ' : 'Save'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
