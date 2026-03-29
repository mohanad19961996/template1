'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AppSidebar } from '@/components/app/sidebar';
import { AppNavbar } from '@/components/app/app-navbar';
import { useAppStore } from '@/stores/app-store';

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

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Global timer tick — persists across all /app/* pages
  useGlobalTimerTick();

  return (
    <div className="min-h-screen app-bg">
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
    </div>
  );
}
