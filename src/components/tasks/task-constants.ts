import { TaskPriority, TaskStatus } from '@/types/app';

// ── Animation ────────────────────────────────────────────

export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } }),
};

// ── Config ───────────────────────────────────────────────

export const PRIORITY_CONFIG: Record<TaskPriority, { en: string; ar: string; color: string; bg: string; border: string }> = {
  urgent: { en: 'Urgent', ar: 'عاجل', color: 'text-red-500', bg: 'bg-red-500/10', border: '#ef4444' },
  high: { en: 'High', ar: 'مرتفع', color: 'text-orange-500', bg: 'bg-orange-500/10', border: '#f97316' },
  medium: { en: 'Medium', ar: 'متوسط', color: 'text-amber-500', bg: 'bg-amber-500/10', border: '#f59e0b' },
  low: { en: 'Low', ar: 'منخفض', color: 'text-blue-400', bg: 'bg-blue-400/10', border: '#60a5fa' },
};

export const STATUS_CONFIG: Record<TaskStatus, { en: string; ar: string; color: string; bg: string }> = {
  'todo': { en: 'To Do', ar: 'معلّقة', color: 'text-[var(--foreground)]/55', bg: 'bg-[var(--foreground)]/[0.06]' },
  'in-progress': { en: 'In Progress', ar: 'جارية', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
  'completed': { en: 'Done', ar: 'منجزة', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
  'cancelled': { en: 'Cancelled', ar: 'ملغاة', color: 'text-[var(--foreground)]/40', bg: 'bg-[var(--foreground)]/[0.05]' },
};

export const CATEGORY_PRESETS = [
  { en: 'Work', ar: 'عمل' }, { en: 'Personal', ar: 'شخصي' },
  { en: 'Health', ar: 'صحة' }, { en: 'Learning', ar: 'تعلم' },
  { en: 'Finance', ar: 'مالية' }, { en: 'Home', ar: 'منزل' },
  { en: 'Social', ar: 'اجتماعي' }, { en: 'Project', ar: 'مشروع' },
];

export const COLOR_OPTIONS = [
  'theme', '#ef4444', '#f97316', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899',
];

export function addDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

export function daysBetween(a: string, b: string): number {
  const da = new Date(a), db = new Date(b);
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

export type StatFilter = null | 'today' | 'in-progress' | 'overdue' | 'completed-today' | 'completion-rate';
export type BoardColumnId = 'today-overdue' | 'in-progress' | 'upcoming' | 'completed';
