'use client';

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import { useToast } from '@/components/app/toast-notifications';
import {
  Task, TaskStatus, TaskPriority, todayString, generateId,
} from '@/types/app';
import {
  Plus, Search, X, Check, ChevronDown, Clock, Calendar,
  Filter, AlertCircle, CheckCircle2, Circle, Trash2, Edit3,
  ListChecks, CalendarClock, BarChart3, Play, ArrowRight,
  MoreHorizontal, Tag, ClipboardList, TrendingUp, Percent,
  Link2, Timer, ChevronUp, Columns3,
} from 'lucide-react';
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor,
  useSensor, useSensors, type DragEndEvent, DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ── Animation ────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } }),
};

// ── Config ───────────────────────────────────────────────

const PRIORITY_CONFIG: Record<TaskPriority, { en: string; ar: string; color: string; bg: string; border: string }> = {
  urgent: { en: 'Urgent', ar: 'عاجل', color: 'text-red-500', bg: 'bg-red-500/10', border: '#ef4444' },
  high: { en: 'High', ar: 'مرتفع', color: 'text-orange-500', bg: 'bg-orange-500/10', border: '#f97316' },
  medium: { en: 'Medium', ar: 'متوسط', color: 'text-amber-500', bg: 'bg-amber-500/10', border: '#f59e0b' },
  low: { en: 'Low', ar: 'منخفض', color: 'text-blue-400', bg: 'bg-blue-400/10', border: '#60a5fa' },
};

