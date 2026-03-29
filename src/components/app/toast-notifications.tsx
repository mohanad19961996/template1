'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { X, CheckCircle2, AlertTriangle, AlertCircle, Info, Timer, Bell, Clock, Flame } from 'lucide-react';
import { playSound } from '@/lib/sounds';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'timer' | 'alarm' | 'reminder';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  icon?: React.ReactNode;
  action?: { label: string; onClick: () => void };
  createdAt: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id' | 'createdAt'>) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
  notifySuccess: (title: string, message?: string) => void;
  notifyError: (title: string, message?: string) => void;
  notifyWarning: (title: string, message?: string) => void;
  notifyInfo: (title: string, message?: string) => void;
  notifyTimerComplete: (title: string, message?: string) => void;
  notifyTimerStart: (title: string) => void;
  notifyTimerPause: (title: string) => void;
  notifyTimerResume: (title: string) => void;
  notifyAlarm: (title: string, message?: string) => void;
  notifyReminder: (title: string, message?: string) => void;
  notifyHabitComplete: (habitName: string) => void;
  notifyHabitArchived: (habitName: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const TOAST_ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
  error: <AlertCircle className="h-5 w-5 text-red-500" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
  info: <Info className="h-5 w-5 text-blue-500" />,
  timer: <Timer className="h-5 w-5 text-violet-500" />,
  alarm: <Bell className="h-5 w-5 text-red-500" />,
  reminder: <Clock className="h-5 w-5 text-amber-500" />,
};

const TOAST_COLORS: Record<ToastType, string> = {
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  timer: '#8b5cf6',
  alarm: '#ef4444',
  reminder: '#f59e0b',
};

const TOAST_SOUNDS: Partial<Record<string, Parameters<typeof playSound>[0]>> = {
  success: 'success',
  error: 'error',
  warning: 'warning',
  info: 'notification',
  timer: 'timer-complete',
  alarm: 'alarm',
  reminder: 'reminder',
  'timer-start': 'timer-start',
  'timer-pause': 'timer-pause',
  'timer-resume': 'timer-resume',
};

let toastCounter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id' | 'createdAt'>) => {
    const id = `toast-${++toastCounter}-${Date.now()}`;
    setToasts(prev => [...prev, { ...toast, id, createdAt: Date.now() }]);
    // Play sound
    const soundKey = TOAST_SOUNDS[toast.type];
    if (soundKey) playSound(soundKey);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearAll = useCallback(() => setToasts([]), []);

  // Convenience methods
  const notifySuccess = useCallback((title: string, message?: string) => addToast({ type: 'success', title, message }), [addToast]);
  const notifyError = useCallback((title: string, message?: string) => addToast({ type: 'error', title, message }), [addToast]);
  const notifyWarning = useCallback((title: string, message?: string) => addToast({ type: 'warning', title, message }), [addToast]);
  const notifyInfo = useCallback((title: string, message?: string) => addToast({ type: 'info', title, message }), [addToast]);
  const notifyTimerComplete = useCallback((title: string, message?: string) => addToast({ type: 'timer', title, message }), [addToast]);
  const notifyAlarm = useCallback((title: string, message?: string) => addToast({ type: 'alarm', title, message }), [addToast]);
  const notifyReminder = useCallback((title: string, message?: string) => addToast({ type: 'reminder', title, message }), [addToast]);

  const notifyTimerStart = useCallback((title: string) => {
    const soundKey = TOAST_SOUNDS['timer-start'];
    if (soundKey) playSound(soundKey);
    addToast({ type: 'timer', title, message: undefined });
  }, [addToast]);

  const notifyTimerPause = useCallback((title: string) => {
    const soundKey = TOAST_SOUNDS['timer-pause'];
    if (soundKey) playSound(soundKey);
    addToast({ type: 'warning', title, message: undefined });
  }, [addToast]);

  const notifyTimerResume = useCallback((title: string) => {
    const soundKey = TOAST_SOUNDS['timer-resume'];
    if (soundKey) playSound(soundKey);
    addToast({ type: 'info', title, message: undefined });
  }, [addToast]);

  const notifyHabitComplete = useCallback((habitName: string) => {
    addToast({ type: 'success', title: habitName, message: undefined, icon: <Flame className="h-5 w-5 text-orange-500" /> });
  }, [addToast]);

  const notifyHabitArchived = useCallback((habitName: string) => {
    addToast({ type: 'warning', title: habitName, message: undefined });
  }, [addToast]);

  const value: ToastContextValue = {
    toasts, addToast, removeToast, clearAll,
    notifySuccess, notifyError, notifyWarning, notifyInfo,
    notifyTimerComplete, notifyTimerStart, notifyTimerPause, notifyTimerResume,
    notifyAlarm, notifyReminder, notifyHabitComplete, notifyHabitArchived,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} onClearAll={clearAll} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onRemove, onClearAll }: { toasts: Toast[]; onRemove: (id: string) => void; onClearAll: () => void }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 end-4 z-[var(--z-toast,700)] flex flex-col-reverse gap-2 max-w-sm w-full pointer-events-none">
      {/* Clear all button */}
      {toasts.length > 1 && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={onClearAll}
          className="pointer-events-auto self-end text-xs font-bold px-3 py-1.5 rounded-lg bg-[var(--foreground)]/[0.08] text-[var(--foreground)]/70 hover:bg-[var(--foreground)]/[0.15] transition-all"
        >
          Clear all ({toasts.length})
        </motion.button>
      )}
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const color = TOAST_COLORS[toast.type];
  const icon = toast.icon || TOAST_ICONS[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="pointer-events-auto rounded-2xl bg-[var(--color-background)] shadow-2xl overflow-hidden"
      style={{ border: `2px solid ${color}30` }}
    >
      {/* Color bar */}
      <div className="h-1" style={{ background: color }} />
      <div className="flex items-start gap-3 p-4">
        {/* Icon */}
        <div className="shrink-0 mt-0.5">{icon}</div>
        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold">{toast.title}</p>
          {toast.message && <p className="text-xs text-[var(--foreground)]/70 mt-0.5">{toast.message}</p>}
          {toast.action && (
            <button onClick={toast.action.onClick}
              className="text-xs font-bold mt-2 px-3 py-1 rounded-lg transition-all"
              style={{ color, background: `${color}15` }}>
              {toast.action.label}
            </button>
          )}
        </div>
        {/* Close button */}
        <button onClick={() => onRemove(toast.id)}
          className="shrink-0 h-7 w-7 rounded-lg flex items-center justify-center text-[var(--foreground)]/50 hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/[0.08] transition-all">
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
