'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AppSidebar } from '@/components/app/sidebar';
import { AppNavbar } from '@/components/app/app-navbar';
import { useAppStore } from '@/stores/app-store';
import { ToastProvider } from '@/components/app/toast-notifications';
import { GlobalTimerBanner } from '@/components/app/global-timer-banner';
import { enableAudio } from '@/lib/sounds';
import { startAlarmSound, stopAlarmSound } from '@/lib/alarm-sounds';
import type { WeekDay } from '@/types/app';
import { formatLocalDate, DEFAULT_POMODORO } from '@/types/app';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon } from 'lucide-react';

// Global timer checker — polls every second to detect when a countdown reaches zero.
// Pomodoro: advances work → break → work … and only completes after the long break; work segments log habit time.
// Countdown: logs once and completes. Guards each expiry with a key so we never process the same endsAt twice.
function useGlobalTimerCompletionCheck(onComplete: (label: string) => void) {
  const store = useAppStore();
  const storeRef = useRef(store);
  storeRef.current = store;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const lastHandledExpiryRef = useRef<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      const s = storeRef.current;
      const t = s.activeTimer;
      if (!t || t.state !== 'running' || !t.endsAt) {
        lastHandledExpiryRef.current = null;
        return;
      }

      if (new Date(t.endsAt).getTime() > Date.now()) {
        lastHandledExpiryRef.current = null;
        return;
      }

      const expiryKey = `${t.sessionId}|${t.endsAt}`;
      if (lastHandledExpiryRef.current === expiryKey) return;
      lastHandledExpiryRef.current = expiryKey;

      const session = t.sessionId ? s.timerSessions.find(ts => ts.id === t.sessionId) : null;
      const linkedHabitId = t.habitId ?? session?.habitId;
      const habit = linkedHabitId ? s.habits.find(h => h.id === linkedHabitId) : null;
      const label = habit ? (habit.nameEn || habit.nameAr) : (t.labelEn || t.labelAr || 'Timer');

      const timerEndedAt = new Date(); // always use current time, not endsAt
      const timerEndedDate = formatLocalDate(timerEndedAt);
      const timerEndedTime = new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      const logWorkSegmentForHabit = (elapsed: number) => {
        if (!linkedHabitId || elapsed <= 0 || !habit || habit.archived) return;
        const habitTarget = habit.expectedDuration || 0;
        const maxReps = habit.maxDailyReps || Infinity;
        const prevTotal = s.habitLogs
          .filter(l => l.habitId === linkedHabitId && l.date === timerEndedDate)
          .reduce((sum, l) => sum + (l.duration ?? 0), 0);
        const prevReps = habitTarget > 0 ? Math.floor(prevTotal / habitTarget) : 0;
        const newReps = habitTarget > 0 ? Math.floor((prevTotal + elapsed) / habitTarget) : 0;
        const isCompleted = newReps > prevReps && (maxReps === Infinity || newReps <= maxReps);
        s.logHabit({
          habitId: linkedHabitId,
          date: timerEndedDate,
          time: timerEndedTime,
          duration: elapsed,
          note: '', reminderUsed: false, perceivedDifficulty: 'medium',
          completed: isCompleted,
          source: 'timer',
          habitExpectedDuration: habitTarget || undefined,
        });
      };

      if (t.mode === 'pomodoro') {
        const pomodoroConfig = session?.pomodoroConfig ?? DEFAULT_POMODORO;
        const phase = t.pomodoroPhase ?? 'work';
        const round = t.pomodoroRound ?? 1;
        const now = Date.now();
        const nowISO = new Date(now).toISOString();

        if (phase === 'work') {
          logWorkSegmentForHabit(t.targetDuration || 0);
          const nextDuration = round >= pomodoroConfig.roundsBeforeLongBreak
            ? pomodoroConfig.longBreakMinutes * 60
            : pomodoroConfig.shortBreakMinutes * 60;
          const nextPhase = round >= pomodoroConfig.roundsBeforeLongBreak ? 'long-break' : 'short-break';
          s.updateActiveTimer({
            pomodoroPhase: nextPhase,
            targetDuration: nextDuration,
            startedAt: nowISO,
            endsAt: new Date(now + nextDuration * 1000).toISOString(),
            remainingMs: undefined, elapsedMs: undefined, pausedAt: undefined,
          });
          return;
        }
        if (phase === 'short-break') {
          const nextDuration = pomodoroConfig.workMinutes * 60;
          s.updateActiveTimer({
            pomodoroPhase: 'work',
            pomodoroRound: round + 1,
            targetDuration: nextDuration,
            startedAt: nowISO,
            endsAt: new Date(now + nextDuration * 1000).toISOString(),
            remainingMs: undefined, elapsedMs: undefined, pausedAt: undefined,
          });
          return;
        }
        if (session) {
          s.completeTimer(session.id, undefined, undefined, nowISO);
        } else {
          s.updateActiveTimer({
            state: 'completed',
            remainingMs: 0,
            elapsedMs: t.targetDuration ? t.targetDuration * 1000 : 0,
            endsAt: undefined,
          });
        }
        onCompleteRef.current(label);
        return;
      }

      const elapsed = t.targetDuration || 0;
      if (linkedHabitId && elapsed > 0 && habit && !habit.archived) {
        logWorkSegmentForHabit(elapsed);
      }
      if (session) {
        s.completeTimer(session.id, undefined, undefined, timerEndedAt.toISOString());
      } else {
        s.updateActiveTimer({
          state: 'completed',
          remainingMs: 0,
          elapsedMs: t.targetDuration ? t.targetDuration * 1000 : 0,
          endsAt: undefined,
        });
      }
      onCompleteRef.current(label);
    }, 1000);
    return () => clearInterval(id);
  }, []);
}