const STATUS_CONFIG: Record<TaskStatus, { en: string; ar: string; color: string; bg: string }> = {
  'todo': { en: 'To Do', ar: 'معلّقة', color: 'text-[var(--foreground)]/55', bg: 'bg-[var(--foreground)]/[0.06]' },
  'in-progress': { en: 'In Progress', ar: 'جارية', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
  'completed': { en: 'Done', ar: 'منجزة', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
  'cancelled': { en: 'Cancelled', ar: 'ملغاة', color: 'text-[var(--foreground)]/40', bg: 'bg-[var(--foreground)]/[0.05]' },
};

const CATEGORY_PRESETS = [
  { en: 'Work', ar: 'عمل' }, { en: 'Personal', ar: 'شخصي' },
  { en: 'Health', ar: 'صحة' }, { en: 'Learning', ar: 'تعلم' },
  { en: 'Finance', ar: 'مالية' }, { en: 'Home', ar: 'منزل' },
  { en: 'Social', ar: 'اجتماعي' }, { en: 'Project', ar: 'مشروع' },
];

const COLOR_OPTIONS = [
  'theme', '#ef4444', '#f97316', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899',
];

function addDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a), db = new Date(b);
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

type StatFilter = null | 'today' | 'in-progress' | 'overdue' | 'completed-today' | 'completion-rate';
type BoardColumnId = 'today-overdue' | 'in-progress' | 'upcoming' | 'completed';

// ── Main Page ────────────────────────────────────────────

export default function TasksPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const store = useAppStore();
  const toast = useToast();
  const today = todayString();
  const tomorrow = addDays(today, 1);

  // UI State
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [showFilters, setShowFilters] = useState(false);
  const [statFilter, setStatFilter] = useState<StatFilter>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [detailTask, setDetailTask] = useState<Task | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterHasDueDate, setFilterHasDueDate] = useState<'all' | 'yes' | 'no'>('all');
  const [filterHasSubtasks, setFilterHasSubtasks] = useState<'all' | 'yes' | 'no'>('all');

  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (filterStatus !== 'all') c++;
    if (filterPriority !== 'all') c++;
    if (filterCategory !== 'all') c++;
    if (filterHasDueDate !== 'all') c++;
    if (filterHasSubtasks !== 'all') c++;
    return c;
  }, [filterStatus, filterPriority, filterCategory, filterHasDueDate, filterHasSubtasks]);

  const clearFilters = () => {
    setFilterStatus('all'); setFilterPriority('all'); setFilterCategory('all');
    setFilterHasDueDate('all'); setFilterHasSubtasks('all'); setStatFilter(null);
  };

  // Form State
  const [form, setForm] = useState({
    titleEn: '', titleAr: '', descriptionEn: '', descriptionAr: '',
    status: 'todo' as TaskStatus, priority: 'medium' as TaskPriority,
    category: '', dueDate: '', dueTime: '', estimatedMinutes: '' as string | number,
    tags: [] as string[], tagInput: '', notes: '', color: 'theme',
    subtasks: [] as { id: string; title: string; completed: boolean }[],
    newSubtask: '', linkedHabitId: '',
  });

  const resetForm = () => {
    setForm({
      titleEn: '', titleAr: '', descriptionEn: '', descriptionAr: '',
      status: 'todo', priority: 'medium', category: '', dueDate: '', dueTime: '',
      estimatedMinutes: '', tags: [], tagInput: '', notes: '', color: 'theme',
      subtasks: [], newSubtask: '', linkedHabitId: '',
    });
    setEditingTask(null);
  };

  const openCreate = () => { resetForm(); setShowForm(true); };

  const openEdit = useCallback((task: Task) => {
    setForm({
      titleEn: task.titleEn, titleAr: task.titleAr,
      descriptionEn: task.descriptionEn ?? '', descriptionAr: task.descriptionAr ?? '',
      status: task.status, priority: task.priority,
      category: task.category ?? '', dueDate: task.dueDate ?? '', dueTime: task.dueTime ?? '',
      estimatedMinutes: task.estimatedMinutes ?? '',
      tags: task.tags ?? [], tagInput: '', notes: task.notes ?? '', color: task.color ?? 'theme',
      subtasks: task.subtasks ?? [], newSubtask: '', linkedHabitId: task.linkedHabitId ?? '',
    });
    setEditingTask(task);
    setShowForm(true);
  }, []);

  const handleSave = () => {
    if (!form.titleEn && !form.titleAr) return;
    const { newSubtask, tagInput, ...rest } = form;
    const data = {
      ...rest,
      estimatedMinutes: rest.estimatedMinutes ? Number(rest.estimatedMinutes) : undefined,
      dueDate: rest.dueDate || undefined,
      dueTime: rest.dueTime || undefined,
      category: rest.category || undefined,
      notes: rest.notes || undefined,
      color: rest.color || 'theme',
      tags: rest.tags.length > 0 ? rest.tags : undefined,
      subtasks: rest.subtasks.length > 0 ? rest.subtasks : undefined,
      linkedHabitId: rest.linkedHabitId || undefined,
    };
    if (editingTask) {
      store.updateTask(editingTask.id, data);
      toast.notifySuccess(isAr ? 'تم التحديث' : 'Task updated');
    } else {
      store.addTask(data);
      toast.notifySuccess(isAr ? 'تمت الإضافة' : 'Task created');
    }
    setShowForm(false);
    resetForm();
  };

  const addSubtask = () => {
    if (!form.newSubtask.trim()) return;
    setForm(f => ({
      ...f,
      subtasks: [...f.subtasks, { id: generateId(), title: f.newSubtask.trim(), completed: false }],
      newSubtask: '',
    }));
  };

  const addTag = () => {
    const t = form.tagInput.trim();
    if (!t || form.tags.includes(t)) return;
    setForm(f => ({ ...f, tags: [...f.tags, t], tagInput: '' }));
  };

  // ── Computed Data ──

  const allTasks = store.tasks ?? [];
  const categories = useMemo(() => {
    const cats = new Set<string>();
    allTasks.forEach(t => { if (t.category) cats.add(t.category); });
    return Array.from(cats);
  }, [allTasks]);

  const stats = useMemo(() => {
    const active = allTasks.filter(t => t.status !== 'cancelled');
    const completed = allTasks.filter(t => t.status === 'completed');
    const todayDue = allTasks.filter(t => t.dueDate === today && t.status !== 'completed' && t.status !== 'cancelled');
    const overdue = allTasks.filter(t => t.dueDate != null && t.dueDate < today && t.status !== 'completed' && t.status !== 'cancelled');
    const inProgress = allTasks.filter(t => t.status === 'in-progress');
    const completedToday = allTasks.filter(t => t.status === 'completed' && t.completedAt?.startsWith(today));
    return {
      total: active.length, completed: completed.length,
      todayDue: todayDue.length, overdue: overdue.length,
      inProgress: inProgress.length, completedToday: completedToday.length,
      completionRate: active.length > 0 ? Math.round((completed.length / active.length) * 100) : 0,
    };
  }, [allTasks, today]);

  // Apply filters + stat filter + search
  const filteredTasks = useMemo(() => {
    let tasks = [...allTasks];

    // Stat quick filter
    if (statFilter === 'today') tasks = tasks.filter(t => t.dueDate === today && t.status !== 'completed' && t.status !== 'cancelled');
    else if (statFilter === 'in-progress') tasks = tasks.filter(t => t.status === 'in-progress');
    else if (statFilter === 'overdue') tasks = tasks.filter(t => t.dueDate != null && t.dueDate < today && t.status !== 'completed' && t.status !== 'cancelled');
    else if (statFilter === 'completed-today') tasks = tasks.filter(t => t.status === 'completed' && t.completedAt?.startsWith(today));

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      tasks = tasks.filter(t =>
        t.titleEn.toLowerCase().includes(q) || t.titleAr.toLowerCase().includes(q) ||
        t.descriptionEn?.toLowerCase().includes(q) || t.descriptionAr?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q) || t.tags?.some(tag => tag.toLowerCase().includes(q))
      );
    }

    // Panel filters
    if (filterStatus !== 'all') tasks = tasks.filter(t => t.status === filterStatus);
    if (filterPriority !== 'all') tasks = tasks.filter(t => t.priority === filterPriority);
    if (filterCategory !== 'all') tasks = tasks.filter(t => t.category === filterCategory);
    if (filterHasDueDate === 'yes') tasks = tasks.filter(t => !!t.dueDate);
    if (filterHasDueDate === 'no') tasks = tasks.filter(t => !t.dueDate);
    if (filterHasSubtasks === 'yes') tasks = tasks.filter(t => (t.subtasks?.length ?? 0) > 0);
    if (filterHasSubtasks === 'no') tasks = tasks.filter(t => !t.subtasks?.length);

    return tasks;
  }, [allTasks, searchQuery, filterStatus, filterPriority, filterCategory, filterHasDueDate, filterHasSubtasks, statFilter, today]);

  // Board columns
  const boardColumns = useMemo(() => {
    const todayOverdue = filteredTasks.filter(t =>
      t.status !== 'completed' && t.status !== 'cancelled' && t.status !== 'in-progress' &&
      t.dueDate != null && t.dueDate <= today
    );
    const inProg = filteredTasks.filter(t => t.status === 'in-progress');
    const upcoming = filteredTasks.filter(t =>
      t.status !== 'completed' && t.status !== 'cancelled' && t.status !== 'in-progress' &&
      (!t.dueDate || t.dueDate > today)
    );
    const done = filteredTasks.filter(t => t.status === 'completed').slice(0, 20);
    return { 'today-overdue': todayOverdue, 'in-progress': inProg, upcoming, completed: done };
  }, [filteredTasks, today]);

  // List view sorted
  const listTasks = useMemo(() => {
    const priorityOrder: Record<TaskPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    return [...filteredTasks].sort((a, b) => {
      const pa = priorityOrder[a.priority], pb = priorityOrder[b.priority];
      if (pa !== pb) return pa - pb;
      return (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999');
    });
  }, [filteredTasks]);

  const isOverdue = (t: Task) => t.dueDate != null && t.dueDate < today && t.status !== 'completed' && t.status !== 'cancelled';

  // DnD
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Check if dropped onto a column droppable
    const colId = (over.data?.current as Record<string, unknown>)?.columnId as BoardColumnId | undefined;
    const taskId = active.id as string;

    if (colId) {
      // Cross-column drop: update task status/dueDate
      if (colId === 'today-overdue') {
        store.updateTask(taskId, { status: 'todo', dueDate: today });
      } else if (colId === 'in-progress') {
        store.updateTask(taskId, { status: 'in-progress' });
      } else if (colId === 'upcoming') {
        store.updateTask(taskId, { status: 'todo', dueDate: undefined });
      } else if (colId === 'completed') {
        store.updateTask(taskId, { status: 'completed', completedAt: new Date().toISOString() });
      }
      return;
    }

    // Same-column reorder
    const allIds = allTasks.map(t => t.id);
    const oldIdx = allIds.indexOf(active.id as string);
    const newIdx = allIds.indexOf(over.id as string);
    if (oldIdx !== -1 && newIdx !== -1) {
      store.reorderTasks(arrayMove(allIds, oldIdx, newIdx));
    }
  }, [allTasks, store, today]);

  // Quick actions
  const quickComplete = (id: string) => {
    store.toggleTaskStatus(id);
    toast.notifySuccess(isAr ? 'تم التبديل' : 'Status toggled');
  };

  const quickStart = (id: string) => {
    store.updateTask(id, { status: 'in-progress' });
    toast.notifyInfo(isAr ? 'بدأت المهمة' : 'Task started');
  };

  const quickPostpone = (id: string) => {
    store.updateTask(id, { dueDate: tomorrow });
    toast.notifyInfo(isAr ? 'تم التأجيل لغداً' : 'Postponed to tomorrow');
  };

  const quickMoveToToday = (id: string) => {
    store.updateTask(id, { dueDate: today });
    toast.notifyInfo(isAr ? 'تم النقل لليوم' : 'Moved to today');
  };

  const quickDelete = (id: string) => {
    store.deleteTask(id);
    toast.notifySuccess(isAr ? 'تم الحذف' : 'Task deleted');
    setMenuOpenId(null);
  };

  const getRelativeDate = (dueDate: string) => {
    const diff = daysBetween(today, dueDate);
    if (diff < 0) return { text: isAr ? `متأخر ${Math.abs(diff)} يوم` : `${Math.abs(diff)}d overdue`, cls: 'text-red-500 font-semibold' };
    if (diff === 0) return { text: isAr ? 'اليوم' : 'Due today', cls: 'text-amber-500 font-semibold' };
    if (diff === 1) return { text: isAr ? 'غداً' : 'Tomorrow', cls: 'text-blue-500' };
    if (diff <= 7) return { text: isAr ? `بعد ${diff} أيام` : `In ${diff} days`, cls: 'text-[var(--foreground)]/50' };
    return { text: dueDate, cls: 'text-[var(--foreground)]/40' };
  };

  const getHabitName = (id: string) => {
    const h = (store.habits ?? []).find(h => h.id === id);
    if (!h) return null;
    return isAr ? (h.nameAr || h.nameEn) : (h.nameEn || h.nameAr);
  };

  const handleStatClick = (f: StatFilter) => {
    setStatFilter(prev => prev === f ? null : f);
  };

  // ── Render ──

  return (
    <div className="mx-auto max-w-[1600px] px-3 pb-20 sm:px-6 lg:px-8">

      {/* ═══ HERO SECTION ═══ */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="mt-3">
        <div
          className="overflow-hidden rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(var(--color-primary-rgb) / 0.15), rgba(var(--color-primary-rgb) / 0.06))',
          }}
        >
          <div className="px-4 py-3 sm:px-6 sm:py-4">
            {/* Desktop: title + stats on same row */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: 'rgba(var(--color-primary-rgb) / 0.2)' }}
                >
                  <ClipboardList className="h-5 w-5 text-[var(--color-primary)]" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)] sm:text-2xl">
                    {isAr ? 'المهام' : 'Tasks'}
                  </h1>
                  <p className="text-xs text-[var(--foreground)]/50">
                    {isAr ? 'نظّم مهامك وتابع تقدمك' : 'Organize your tasks and track progress'}
                  </p>
                </div>
              </div>

              {/* Stat cards - inline on desktop */}
              <div className="hidden sm:flex sm:items-center sm:gap-1">
                {([
                  { key: 'today' as StatFilter, label: isAr ? 'اليوم' : 'Today', value: stats.todayDue, tone: 'var(--color-primary)' },
                  { key: 'in-progress' as StatFilter, label: isAr ? 'جارية' : 'Active', value: stats.inProgress, tone: '#3b82f6' },
                  { key: 'overdue' as StatFilter, label: isAr ? 'متأخرة' : 'Overdue', value: stats.overdue, tone: '#ef4444' },
                  { key: 'completed-today' as StatFilter, label: isAr ? 'أُنجزت' : 'Done', value: stats.completedToday, tone: '#10b981' },
                  { key: 'completion-rate' as StatFilter, label: isAr ? 'إنجاز' : 'Rate', value: `${stats.completionRate}%`, tone: '#8b5cf6' },
                ]).map(stat => (
                  <button
                    key={stat.key}
                    type="button"
                    onClick={() => stat.key !== 'completion-rate' ? handleStatClick(stat.key) : undefined}
                    className={cn(
                      'flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-center transition-all',
                      stat.key !== 'completion-rate' && 'cursor-pointer hover:brightness-95',
                      statFilter === stat.key
                        ? 'bg-[rgba(var(--color-primary-rgb),0.12)]'
                        : 'bg-[var(--color-background)]/60',
                    )}
                  >
                    <span className="text-base font-bold tabular-nums leading-none" style={{ color: stat.tone }}>
                      {stat.value}
                    </span>
                    <span className="text-[9px] font-medium text-[var(--foreground)]/45">{stat.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Stat cards - grid on mobile only */}
          <div className="grid grid-cols-3 gap-px border-t border-[rgba(var(--color-primary-rgb),0.15)] sm:hidden" style={{ background: 'rgba(var(--color-primary-rgb) / 0.1)' }}>
            {([
              { key: 'today' as StatFilter, label: isAr ? 'اليوم' : 'Today', value: stats.todayDue, tone: 'var(--color-primary)' },
              { key: 'in-progress' as StatFilter, label: isAr ? 'جارية' : 'Active', value: stats.inProgress, tone: '#3b82f6' },
              { key: 'overdue' as StatFilter, label: isAr ? 'متأخرة' : 'Overdue', value: stats.overdue, tone: '#ef4444' },
              { key: 'completed-today' as StatFilter, label: isAr ? 'أُنجزت' : 'Done', value: stats.completedToday, tone: '#10b981' },
              { key: 'completion-rate' as StatFilter, label: isAr ? 'إنجاز' : 'Rate', value: `${stats.completionRate}%`, tone: '#8b5cf6' },
            ]).map(stat => (
              <button
                key={stat.key}
                type="button"
                onClick={() => stat.key !== 'completion-rate' ? handleStatClick(stat.key) : undefined}
                className={cn(
                  'flex flex-col gap-0.5 px-3 py-2 text-start transition-all',
                  stat.key !== 'completion-rate' && 'cursor-pointer hover:brightness-95',
                  statFilter === stat.key
                    ? 'bg-[rgba(var(--color-primary-rgb),0.12)]'
                    : 'bg-[var(--color-background)]',
                )}
              >
                <span className="text-base font-bold tabular-nums leading-none" style={{ color: stat.tone }}>
                  {stat.value}
                </span>
                <span className="text-[10px] font-medium text-[var(--foreground)]/45">{stat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ═══ TOOLBAR ═══ */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="mt-3 flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--foreground)]/35" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'بحث في المهام...' : 'Search tasks...'}
            className="w-full rounded-xl border border-[var(--foreground)]/10 bg-[var(--color-background)] py-2 ps-8 pe-8 text-xs text-[var(--foreground)] placeholder:text-[var(--foreground)]/40 focus:border-[var(--color-primary)]/40 focus:outline-none sm:text-sm"
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')}
              className="absolute end-2 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-[var(--foreground)]/40 hover:text-[var(--color-primary)]">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* New Task */}
        <button type="button" onClick={openCreate}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-md transition-all hover:brightness-105 hover:shadow-lg active:scale-[0.98] sm:text-sm"
          style={{ background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.8))' }}
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          {isAr ? 'مهمة جديدة' : 'New Task'}
        </button>

        {/* View toggle */}
        <div className="flex rounded-xl border border-[var(--foreground)]/10 p-0.5">
          <button type="button" onClick={() => setViewMode('board')}
            className={cn('rounded-lg px-2 py-1.5 transition-all', viewMode === 'board' ? 'bg-[var(--color-primary)] text-white shadow-sm' : 'text-[var(--foreground)]/40 hover:text-[var(--color-primary)]')}
            aria-label={isAr ? 'لوحة' : 'Board'}>
            <Columns3 className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => setViewMode('list')}
            className={cn('rounded-lg px-2 py-1.5 transition-all', viewMode === 'list' ? 'bg-[var(--color-primary)] text-white shadow-sm' : 'text-[var(--foreground)]/40 hover:text-[var(--color-primary)]')}
            aria-label={isAr ? 'قائمة' : 'List'}>
            <ListChecks className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Filter button */}
        <button type="button" onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all sm:text-sm',
            showFilters
              ? 'border-[var(--color-primary)]/40 bg-[rgba(var(--color-primary-rgb),0.15)] text-[var(--color-primary)]'
              : 'border-[var(--foreground)]/10 text-[var(--foreground)]/60 hover:border-[var(--color-primary)]/30 hover:text-[var(--color-primary)]',
          )}>
          <Filter className="h-3.5 w-3.5" />
          {isAr ? 'فلتر' : 'Filter'}
          {activeFilterCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-primary)] text-[9px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>

        {statFilter && (
          <button type="button" onClick={() => setStatFilter(null)}
            className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-primary)]/10 px-2.5 py-1.5 text-[11px] font-semibold text-[var(--color-primary)]">
            <X className="h-3 w-3" /> {isAr ? 'مسح' : 'Clear'}
          </button>
        )}
      </motion.div>

      {/* ═══ FILTER PANEL ═══ */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="mt-2 rounded-xl border border-[var(--foreground)]/10 bg-[var(--color-background)] p-3">
              <div className="flex flex-wrap gap-4">
                {/* Status */}
                <div>
                  <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[var(--foreground)]/40">
                    {isAr ? 'الحالة' : 'Status'}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {(['all', 'todo', 'in-progress', 'completed', 'cancelled'] as const).map(s => (
                      <button key={s} onClick={() => setFilterStatus(s)}
                        className={cn('rounded-md px-2.5 py-1 text-[11px] font-medium transition-all',
                          filterStatus === s ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]' : 'bg-[var(--foreground)]/[0.04] text-[var(--foreground)]/55 hover:bg-[var(--foreground)]/[0.08]')}>
                        {s === 'all' ? (isAr ? 'الكل' : 'All') : (isAr ? STATUS_CONFIG[s].ar : STATUS_CONFIG[s].en)}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Priority */}
                <div>
                  <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[var(--foreground)]/40">
                    {isAr ? 'الأولوية' : 'Priority'}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {(['all', 'urgent', 'high', 'medium', 'low'] as const).map(p => (
                      <button key={p} onClick={() => setFilterPriority(p)}
                        className={cn('rounded-md px-2.5 py-1 text-[11px] font-medium transition-all',
                          filterPriority === p ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]' : 'bg-[var(--foreground)]/[0.04] text-[var(--foreground)]/55 hover:bg-[var(--foreground)]/[0.08]')}>
                        {p === 'all' ? (isAr ? 'الكل' : 'All') : (isAr ? PRIORITY_CONFIG[p].ar : PRIORITY_CONFIG[p].en)}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Category */}
                {categories.length > 0 && (
                  <div>
                    <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[var(--foreground)]/40">
                      {isAr ? 'التصنيف' : 'Category'}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      <button onClick={() => setFilterCategory('all')}
                        className={cn('rounded-md px-2.5 py-1 text-[11px] font-medium transition-all',
                          filterCategory === 'all' ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]' : 'bg-[var(--foreground)]/[0.04] text-[var(--foreground)]/55')}>
                        {isAr ? 'الكل' : 'All'}
                      </button>
                      {categories.map(c => (
                        <button key={c} onClick={() => setFilterCategory(c)}
                          className={cn('rounded-md px-2.5 py-1 text-[11px] font-medium transition-all',
                            filterCategory === c ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]' : 'bg-[var(--foreground)]/[0.04] text-[var(--foreground)]/55')}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {/* Has due date */}
                <div>
                  <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[var(--foreground)]/40">
                    {isAr ? 'تاريخ استحقاق' : 'Due Date'}
                  </span>
                  <div className="flex gap-1">
                    {(['all', 'yes', 'no'] as const).map(v => (
                      <button key={v} onClick={() => setFilterHasDueDate(v)}
                        className={cn('rounded-md px-2.5 py-1 text-[11px] font-medium transition-all',
                          filterHasDueDate === v ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]' : 'bg-[var(--foreground)]/[0.04] text-[var(--foreground)]/55')}>
                        {v === 'all' ? (isAr ? 'الكل' : 'All') : v === 'yes' ? (isAr ? 'نعم' : 'Yes') : (isAr ? 'لا' : 'No')}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Has subtasks */}
                <div>
                  <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[var(--foreground)]/40">
                    {isAr ? 'مهام فرعية' : 'Subtasks'}
                  </span>
                  <div className="flex gap-1">
                    {(['all', 'yes', 'no'] as const).map(v => (
                      <button key={v} onClick={() => setFilterHasSubtasks(v)}
                        className={cn('rounded-md px-2.5 py-1 text-[11px] font-medium transition-all',
                          filterHasSubtasks === v ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]' : 'bg-[var(--foreground)]/[0.04] text-[var(--foreground)]/55')}>
                        {v === 'all' ? (isAr ? 'الكل' : 'All') : v === 'yes' ? (isAr ? 'نعم' : 'Yes') : (isAr ? 'لا' : 'No')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {activeFilterCount > 0 && (
                <button type="button" onClick={clearFilters} className="mt-3 text-[11px] font-semibold text-red-400 hover:text-red-500">
                  {isAr ? 'مسح الكل' : 'Clear all filters'}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ BOARD VIEW ═══ */}
      {viewMode === 'board' && (
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2} className="mt-3">
          {allTasks.length === 0 && !searchQuery && activeFilterCount === 0 && !statFilter ? (
            <EmptyGlobal isAr={isAr} onAdd={openCreate} />
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                {([
                  { id: 'today-overdue' as BoardColumnId, title: isAr ? 'اليوم والمتأخر' : 'Today & Overdue', icon: <AlertCircle className="h-4 w-4" />, accent: '#ef4444' },
                  { id: 'in-progress' as BoardColumnId, title: isAr ? 'جارية' : 'In Progress', icon: <Play className="h-4 w-4" />, accent: '#3b82f6' },
                  { id: 'upcoming' as BoardColumnId, title: isAr ? 'لاحقاً' : 'Upcoming', icon: <CalendarClock className="h-4 w-4" />, accent: 'var(--color-primary)' },
                  { id: 'completed' as BoardColumnId, title: isAr ? 'منجزة' : 'Completed', icon: <CheckCircle2 className="h-4 w-4" />, accent: '#10b981' },
                ]).map(col => (
                  <BoardColumn
                    key={col.id}
                    columnId={col.id}
                    title={col.title}
                    icon={col.icon}
                    accent={col.accent}
                    tasks={boardColumns[col.id]}
                    isAr={isAr}
                    today={today}
                    store={store}
                    onEdit={openEdit}
                    onDetail={setDetailTask}
                    onComplete={quickComplete}
                    onStart={quickStart}
                    onPostpone={quickPostpone}
                    onMoveToToday={quickMoveToToday}
                    onDelete={quickDelete}
                    getRelativeDate={getRelativeDate}
                    getHabitName={getHabitName}
                    menuOpenId={menuOpenId}
                    setMenuOpenId={setMenuOpenId}
                  />
                ))}
              </div>
            </DndContext>
          )}
        </motion.div>
      )}

      {/* ═══ LIST VIEW ═══ */}
      {viewMode === 'list' && (
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2} className="mt-3">
          {listTasks.length === 0 ? (
            allTasks.length === 0 ? <EmptyGlobal isAr={isAr} onAdd={openCreate} /> : <EmptyFiltered isAr={isAr} onClear={clearFilters} />
          ) : (
            <div className="overflow-hidden rounded-xl border border-[var(--foreground)]/10">
              {/* Header */}
              <div className="hidden border-b border-[var(--foreground)]/10 bg-[var(--foreground)]/[0.02] px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--foreground)]/40 sm:flex">
                <div className="w-8" />
                <div className="flex-1">{isAr ? 'المهمة' : 'Task'}</div>
                <div className="w-20 text-center">{isAr ? 'الأولوية' : 'Priority'}</div>
                <div className="w-24 text-center">{isAr ? 'الاستحقاق' : 'Due'}</div>
                <div className="w-20 text-center">{isAr ? 'التصنيف' : 'Category'}</div>
                <div className="w-16 text-center">{isAr ? 'الوقت' : 'Time'}</div>
                <div className="w-20 text-center">{isAr ? 'المهام الفرعية' : 'Subtasks'}</div>
              </div>
              {listTasks.map((task, i) => (
                <ListRow key={task.id} task={task} isAr={isAr} today={today} index={i}
                  onComplete={() => quickComplete(task.id)} onDetail={() => setDetailTask(task)}
                  getRelativeDate={getRelativeDate} />
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ═══ CREATE/EDIT MODAL ═══ */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setShowForm(false); resetForm(); }}
              className="fixed inset-0 z-[var(--z-overlay)] bg-black/40 backdrop-blur-md" />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="fixed inset-x-4 top-[5%] z-[var(--z-modal)] max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--foreground)]/10 bg-[var(--color-background)] shadow-2xl sm:inset-x-0 sm:mx-auto sm:w-[600px]"
            >
              <div className="h-0.5 w-full shrink-0 bg-[var(--color-primary)]" aria-hidden />
              {/* Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--foreground)]/10 bg-[var(--color-background)]/95 px-5 py-4 backdrop-blur-xl">
                <h2 className="flex items-center gap-2 text-base font-semibold">
                  <ClipboardList className="h-5 w-5 text-[var(--color-primary)]" />
                  {editingTask ? (isAr ? 'تعديل المهمة' : 'Edit Task') : (isAr ? 'مهمة جديدة' : 'New Task')}
                </h2>
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                  className="rounded-lg p-2 text-[var(--foreground)]/45 hover:bg-[var(--foreground)]/[0.06]">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-5 p-5">
                {/* Titles */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <FieldLabel>{isAr ? 'العنوان (عربي)' : 'Title (Arabic)'}</FieldLabel>
                    <input dir="rtl" value={form.titleAr} onChange={e => setForm(f => ({ ...f, titleAr: e.target.value }))}
                      className="w-full rounded-xl border border-[var(--foreground)]/10 bg-transparent px-3.5 py-2.5 text-sm focus:border-[var(--color-primary)]/40 focus:outline-none"
                      placeholder={isAr ? 'عنوان المهمة...' : 'Task title...'} />
                  </div>
                  <div>
                    <FieldLabel>{isAr ? 'العنوان (إنجليزي)' : 'Title (English)'}</FieldLabel>
                    <input dir="ltr" value={form.titleEn} onChange={e => setForm(f => ({ ...f, titleEn: e.target.value }))}
                      className="w-full rounded-xl border border-[var(--foreground)]/10 bg-transparent px-3.5 py-2.5 text-sm focus:border-[var(--color-primary)]/40 focus:outline-none"
                      placeholder="Task title..." />
                  </div>
                </div>

                {/* Description */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <FieldLabel>{isAr ? 'الوصف (عربي)' : 'Description (Arabic)'}</FieldLabel>
                    <textarea dir="rtl" value={form.descriptionAr} onChange={e => setForm(f => ({ ...f, descriptionAr: e.target.value }))}
                      rows={2} className="w-full resize-none rounded-xl border border-[var(--foreground)]/10 bg-transparent px-3.5 py-2.5 text-sm focus:border-[var(--color-primary)]/40 focus:outline-none"
                      placeholder={isAr ? 'وصف اختياري...' : 'Optional...'} />
                  </div>
                  <div>
                    <FieldLabel>{isAr ? 'الوصف (إنجليزي)' : 'Description (English)'}</FieldLabel>
                    <textarea dir="ltr" value={form.descriptionEn} onChange={e => setForm(f => ({ ...f, descriptionEn: e.target.value }))}
                      rows={2} className="w-full resize-none rounded-xl border border-[var(--foreground)]/10 bg-transparent px-3.5 py-2.5 text-sm focus:border-[var(--color-primary)]/40 focus:outline-none"
                      placeholder="Optional description..." />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <FieldLabel>{isAr ? 'الحالة' : 'Status'}</FieldLabel>
                  <div className="flex flex-wrap gap-1.5">
                    {(['todo', 'in-progress', 'completed', 'cancelled'] as const).map(s => (
                      <button key={s} onClick={() => setForm(f => ({ ...f, status: s }))}
                        className={cn('rounded-lg px-3 py-2 text-[11px] font-semibold transition-all',
                          form.status === s ? cn(STATUS_CONFIG[s].bg, STATUS_CONFIG[s].color, 'ring-1 ring-current/20') : 'bg-[var(--foreground)]/[0.05] text-[var(--foreground)]/50')}>
                        {isAr ? STATUS_CONFIG[s].ar : STATUS_CONFIG[s].en}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <FieldLabel>{isAr ? 'الأولوية' : 'Priority'}</FieldLabel>
                  <div className="flex gap-1.5">
                    {(['low', 'medium', 'high', 'urgent'] as const).map(p => (
                      <button key={p} onClick={() => setForm(f => ({ ...f, priority: p }))}
                        className={cn('flex-1 rounded-lg py-2 text-[11px] font-semibold transition-all',
                          form.priority === p ? cn(PRIORITY_CONFIG[p].bg, PRIORITY_CONFIG[p].color, 'ring-1 ring-current/20') : 'bg-[var(--foreground)]/[0.05] text-[var(--foreground)]/50')}>
                        {isAr ? PRIORITY_CONFIG[p].ar : PRIORITY_CONFIG[p].en}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Due Date, Time, Estimate */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <FieldLabel>{isAr ? 'تاريخ الاستحقاق' : 'Due Date'}</FieldLabel>
                    <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                      className="w-full rounded-xl border border-[var(--foreground)]/10 bg-transparent px-3 py-2.5 text-sm focus:border-[var(--color-primary)]/40 focus:outline-none" />
                  </div>
                  <div>
                    <FieldLabel>{isAr ? 'الوقت' : 'Time'}</FieldLabel>
                    <input type="time" value={form.dueTime} onChange={e => setForm(f => ({ ...f, dueTime: e.target.value }))}
                      className="w-full rounded-xl border border-[var(--foreground)]/10 bg-transparent px-3 py-2.5 text-sm focus:border-[var(--color-primary)]/40 focus:outline-none" />
                  </div>
                  <div>
                    <FieldLabel>{isAr ? 'الوقت المقدر (دقيقة)' : 'Estimate (min)'}</FieldLabel>
                    <input type="number" min={1} value={form.estimatedMinutes} onChange={e => setForm(f => ({ ...f, estimatedMinutes: e.target.value }))}
                      placeholder="min" className="w-full rounded-xl border border-[var(--foreground)]/10 bg-transparent px-3 py-2.5 text-sm focus:border-[var(--color-primary)]/40 focus:outline-none" />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <FieldLabel>{isAr ? 'التصنيف' : 'Category'}</FieldLabel>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORY_PRESETS.map(c => (
                      <button key={c.en} onClick={() => setForm(f => ({ ...f, category: f.category === c.en ? '' : c.en }))}
                        className={cn('rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all',
                          form.category === c.en ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/20' : 'bg-[var(--foreground)]/[0.05] text-[var(--foreground)]/50')}>
                        {isAr ? c.ar : c.en}
                      </button>
                    ))}
                  </div>
                  <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    placeholder={isAr ? 'أو اكتب تصنيفاً...' : 'Or type custom...'}
                    className="mt-2 w-full rounded-xl border border-[var(--foreground)]/10 bg-transparent px-3 py-2 text-xs focus:border-[var(--color-primary)]/40 focus:outline-none" />
                </div>

                {/* Tags */}
                <div>
                  <FieldLabel>{isAr ? 'العلامات' : 'Tags'}</FieldLabel>
                  {form.tags.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1">
                      {form.tags.map(t => (
                        <span key={t} className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--color-primary)]">
                          {t}
                          <button type="button" onClick={() => setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }))}><X className="h-2.5 w-2.5" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input value={form.tagInput} onChange={e => setForm(f => ({ ...f, tagInput: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                      placeholder={isAr ? 'اكتب واضغط Enter...' : 'Type & press Enter...'}
                      className="flex-1 rounded-xl border border-[var(--foreground)]/10 bg-transparent px-3 py-2 text-xs focus:border-[var(--color-primary)]/40 focus:outline-none" />
                    <button type="button" onClick={addTag} className="rounded-xl bg-[var(--foreground)]/[0.05] px-3 py-2 text-[var(--foreground)]/50 hover:bg-[var(--foreground)]/[0.1]">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Subtasks */}
                <div>
                  <FieldLabel>{isAr ? 'المهام الفرعية' : 'Subtasks'}</FieldLabel>
                  {form.subtasks.length > 0 && (
                    <div className="mb-2 space-y-1.5">
                      {form.subtasks.map(st => (
                        <div key={st.id} className="flex items-center gap-2 rounded-lg bg-[var(--foreground)]/[0.03] px-3 py-2">
                          <button type="button" onClick={() => setForm(f => ({ ...f, subtasks: f.subtasks.map(s => s.id === st.id ? { ...s, completed: !s.completed } : s) }))}
                            className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded-full border', st.completed ? 'border-emerald-500 bg-emerald-500' : 'border-[var(--foreground)]/25')}>
                            {st.completed && <Check className="h-2.5 w-2.5 text-white" />}
                          </button>
                          <span className={cn('flex-1 text-xs', st.completed && 'text-[var(--foreground)]/40 line-through')}>{st.title}</span>
                          <button type="button" onClick={() => setForm(f => ({ ...f, subtasks: f.subtasks.filter(s => s.id !== st.id) }))}
                            className="text-[var(--foreground)]/20 hover:text-red-400"><X className="h-3 w-3" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input value={form.newSubtask} onChange={e => setForm(f => ({ ...f, newSubtask: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSubtask(); } }}
                      placeholder={isAr ? 'إضافة مهمة فرعية...' : 'Add subtask...'}
                      className="flex-1 rounded-xl border border-[var(--foreground)]/10 bg-transparent px-3 py-2 text-sm focus:border-[var(--color-primary)]/40 focus:outline-none" />
                    <button type="button" onClick={addSubtask}
                      className="rounded-xl bg-[var(--foreground)]/[0.05] px-3 py-2 text-[var(--foreground)]/50 hover:bg-[var(--foreground)]/[0.1]">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <FieldLabel>{isAr ? 'ملاحظات' : 'Notes'}</FieldLabel>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    dir={isAr ? 'rtl' : 'ltr'} rows={2}
                    className="w-full resize-none rounded-xl border border-[var(--foreground)]/10 bg-transparent px-3.5 py-2.5 text-sm focus:border-[var(--color-primary)]/40 focus:outline-none"
                    placeholder={isAr ? 'ملاحظات إضافية...' : 'Additional notes...'} />
                </div>

                {/* Color */}
                <div>
                  <FieldLabel>{isAr ? 'اللون' : 'Color'}</FieldLabel>
                  <div className="flex gap-2">
                    {COLOR_OPTIONS.map(c => (
                      <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                        className={cn('h-7 w-7 rounded-full border-2 transition-all', form.color === c ? 'scale-110 border-[var(--foreground)]/50' : 'border-transparent')}
                        style={{ background: c === 'theme' ? 'var(--color-primary)' : c }} />
                    ))}
                  </div>
                </div>

                {/* Linked Habit */}
                {(store.habits ?? []).length > 0 && (
                  <div>
                    <FieldLabel>{isAr ? 'ربط بعادة' : 'Linked Habit'}</FieldLabel>
                    <select value={form.linkedHabitId} onChange={e => setForm(f => ({ ...f, linkedHabitId: e.target.value }))}
                      className="w-full rounded-xl border border-[var(--foreground)]/10 bg-transparent px-3 py-2.5 text-sm focus:border-[var(--color-primary)]/40 focus:outline-none">
                      <option value="">{isAr ? 'بدون ربط' : 'None'}</option>
                      {(store.habits ?? []).filter(h => !h.archived).map(h => (
                        <option key={h.id} value={h.id}>{isAr ? (h.nameAr || h.nameEn) : (h.nameEn || h.nameAr)}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-[var(--foreground)]/10 bg-[var(--color-background)] p-5">
                {editingTask && (
                  <button type="button" onClick={() => { store.deleteTask(editingTask.id); setShowForm(false); resetForm(); toast.notifySuccess(isAr ? 'تم الحذف' : 'Deleted'); }}
                    className="flex items-center gap-1 text-xs text-red-400 hover:text-red-500">
                    <Trash2 className="h-3.5 w-3.5" /> {isAr ? 'حذف' : 'Delete'}
                  </button>
                )}
                <div className="ms-auto flex gap-3">
                  <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                    className="rounded-xl px-4 py-2.5 text-sm text-[var(--foreground)]/50 hover:bg-[var(--foreground)]/[0.05]">
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button type="button" onClick={handleSave} disabled={!form.titleEn && !form.titleAr}
                    className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-md disabled:opacity-40"
                    style={{ background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.8))' }}>
                    {editingTask ? (isAr ? 'تحديث' : 'Update') : (isAr ? 'إنشاء' : 'Create')}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══ TASK DETAIL MODAL ═══ */}
      <AnimatePresence>
        {detailTask && (
          <TaskDetailModal
            task={detailTask}
            isAr={isAr}
            today={today}
            store={store}
            getRelativeDate={getRelativeDate}
            getHabitName={getHabitName}
            onClose={() => setDetailTask(null)}
            onEdit={(task) => { setDetailTask(null); openEdit(task); }}
            onComplete={quickComplete}
            onStart={quickStart}
            onPostpone={quickPostpone}
            onMoveToToday={quickMoveToToday}
            onDelete={(id) => { quickDelete(id); setDetailTask(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TASK DETAIL MODAL
// ═══════════════════════════════════════════════════════════

function TaskDetailModal({
  task, isAr, today, store, getRelativeDate, getHabitName, onClose, onEdit,
  onComplete, onStart, onPostpone, onMoveToToday, onDelete,
}: {
  task: Task; isAr: boolean; today: string; store: ReturnType<typeof useAppStore>;
  getRelativeDate: (d: string) => { text: string; cls: string };
  getHabitName: (id: string) => string | null;
  onClose: () => void; onEdit: (task: Task) => void;
  onComplete: (id: string) => void; onStart: (id: string) => void;
  onPostpone: (id: string) => void; onMoveToToday: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const priority = PRIORITY_CONFIG[task.priority];
  const status = STATUS_CONFIG[task.status];
  const isDone = task.status === 'completed';
  const isCancelled = task.status === 'cancelled';
  const name = isAr ? (task.titleAr || task.titleEn) : (task.titleEn || task.titleAr);
  const subtasksDone = task.subtasks?.filter(s => s.completed).length ?? 0;
  const subtasksTotal = task.subtasks?.length ?? 0;
  const subtaskPct = subtasksTotal > 0 ? (subtasksDone / subtasksTotal) * 100 : 0;
  const habitName = task.linkedHabitId ? getHabitName(task.linkedHabitId) : null;

  // Re-read the task from store so subtask toggles reflect live
  const liveTask = (store.tasks ?? []).find(t => t.id === task.id) ?? task;
  const liveSubtasks = liveTask.subtasks ?? [];
  const liveSubDone = liveSubtasks.filter(s => s.completed).length;
  const liveSubTotal = liveSubtasks.length;
  const liveSubPct = liveSubTotal > 0 ? (liveSubDone / liveSubTotal) * 100 : 0;

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[var(--z-overlay)] bg-black/40 backdrop-blur-md" />
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="fixed inset-x-4 top-[5%] z-[var(--z-modal)] max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--foreground)]/10 bg-[var(--color-background)] shadow-2xl sm:inset-x-0 sm:mx-auto sm:w-[600px]"
      >
        {/* Priority accent bar */}
        <div className="h-1 w-full shrink-0" style={{ backgroundColor: priority.border }} aria-hidden />

        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-[var(--foreground)]/10 bg-[var(--color-background)]/95 px-5 py-4 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold leading-snug text-[var(--foreground)]">{name}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className={cn('rounded-md px-2 py-0.5 text-[11px] font-semibold', status.bg, status.color)}>
                  {isAr ? status.ar : status.en}
                </span>
                <span className={cn('rounded-md px-2 py-0.5 text-[11px] font-semibold', priority.bg, priority.color)}>
                  {isAr ? priority.ar : priority.en}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => onEdit(task)}
                className="rounded-lg p-2 text-[var(--foreground)]/45 hover:bg-[var(--foreground)]/[0.06] hover:text-[var(--color-primary)]"
                title={isAr ? 'تعديل' : 'Edit'}>
                <Edit3 className="h-4 w-4" />
              </button>
              <button type="button" onClick={onClose}
                className="rounded-lg p-2 text-[var(--foreground)]/45 hover:bg-[var(--foreground)]/[0.06]">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-5 p-5">

          {/* Section 1: Quick Actions */}
          {!isDone && !isCancelled && (
            <div>
              <SectionLabel>{isAr ? 'إجراءات سريعة' : 'Quick Actions'}</SectionLabel>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" onClick={() => onComplete(task.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-2 text-[11px] font-semibold text-emerald-600 transition-colors hover:bg-emerald-500/20 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {isAr ? 'إكمال' : 'Complete'}
                </button>
                {task.status === 'todo' && (
                  <button type="button" onClick={() => onStart(task.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500/10 px-3 py-2 text-[11px] font-semibold text-blue-600 transition-colors hover:bg-blue-500/20 dark:text-blue-400">
                    <Play className="h-3.5 w-3.5" /> {isAr ? 'بدء' : 'Start'}
                  </button>
                )}
                <button type="button" onClick={() => onPostpone(task.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--foreground)]/[0.06] px-3 py-2 text-[11px] font-semibold text-[var(--foreground)]/60 transition-colors hover:bg-[var(--foreground)]/[0.1]">
                  <CalendarClock className="h-3.5 w-3.5" /> {isAr ? 'تأجيل لغداً' : 'Postpone'}
                </button>
                {task.dueDate !== today && (
                  <button type="button" onClick={() => onMoveToToday(task.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-2 text-[11px] font-semibold text-amber-600 transition-colors hover:bg-amber-500/20 dark:text-amber-400">
                    <ArrowRight className="h-3.5 w-3.5" /> {isAr ? 'نقل لليوم' : 'Move to today'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Section 2: Details */}
          <div>
            <SectionLabel>{isAr ? 'التفاصيل' : 'Details'}</SectionLabel>
            <div className="mt-2 space-y-2">
              {task.dueDate && (
                <DetailRow icon={<Calendar className="h-4 w-4" />} label={isAr ? 'تاريخ الاستحقاق' : 'Due Date'}>
                  <span className={cn('text-sm font-medium', getRelativeDate(task.dueDate).cls)}>
                    {task.dueDate} <span className="text-[11px] font-normal">({getRelativeDate(task.dueDate).text})</span>
                  </span>
                </DetailRow>
              )}
              {task.dueTime && (
                <DetailRow icon={<Clock className="h-4 w-4" />} label={isAr ? 'الوقت' : 'Due Time'}>
                  <span className="text-sm text-[var(--foreground)]/70">{task.dueTime}</span>
                </DetailRow>
              )}
              {task.estimatedMinutes && (
                <DetailRow icon={<Timer className="h-4 w-4" />} label={isAr ? 'الوقت المقدر' : 'Estimated Time'}>
                  <span className="text-sm text-[var(--foreground)]/70">
                    {task.estimatedMinutes} {isAr ? 'دقيقة' : 'minutes'}
                  </span>
                </DetailRow>
              )}
              {task.category && (
                <DetailRow icon={<Tag className="h-4 w-4" />} label={isAr ? 'التصنيف' : 'Category'}>
                  <span className="rounded-md bg-[var(--foreground)]/[0.06] px-2 py-0.5 text-xs font-medium text-[var(--foreground)]/60">
                    {task.category}
                  </span>
                </DetailRow>
              )}
              <DetailRow icon={<Calendar className="h-4 w-4" />} label={isAr ? 'تاريخ الإنشاء' : 'Created'}>
                <span className="text-sm text-[var(--foreground)]/50">
                  {new Date(task.createdAt).toLocaleDateString(isAr ? 'ar' : 'en', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </DetailRow>
              {task.updatedAt && (
                <DetailRow icon={<Clock className="h-4 w-4" />} label={isAr ? 'آخر تحديث' : 'Updated'}>
                  <span className="text-sm text-[var(--foreground)]/50">
                    {new Date(task.updatedAt).toLocaleDateString(isAr ? 'ar' : 'en', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </DetailRow>
              )}
            </div>
          </div>

          {/* Section 3: Description */}
          {(task.descriptionEn || task.descriptionAr) && (
            <div>
              <SectionLabel>{isAr ? 'الوصف' : 'Description'}</SectionLabel>
              <div className="mt-2 space-y-2 rounded-xl bg-[var(--foreground)]/[0.03] p-3">
                {task.descriptionAr && (
                  <p dir="rtl" className="text-sm leading-relaxed text-[var(--foreground)]/70">{task.descriptionAr}</p>
                )}
                {task.descriptionEn && (
                  <p dir="ltr" className="text-sm leading-relaxed text-[var(--foreground)]/70">{task.descriptionEn}</p>
                )}
              </div>
            </div>
          )}

          {/* Section 4: Subtasks */}
          {liveSubTotal > 0 && (
            <div>
              <SectionLabel>{isAr ? 'المهام الفرعية' : 'Subtasks'}</SectionLabel>
              <div className="mt-2">
                {/* Progress bar */}
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--foreground)]/[0.08]">
                    <div className="h-full rounded-full bg-[var(--color-primary)] transition-all" style={{ width: `${liveSubPct}%` }} />
                  </div>
                  <span className="text-xs font-semibold tabular-nums text-[var(--foreground)]/50">
                    {liveSubDone}/{liveSubTotal}
                  </span>
                </div>
                {/* Checklist */}
                <div className="space-y-1">
                  {liveSubtasks.map(st => (
                    <button key={st.id} type="button"
                      onClick={() => store.toggleSubtask(task.id, st.id)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-start transition-colors hover:bg-[var(--foreground)]/[0.04]">
                      <span className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                        st.completed ? 'border-emerald-500 bg-emerald-500' : 'border-[var(--foreground)]/25',
                      )}>
                        {st.completed && <Check className="h-3 w-3 text-white" />}
                      </span>
                      <span className={cn('text-sm', st.completed && 'text-[var(--foreground)]/40 line-through')}>
                        {st.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Section 5: Tags */}
          {task.tags && task.tags.length > 0 && (
            <div>
              <SectionLabel>{isAr ? 'العلامات' : 'Tags'}</SectionLabel>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {task.tags.map(t => (
                  <span key={t} className="rounded-full bg-[var(--color-primary)]/10 px-2.5 py-1 text-[11px] font-medium text-[var(--color-primary)]">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Section 6: Linked Habit */}
          {habitName && (
            <div>
              <SectionLabel>{isAr ? 'عادة مرتبطة' : 'Linked Habit'}</SectionLabel>
              <div className="mt-2 flex items-center gap-2 rounded-xl bg-[var(--color-primary)]/[0.06] px-3 py-2.5">
                <Link2 className="h-4 w-4 text-[var(--color-primary)]" />
                <span className="text-sm font-medium text-[var(--color-primary)]">{habitName}</span>
              </div>
            </div>
          )}

          {/* Section 7: Notes */}
          {task.notes && (
            <div>
              <SectionLabel>{isAr ? 'ملاحظات' : 'Notes'}</SectionLabel>
              <div className="mt-2 whitespace-pre-wrap rounded-xl bg-[var(--foreground)]/[0.03] p-3 text-sm leading-relaxed text-[var(--foreground)]/70">
                {task.notes}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-[var(--foreground)]/10 bg-[var(--color-background)] p-5">
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-400">{isAr ? 'هل أنت متأكد؟' : 'Are you sure?'}</span>
              <button type="button" onClick={() => onDelete(task.id)}
                className="rounded-lg bg-red-500 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-red-600">
                {isAr ? 'نعم، احذف' : 'Yes, delete'}
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)}
                className="rounded-lg px-3 py-1.5 text-[11px] font-semibold text-[var(--foreground)]/50 hover:bg-[var(--foreground)]/[0.05]">
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-500">
              <Trash2 className="h-3.5 w-3.5" /> {isAr ? 'حذف' : 'Delete'}
            </button>
          )}
          <button type="button" onClick={() => onEdit(task)}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md"
            style={{ background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.8))' }}>
            <span className="flex items-center gap-1.5">
              <Edit3 className="h-4 w-4" /> {isAr ? 'تعديل' : 'Edit'}
            </span>
          </button>
        </div>
      </motion.div>
    </>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground)]/40">
      {children}
    </h3>
  );
}

function DetailRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-1 py-1.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--foreground)]/[0.05] text-[var(--foreground)]/40">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--foreground)]/35">{label}</p>
        {children}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// FIELD LABEL
// ═══════════════════════════════════════════════════════════

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground)]/40">{children}</label>;
}

// ═══════════════════════════════════════════════════════════
// BOARD COLUMN
// ═══════════════════════════════════════════════════════════

function BoardColumn({
  columnId, title, icon, accent, tasks, isAr, today, store, onEdit, onDetail, onComplete,
  onStart, onPostpone, onMoveToToday, onDelete, getRelativeDate, getHabitName,
  menuOpenId, setMenuOpenId,
}: {
  columnId: BoardColumnId; title: string; icon: React.ReactNode; accent: string;
  tasks: Task[]; isAr: boolean; today: string; store: ReturnType<typeof useAppStore>;
  onEdit: (task: Task) => void; onDetail: (task: Task) => void; onComplete: (id: string) => void;
  onStart: (id: string) => void; onPostpone: (id: string) => void;
  onMoveToToday: (id: string) => void; onDelete: (id: string) => void;
  getRelativeDate: (d: string) => { text: string; cls: string };
  getHabitName: (id: string) => string | null;
  menuOpenId: string | null; setMenuOpenId: (id: string | null) => void;
}) {
  const taskIds = useMemo(() => tasks.map(t => t.id), [tasks]);

  // Split overdue vs today for the today-overdue column
  const overdueTasks = useMemo(() =>
    columnId === 'today-overdue' ? tasks.filter(t => t.dueDate != null && t.dueDate < today) : [],
    [columnId, tasks, today]
  );
  const todayTasks = useMemo(() =>
    columnId === 'today-overdue' ? tasks.filter(t => t.dueDate != null && t.dueDate >= today) : [],
    [columnId, tasks, today]
  );

  const renderCard = (task: Task, i: number) => (
    <SortableTaskCard key={task.id} task={task} isAr={isAr} today={today}
      onEdit={() => onEdit(task)} onDetail={() => onDetail(task)} onComplete={() => onComplete(task.id)}
      onStart={() => onStart(task.id)} onPostpone={() => onPostpone(task.id)}
      onMoveToToday={() => onMoveToToday(task.id)} onDelete={() => onDelete(task.id)}
      onToggleSubtask={(sid) => store.toggleSubtask(task.id, sid)}
      getRelativeDate={getRelativeDate} getHabitName={getHabitName}
      index={i} menuOpen={menuOpenId === task.id}
      setMenuOpen={(open) => setMenuOpenId(open ? task.id : null)} />
  );

  return (
    <div className={cn(
      'flex flex-col overflow-hidden rounded-xl border border-[var(--foreground)]/10',
      columnId === 'in-progress' && 'bg-blue-500/[0.02]',
    )}>
      <div className="h-0.5 w-full shrink-0" style={{ backgroundColor: accent }} />
      <div className="flex items-center gap-2 px-3 py-2.5" style={{ background: 'rgba(var(--color-primary-rgb) / 0.03)' }}>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ color: accent, background: `${accent}15` }}>
          {icon}
        </span>
        <h2 className="flex-1 text-xs font-semibold text-[var(--foreground)]/90 sm:text-sm">{title}</h2>
        <span className="rounded-lg px-2 py-0.5 text-[11px] font-bold tabular-nums" style={{ color: accent, background: `${accent}15` }}>
          {tasks.length}
        </span>
      </div>

      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="flex min-h-[120px] flex-1 flex-col gap-1.5 p-2">
          {tasks.length === 0 ? (
            <EmptyColumn isAr={isAr} columnId={columnId} />
          ) : columnId === 'today-overdue' ? (
            <>
              {/* Overdue section */}
              {overdueTasks.length > 0 && (
                <div className="rounded-lg bg-red-500/[0.04] p-1.5">
                  <div className="mb-1.5 flex items-center gap-1.5 px-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    <span className="text-[10px] font-semibold text-red-500">
                      {isAr ? 'متأخرة' : 'Overdue'} ({overdueTasks.length})
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {overdueTasks.map((task, i) => renderCard(task, i))}
                  </div>
                </div>
              )}
              {/* Divider between sections */}
              {overdueTasks.length > 0 && todayTasks.length > 0 && (
                <div className="mx-2 border-t border-[var(--foreground)]/8" />
              )}
              {/* Today section */}
              {todayTasks.length > 0 && (
                <div className="p-1.5">
                  <div className="mb-1.5 flex items-center gap-1.5 px-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    <span className="text-[10px] font-semibold text-amber-500">
                      {isAr ? 'اليوم' : 'Today'} ({todayTasks.length})
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {todayTasks.map((task, i) => renderCard(task, overdueTasks.length + i))}
                  </div>
                </div>
              )}
            </>
          ) : (
            tasks.map((task, i) => renderCard(task, i))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SORTABLE TASK CARD
// ═══════════════════════════════════════════════════════════

function SortableTaskCard(props: {
  task: Task; isAr: boolean; today: string; index: number;
  onEdit: () => void; onDetail: () => void; onComplete: () => void; onStart: () => void;
  onPostpone: () => void; onMoveToToday: () => void; onDelete: () => void;
  onToggleSubtask: (sid: string) => void;
  getRelativeDate: (d: string) => { text: string; cls: string };
  getHabitName: (id: string) => string | null;
  menuOpen: boolean; setMenuOpen: (v: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.task.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard {...props} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TASK CARD (shared by board & list)
// ═══════════════════════════════════════════════════════════

function TaskCard({
  task, isAr, today, onEdit, onDetail, onComplete, onStart, onPostpone, onMoveToToday, onDelete,
  onToggleSubtask, getRelativeDate, getHabitName, index, menuOpen, setMenuOpen,
}: {
  task: Task; isAr: boolean; today: string; index: number;
  onEdit: () => void; onDetail: () => void; onComplete: () => void; onStart: () => void;
  onPostpone: () => void; onMoveToToday: () => void; onDelete: () => void;
  onToggleSubtask: (sid: string) => void;
  getRelativeDate: (d: string) => { text: string; cls: string };
  getHabitName: (id: string) => string | null;
  menuOpen: boolean; setMenuOpen: (v: boolean) => void;
}) {
  const name = isAr ? (task.titleAr || task.titleEn) : (task.titleEn || task.titleAr);
  const isDone = task.status === 'completed';
  const isOver = task.dueDate != null && task.dueDate < today && !isDone && task.status !== 'cancelled';
  const priority = PRIORITY_CONFIG[task.priority];
  const subtasksDone = task.subtasks?.filter(s => s.completed).length ?? 0;
  const subtasksTotal = task.subtasks?.length ?? 0;
  const subtaskPct = subtasksTotal > 0 ? (subtasksDone / subtasksTotal) * 100 : 0;
  const habitName = task.linkedHabitId ? getHabitName(task.linkedHabitId) : null;
  const menuRef = useRef<HTMLDivElement>(null);

  const isInProgress = task.status === 'in-progress';

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02, duration: 0.2 }}
      onClick={onDetail}
      className={cn(
        'group relative cursor-pointer overflow-hidden rounded-lg border border-[var(--foreground)]/10 bg-[var(--color-background)] transition-all',
        isDone && 'opacity-75',
        isOver && '!border-red-400/40 !bg-red-500/[0.04]',
        isInProgress && '!border-blue-400/30 !bg-blue-500/[0.03]',
      )}
      style={{ borderInlineStartWidth: 3, borderInlineStartColor: priority.border }}
    >
      <div className="p-3">
        <div className="flex items-start gap-2.5">
          {/* Toggle */}
          <button type="button" onClick={(e) => { e.stopPropagation(); onComplete(); }}
            className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all',
              isDone ? 'border-emerald-500 bg-emerald-500' : isOver ? 'border-red-400 hover:bg-red-500/15' : 'border-[var(--foreground)]/25 hover:border-[var(--color-primary)]')}>
            {isDone && <Check className="h-3 w-3 text-white" />}
          </button>

          <div className="min-w-0 flex-1">
            {/* Title row with in-progress pulse */}
            <div className="flex items-center gap-1.5">
              {isInProgress && (
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
                </span>
              )}
              <p className={cn('text-[13px] font-semibold leading-snug', isDone && 'text-[var(--foreground)]/40 line-through')}>
                {name}
              </p>
            </div>

            {/* Badges row */}
            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium', priority.bg, priority.color)}>
                {isAr ? priority.ar : priority.en}
              </span>
              {task.category && (
                <span className="rounded bg-[var(--foreground)]/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-[var(--foreground)]/55">
                  {task.category}
                </span>
              )}
              {isOver && (
                <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-red-500">
                  {isAr ? 'متأخرة' : 'Overdue'}
                </span>
              )}
              {isInProgress && (
                <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-500">
                  {isAr ? 'جارية' : 'In Progress'}
                </span>
              )}
            </div>

            {/* Info row: due date + estimated time inline */}
            <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
              {task.dueDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-[var(--foreground)]/30" />
                  <span className={cn('text-[10px]', getRelativeDate(task.dueDate).cls)}>
                    {getRelativeDate(task.dueDate).text}
                  </span>
                </div>
              )}
              {task.estimatedMinutes && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-[var(--foreground)]/30" />
                  <span className="text-[10px] text-[var(--foreground)]/40">{task.estimatedMinutes} {isAr ? 'د' : 'min'}</span>
                </div>
              )}
              {isInProgress && task.updatedAt && (
                <div className="flex items-center gap-1">
                  <Timer className="h-3 w-3 text-blue-400/50" />
                  <span className="text-[10px] text-blue-400/70">
                    {isAr ? 'بدأ' : 'Started'}{' '}
                    {new Date(task.updatedAt).toLocaleTimeString(isAr ? 'ar' : 'en', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>

            {/* Subtask progress */}
            {subtasksTotal > 0 && (
              <div className="mt-1.5">
                <div className="flex items-center gap-1.5">
                  <ListChecks className="h-3 w-3 text-[var(--foreground)]/25" />
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--foreground)]/[0.08]">
                    <div className="h-full rounded-full bg-[var(--color-primary)] transition-all" style={{ width: `${subtaskPct}%` }} />
                  </div>
                  <span className="text-[10px] font-medium text-[var(--foreground)]/40">{subtasksDone}/{subtasksTotal}</span>
                </div>
              </div>
            )}

            {/* Tags (max 2 visible + "+N") */}
            {task.tags && task.tags.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {task.tags.slice(0, 2).map(t => (
                  <span key={t} className="rounded-full bg-[var(--color-primary)]/[0.08] px-1.5 py-px text-[9px] font-medium text-[var(--color-primary)]">
                    {t}
                  </span>
                ))}
                {task.tags.length > 2 && (
                  <span className="rounded-full bg-[var(--foreground)]/[0.06] px-1.5 py-px text-[9px] font-medium text-[var(--foreground)]/35">
                    +{task.tags.length - 2}
                  </span>
                )}
              </div>
            )}

            {/* Linked habit */}
            {habitName && (
              <div className="mt-1 flex items-center gap-1">
                <Link2 className="h-3 w-3 text-[var(--color-primary)]/50" />
                <span className="text-[10px] text-[var(--color-primary)]/70">{habitName}</span>
              </div>
            )}
          </div>

          {/* Quick action buttons + menu */}
          <div className="flex shrink-0 flex-col items-end gap-1">
            {/* Primary quick actions - always visible */}
            <div className="flex items-center gap-0.5">
              {task.status === 'todo' && (
                <button type="button" onClick={(e) => { e.stopPropagation(); onStart(); }}
                  title={isAr ? 'بدء' : 'Start'}
                  className="rounded-md p-1 text-blue-500/60 transition-colors hover:bg-blue-500/10 hover:text-blue-500">
                  <Play className="h-3.5 w-3.5" />
                </button>
              )}
              {!isDone && (
                <button type="button" onClick={(e) => { e.stopPropagation(); onComplete(); }}
                  title={isAr ? 'إكمال' : 'Complete'}
                  className="rounded-md p-1 text-emerald-500/60 transition-colors hover:bg-emerald-500/10 hover:text-emerald-500">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </button>
              )}

              {/* Secondary actions menu */}
              <div className="relative" ref={menuRef}>
                <button type="button" onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                  className="rounded-md p-1 text-[var(--foreground)]/30 transition-colors hover:bg-[var(--foreground)]/[0.06] hover:text-[var(--foreground)]/60">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute end-0 top-7 z-30 w-40 overflow-hidden rounded-xl border border-[var(--foreground)]/10 bg-[var(--color-background)] shadow-xl">
                      <button type="button" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit(); }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-[11px] text-[var(--foreground)]/70 hover:bg-[var(--foreground)]/[0.05]">
                        <Edit3 className="h-3 w-3" /> {isAr ? 'تعديل' : 'Edit'}
                      </button>
                      {task.dueDate !== today && task.status !== 'completed' && (
                        <button type="button" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onMoveToToday(); }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-[11px] text-amber-500 hover:bg-amber-500/5">
                          <ArrowRight className="h-3 w-3" /> {isAr ? 'نقل لليوم' : 'Move to today'}
                        </button>
                      )}
                      {task.status !== 'completed' && (
                        <button type="button" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onPostpone(); }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-[11px] text-[var(--foreground)]/50 hover:bg-[var(--foreground)]/[0.05]">
                          <CalendarClock className="h-3 w-3" /> {isAr ? 'تأجيل لغداً' : 'Postpone'}
                        </button>
                      )}
                      <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="flex w-full items-center gap-2 border-t border-[var(--foreground)]/5 px-3 py-2 text-[11px] text-red-400 hover:bg-red-500/5">
                        <Trash2 className="h-3 w-3" /> {isAr ? 'حذف' : 'Delete'}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
// LIST ROW
// ═══════════════════════════════════════════════════════════

function ListRow({
  task, isAr, today, index, onComplete, onDetail, getRelativeDate,
}: {
  task: Task; isAr: boolean; today: string; index: number;
  onComplete: () => void; onDetail: () => void;
  getRelativeDate: (d: string) => { text: string; cls: string };
}) {
  const name = isAr ? (task.titleAr || task.titleEn) : (task.titleEn || task.titleAr);
  const isDone = task.status === 'completed';
  const priority = PRIORITY_CONFIG[task.priority];
  const subtasksDone = task.subtasks?.filter(s => s.completed).length ?? 0;
  const subtasksTotal = task.subtasks?.length ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      transition={{ delay: index * 0.015 }}
      onClick={onDetail}
      className={cn(
        'flex cursor-pointer items-center gap-2 border-b border-[var(--foreground)]/5 px-3 py-2.5 transition-colors hover:bg-[var(--foreground)]/[0.02]',
        isDone && 'opacity-60',
      )}
      style={{ borderInlineStartWidth: 3, borderInlineStartColor: priority.border }}
    >
      <button type="button" onClick={(e) => { e.stopPropagation(); onComplete(); }}
        className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all',
          isDone ? 'border-emerald-500 bg-emerald-500' : 'border-[var(--foreground)]/25 hover:border-[var(--color-primary)]')}>
        {isDone && <Check className="h-3 w-3 text-white" />}
      </button>

      <span className={cn('min-w-0 flex-1 truncate text-[13px] font-medium', isDone && 'text-[var(--foreground)]/40 line-through')}>
        {name}
      </span>

      <span className={cn('hidden w-20 text-center sm:block')}>
        <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium', priority.bg, priority.color)}>
          {isAr ? priority.ar : priority.en}
        </span>
      </span>

      <span className="hidden w-24 text-center sm:block">
        {task.dueDate ? (
          <span className={cn('text-[10px]', getRelativeDate(task.dueDate).cls)}>
            {getRelativeDate(task.dueDate).text}
          </span>
        ) : (
          <span className="text-[10px] text-[var(--foreground)]/25">-</span>
        )}
      </span>

      <span className="hidden w-20 text-center sm:block">
        <span className="text-[10px] text-[var(--foreground)]/50">{task.category || '-'}</span>
      </span>

      <span className="hidden w-16 text-center sm:block">
        <span className="text-[10px] text-[var(--foreground)]/40">
          {task.estimatedMinutes ? `${task.estimatedMinutes}m` : '-'}
        </span>
      </span>

      <span className="hidden w-20 text-center sm:block">
        {subtasksTotal > 0 ? (
          <span className="text-[10px] text-[var(--foreground)]/50">{subtasksDone}/{subtasksTotal}</span>
        ) : (
          <span className="text-[10px] text-[var(--foreground)]/25">-</span>
        )}
      </span>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
// EMPTY STATES
// ═══════════════════════════════════════════════════════════

function EmptyGlobal({ isAr, onAdd }: { isAr: boolean; onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--foreground)]/15 py-16">
      <ClipboardList className="h-10 w-10 text-[var(--foreground)]/15" strokeWidth={1.25} />
      <p className="mt-3 text-sm font-medium text-[var(--foreground)]/40">
        {isAr ? 'لا توجد مهام بعد' : 'No tasks yet'}
      </p>
      <p className="mt-1 text-xs text-[var(--foreground)]/30">
        {isAr ? 'أنشئ أول مهمة للبدء' : 'Create your first task to get started'}
      </p>
      <button type="button" onClick={onAdd}
        className="mt-4 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white"
        style={{ background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.8))' }}>
        <Plus className="h-4 w-4" /> {isAr ? 'مهمة جديدة' : 'New Task'}
      </button>
    </div>
  );
}

function EmptyFiltered({ isAr, onClear }: { isAr: boolean; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--foreground)]/15 py-12">
      <Search className="h-8 w-8 text-[var(--foreground)]/15" strokeWidth={1.25} />
      <p className="mt-3 text-sm font-medium text-[var(--foreground)]/40">
        {isAr ? 'لا توجد مهام مطابقة' : 'No matching tasks'}
      </p>
      <button type="button" onClick={onClear}
        className="mt-3 text-xs font-semibold text-[var(--color-primary)] hover:underline">
        {isAr ? 'مسح الفلاتر' : 'Clear filters'}
      </button>
    </div>
  );
}

function EmptyColumn({ isAr, columnId }: { isAr: boolean; columnId: BoardColumnId }) {
  const messages: Record<BoardColumnId, { en: string; ar: string }> = {
    'today-overdue': { en: 'Nothing due today', ar: 'لا مهام مستحقة اليوم' },
    'in-progress': { en: 'No tasks in progress', ar: 'لا مهام جارية' },
    'upcoming': { en: 'No upcoming tasks', ar: 'لا مهام قادمة' },
    'completed': { en: 'No completed tasks yet', ar: 'لا مهام مكتملة بعد' },
  };
  const icons: Record<BoardColumnId, React.ReactNode> = {
    'today-overdue': <CheckCircle2 className="h-6 w-6 text-[var(--foreground)]/15" />,
    'in-progress': <Play className="h-6 w-6 text-[var(--foreground)]/15" />,
    'upcoming': <CalendarClock className="h-6 w-6 text-[var(--foreground)]/15" />,
    'completed': <CheckCircle2 className="h-6 w-6 text-[var(--foreground)]/15" />,
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center py-8">
      {icons[columnId]}
      <p className="mt-2 text-center text-[11px] text-[var(--foreground)]/35">
        {isAr ? messages[columnId].ar : messages[columnId].en}
      </p>
    </div>
  );
}
