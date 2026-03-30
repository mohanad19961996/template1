'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AppSidebar } from '@/components/app/sidebar';
import { AppNavbar } from '@/components/app/app-navbar';
import { useAppStore } from '@/stores/app-store';
import { ToastProvider } from '@/components/app/toast-notifications';
import { enableAudio } from '@/lib/sounds';
import { startAlarmSound, stopAlarmSound } from '@/lib/alarm-sounds';
import type { WeekDay } from '@/types/app';

// Global timer tick — runs as long as activeTimer is 'running', regardless of page
function useGlobalTimerTick() {
  const store = useAppStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRunning = store.activeTimer?.state === 'running';
  // Keep a stable ref to tickActiveTimer to avoid stale closures in setInterval
  const tickRef = useRef(store.tickActiveTimer);
  tickRef.current = store.tickActiveTimer;

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        tickRef.current();
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning]);
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
      const todayStr = now.toISOString().split('T')[0];
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
            const lastDate = lastFired.toISOString().split('T')[0];
            if (lastTime === currentTime && lastDate === todayStr) return false;
          }

          // One-time alarm
          if (alarm.oneTimeDate && alarm.days.length === 0) {
            return alarm.oneTimeDate === todayStr;
          }

          // Recurring: check day
          if (alarm.days.length > 0) {
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
  useGlobalTimerTick();
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
        <main className="flex-1">
          {children}
        </main>
      </div>
      </ToastProvider>
    </div>
  );
}
