'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppSidebar } from '@/components/app/sidebar';
import { AppNavbar } from '@/components/app/app-navbar';
import { useAppStore } from '@/stores/app-store';
import { ToastProvider } from '@/components/app/toast-notifications';
import { GlobalTimerBanner } from '@/components/app/global-timer-banner';
import { enableAudio } from '@/lib/sounds';
import { startAlarmSound, stopAlarmSound } from '@/lib/alarm-sounds';
import type { WeekDay } from '@/types/app';
import { computeTimerRemaining, formatLocalDate } from '@/types/app';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';

// Global timer completion checker — polls every second to detect when a
// countdown/pomodoro timer reaches zero (based on absolute timestamps).
// This does NOT tick or mutate elapsed — display is computed from timestamps.
function useGlobalTimerCompletionCheck(onComplete: (label: string) => void) {
  const store = useAppStore();
  const storeRef = useRef(store);
  storeRef.current = store;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const id = setInterval(() => {
      const s = storeRef.current;
      const t = s.activeTimer;
      if (!t || t.state !== 'running' || !t.endsAt) return;
      if (new Date(t.endsAt).getTime() <= Date.now()) {
        const habit = t.habitId ? s.habits.find(h => h.id === t.habitId) : null;
        const label = habit ? (habit.nameEn || habit.nameAr) : (t.labelEn || t.labelAr || 'Timer');
        s.updateActiveTimer({ state: 'completed', remainingMs: 0, elapsedMs: t.targetDuration ? t.targetDuration * 1000 : 0, endsAt: undefined });
        onCompleteRef.current(label);
      }
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

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [timerAlarm, setTimerAlarm] = useState<string | null>(null);
  const locale = useLocale();
  const isAr = locale === 'ar';

  const handleTimerComplete = useCallback((label: string) => {
    setTimerAlarm(label);
    startAlarmSound(TIMER_ALARM_ID, 'classic', 80, false);
  }, []);

  const dismissTimerAlarm = useCallback(() => {
    stopAlarmSound(TIMER_ALARM_ID);
    setTimerAlarm(null);
  }, []);

  // Global timer tick — persists across all /app/* pages
  useGlobalTimerCompletionCheck(handleTimerComplete);
  // Global alarm checker — fires alarms at correct time across all pages
  useGlobalAlarmChecker();

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
