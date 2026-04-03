'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AppSidebar } from '@/components/app/sidebar';
import { AppNavbar } from '@/components/app/app-navbar';
import { useAppStore } from '@/stores/app-store';
import { ToastProvider } from '@/components/app/toast-notifications';
import { GlobalTimerBanner } from '@/components/app/global-timer-banner';
import { enableAudio } from '@/lib/sounds';
import { startAlarmSound, stopAlarmSound } from '@/lib/alarm-sounds';
import type { WeekDay } from '@/types/app';
import { computeTimerRemaining, formatLocalDate } from '@/types/app';

// Global timer completion checker — polls every second to detect when a
// countdown/pomodoro timer reaches zero (based on absolute timestamps).
// This does NOT tick or mutate elapsed — display is computed from timestamps.
function useGlobalTimerCompletionCheck() {
  const store = useAppStore();
  const storeRef = useRef(store);
  storeRef.current = store;

  useEffect(() => {
    const id = setInterval(() => {
      const s = storeRef.current;
      const t = s.activeTimer;
      if (!t || t.state !== 'running' || !t.endsAt) return;
      if (new Date(t.endsAt).getTime() <= Date.now()) {
        // Timer has ended — mark as completed in the store
        // (The timers page / habit page will handle UI & auto-complete logic)
        s.updateActiveTimer({ state: 'completed', remainingMs: 0, elapsedMs: t.targetDuration ? t.targetDuration * 1000 : 0, endsAt: undefined });
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

        // Check if it's time to fire
        const shouldFire = (() => {
          // For snoozed alarms: check if snooze duration has elapsed
          if (alarm.status === 'snoozed' && alarm.lastTriggered) {
            const snoozedAt = new Date(alarm.lastTriggered).getTime();
            const snoozeMs = alarm.snoozeDuration * 60 * 1000;
            if (Date.now() - snoozedAt >= snoozeMs) return true;
            return false;
          }

          // Check time match
          if (alarm.time !== currentTime) return false;

          // Prevent double-fire within same minute
          if (alarm.lastTriggered) {
            const lastFired = new Date(alarm.lastTriggered);
            const lastTime = `${String(lastFired.getHours()).padStart(2, '0')}:${String(lastFired.getMinutes()).padStart(2, '0')}`;
            const lastDate = formatLocalDate(lastFired);
            if (lastTime === currentTime && lastDate === todayStr) return false;
          }

          // One-time alarm
          if (alarm.oneTimeDate && (!alarm.days || alarm.days.length === 0)) {
            return alarm.oneTimeDate === todayStr;
          }

          // Recurring: check based on schedule mode
          if (alarm.scheduleMode === 'monthdays' && alarm.monthDays?.length) {
            return alarm.monthDays.includes(now.getDate());
          }
          if (alarm.scheduleMode === 'yeardays' && alarm.yearDays?.length) {
            return alarm.yearDays.some(yd => yd.month === now.getMonth() && yd.day === now.getDate());
          }
          if (alarm.days?.length > 0) {
            return alarm.days.includes(currentDay);
          }

          // No days set, no oneTimeDate = every day
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

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Global timer tick — persists across all /app/* pages
  useGlobalTimerCompletionCheck();
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
      </ToastProvider>
    </div>
  );
}