// Global alarm checker — checks every second whether any alarm should fire
function useGlobalAlarmChecker() {
  const store = useAppStore();
  const storeRef = useRef(store);
  storeRef.current = store;

  useEffect(() => {
    const check = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${hh}:${mm}`;
      const currentDay = now.getDay() as WeekDay;
      const todayStr = formatLocalDate(now);
      const s = storeRef.current;

      s.alarms.forEach(alarm => {
        if (!alarm.enabled) return;
        if (alarm.status === 'ringing') return;

        const shouldFire = (() => {
          if (alarm.status === 'snoozed' && alarm.lastTriggered) {
            const snoozedAt = new Date(alarm.lastTriggered).getTime();
            const snoozeMs = alarm.snoozeDuration * 60 * 1000;
            if (Date.now() - snoozedAt >= snoozeMs) return true;
            return false;
          }

          if (alarm.time !== currentTime) return false;

          if (alarm.lastTriggered) {
            const lastFired = new Date(alarm.lastTriggered);
            const lastTime = `${String(lastFired.getHours()).padStart(2, '0')}:${String(lastFired.getMinutes()).padStart(2, '0')}`;
            const lastDate = formatLocalDate(lastFired);
            if (lastTime === currentTime && lastDate === todayStr) return false;
          }

          if (alarm.oneTimeDate && (!alarm.days || alarm.days.length === 0)) {
            return alarm.oneTimeDate === todayStr;
          }

          if (alarm.scheduleMode === 'monthdays' && alarm.monthDays?.length) {
            return alarm.monthDays.includes(now.getDate());
          }
          if (alarm.scheduleMode === 'yeardays' && alarm.yearDays?.length) {
            return alarm.yearDays.some(yd => yd.month === now.getMonth() && yd.day === now.getDate());
          }
          if (alarm.days?.length > 0) {
            return alarm.days.includes(currentDay);
          }

          return true;
        })();

        if (shouldFire) {
          s.triggerAlarm(alarm.id);
          startAlarmSound(alarm.id, alarm.sound, alarm.volume, alarm.gradualVolume);
        }
      });
    };

    const id = setInterval(check, 1000);
    return () => clearInterval(id);
  }, []);
}

const TIMER_ALARM_ID = '__timer_alarm__';

// Sleep lockdown hook — checks sleep status every 30 seconds
function useSleepLockdown() {
  const [sleeping, setSleeping] = useState(false);
  const [sleepLog, setSleepLog] = useState<{ id: string; sleep_button_at: string } | null>(null);
  const [sleepConfig, setSleepConfig] = useState<{ bedtime: string; wake_time: string } | null>(null);
  const [inSleepWindow, setInSleepWindow] = useState(false);

  const checkSleep = useCallback(async () => {
    try {
      const res = await fetch('/api/sleep/status');
      const json = await res.json();
      const d = json.data;
      if (d) {
        setSleeping(!!d.sleeping);
        setSleepLog(d.sleepLog || null);
        setSleepConfig(d.config || null);
        setInSleepWindow(!!d.inSleepWindow);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    checkSleep();
    const id = setInterval(checkSleep, 30000);
    return () => clearInterval(id);
  }, [checkSleep]);

  const wakeUp = useCallback(async () => {
    if (!sleepLog?.id) return;
    try {
      await fetch(`/api/sleep/logs/${sleepLog.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wake_button_at: new Date().toISOString() }),
      });
      setSleeping(false);
      setSleepLog(null);
    } catch { /* ignore */ }
  }, [sleepLog]);

  return { sleeping, sleepLog, sleepConfig, inSleepWindow, wakeUp, refresh: checkSleep };
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [timerAlarm, setTimerAlarm] = useState<string | null>(null);
  const locale = useLocale();
  const isAr = locale === 'ar';

  // Sleep lockdown
  const sleep = useSleepLockdown();
  const [sleepElapsed, setSleepElapsed] = useState('');
  useEffect(() => {
    if (!sleep.sleeping || !sleep.sleepLog?.sleep_button_at) return;
    const tick = () => {
      const start = new Date(sleep.sleepLog!.sleep_button_at).getTime();
      const diff = Math.max(0, Date.now() - start);
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setSleepElapsed(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [sleep.sleeping, sleep.sleepLog]);

  const store = useAppStore();
  const handleTimerComplete = useCallback((label: string) => {
    setTimerAlarm(label);
    const settings = store.settings;
    const sound = settings.timerAlarmSound ?? 'classic';
    const volume = settings.soundEnabled ? (settings.timerAlarmVolume ?? 80) : 0;
    startAlarmSound(TIMER_ALARM_ID, sound, volume, false);
  }, [store.settings]);

  const dismissTimerAlarm = useCallback(() => {
    stopAlarmSound(TIMER_ALARM_ID);
    setTimerAlarm(null);
  }, []);

  // Global timer tick — persists across all /app/* pages
  useGlobalTimerCompletionCheck(handleTimerComplete);
  // Global alarm checker — fires alarms at correct time across all pages
  useGlobalAlarmChecker();

  // Force all date/time/number inputs to use English locale (Western numerals + AM/PM)
  useEffect(() => {
    const setLang = () => {
      document.querySelectorAll('input[type="time"], input[type="date"], input[type="datetime-local"], input[type="number"]').forEach(el => {
        if (el.getAttribute('lang') !== 'en') el.setAttribute('lang', 'en');
      });
    };
    setLang();
    const observer = new MutationObserver(setLang);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen app-bg" onClick={() => enableAudio()}>
      <ToastProvider>
      <AppSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div
        style={{ paddingInlineStart: collapsed ? 72 : 260, transition: 'padding-inline-start 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
        className="min-h-screen flex flex-col max-lg:!ps-0"
      >
        <AppNavbar
          sidebarCollapsed={collapsed}
          onToggleSidebar={() => setCollapsed(c => !c)}
          onOpenMobile={() => setMobileOpen(true)}
        />
        <GlobalTimerBanner />
        <main className="flex-1">
          {children}
        </main>
      </div>

      {/* Sleep mode banner — read-only mode, app stays visible */}
      <AnimatePresence>
        {sleep.sleeping && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed top-0 start-0 end-0 z-[99999] flex items-center justify-center gap-4 px-4 py-2.5"
            style={{
              background: 'linear-gradient(135deg, rgba(var(--color-primary-rgb)/0.95), color-mix(in srgb, var(--color-primary) 85%, black))',
              boxShadow: '0 4px 20px rgba(var(--color-primary-rgb) / 0.3)',
            }}
          >
            <Moon className="w-4 h-4 text-white/80 shrink-0" />
            <div className="flex items-center gap-3 text-white">
              <span className="text-xs font-medium text-white/70">
                {isAr ? 'وضع النوم' : 'Sleep Mode'}
              </span>
              <span className="text-sm font-extrabold tabular-nums">{sleepElapsed || '0:00'}</span>
              <span className="text-[10px] text-white/50">
                {isAr ? '• الموقع للقراءة فقط' : '• Read-only mode'}
              </span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={sleep.wakeUp}
              className="h-7 px-4 rounded-lg text-xs font-bold cursor-pointer shrink-0"
              style={{ background: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(4px)' }}
            >
              {isAr ? '☀️ استيقاظ' : '☀️ Wake Up'}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sleep mode interaction blocker — prevents clicks on interactive elements */}
      {sleep.sleeping && (
        <div
          className="fixed inset-0 z-[9998] cursor-not-allowed"
          style={{ background: 'transparent' }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            // Allow clicking the wake-up banner (z-99999) but block everything else
            e.preventDefault();
            e.stopPropagation();
          }}
        />
      )}

      {/* Timer alarm overlay */}
      <AnimatePresence>
        {timerAlarm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{ background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(12px)' }}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="flex flex-col items-center gap-6 text-center px-8"
            >
              {/* Pulsing ring */}
              <div className="relative">
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute inset-0 rounded-full"
                  style={{ background: 'var(--color-primary)', filter: 'blur(20px)' }}
                />
                <div className="relative h-24 w-24 rounded-full flex items-center justify-center" style={{ background: 'var(--color-primary)' }}>
                  <motion.span
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="text-4xl"
                  >
                    ⏰
                  </motion.span>
                </div>
              </div>

              {/* Label */}
              <div>
                <p className="text-white/60 text-sm font-medium mb-1">
                  {isAr ? 'انتهى الوقت!' : 'Time is up!'}
                </p>
                <p className="text-white text-2xl font-extrabold tracking-tight">
                  {timerAlarm}
                </p>
              </div>

              {/* Dismiss button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={dismissTimerAlarm}
                className="h-16 px-16 rounded-2xl text-lg font-extrabold cursor-pointer transition-shadow duration-200"
                style={{
                  background: 'var(--color-primary)',
                  color: 'white',
                  boxShadow: '0 0 40px rgba(var(--color-primary-rgb) / 0.5), 0 8px 24px rgba(0,0,0,0.3)',
                }}
              >
                {isAr ? 'إيقاف المنبه' : 'Stop Alarm'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      </ToastProvider>
    </div>
  );
}
