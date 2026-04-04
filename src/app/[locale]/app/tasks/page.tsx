'use client';

import React, { useState, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import {
  Task, TaskStatus, TaskPriority, todayString, generateId,
} from '@/types/app';
import {
  Plus, Search, X, Check, ChevronDown, Clock, Calendar,
  Filter, SortAsc, SortDesc, AlertCircle, CheckCircle2,
  Circle, Trash2, Edit3, Sparkles,
  TrendingUp, ClipboardList, ListChecks,
  ChevronUp, CalendarClock, BarChart3,
} from 'lucide-react';

// ── Constants ─────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } }),
};

const PRIORITY_CONFIG: Record<TaskPriority, { en: string; ar: string; color: string; bg: string; icon: string }> = {
  urgent: { en: 'Urgent', ar: 'عاجل', color: 'text-red-500', bg: 'bg-red-500/10', icon: '!!' },
  high: { en: 'High', ar: 'مرتفع', color: 'text-orange-500', bg: 'bg-orange-500/10', icon: '!' },
  medium: { en: 'Medium', ar: 'متوسط', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: '-' },
  low: { en: 'Low', ar: 'منخفض', color: 'text-blue-400', bg: 'bg-blue-400/10', icon: '~' },
};

const STATUS_CONFIG: Record<TaskStatus, { en: string; ar: string; color: string; bg: string }> = {
  'todo': { en: 'To do', ar: 'معلّقة', color: 'text-[var(--foreground)]/55', bg: 'bg-[var(--foreground)]/[0.06]' },
  'in-progress': { en: 'In progress', ar: 'جارية', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
  'completed': { en: 'Done', ar: 'منجزة', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
  'cancelled': { en: 'Archived', ar: 'مؤرشفة', color: 'text-[var(--foreground)]/40', bg: 'bg-[var(--foreground)]/[0.05]' },
};

function addDaysToIsoDate(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

const CATEGORY_PRESETS = [
  { en: 'Work', ar: 'عمل' },
  { en: 'Personal', ar: 'شخصي' },
  { en: 'Health', ar: 'صحة' },
  { en: 'Learning', ar: 'تعلم' },
  { en: 'Finance', ar: 'مالية' },
  { en: 'Home', ar: 'منزل' },
  { en: 'Social', ar: 'اجتماعي' },
  { en: 'Project', ar: 'مشروع' },
];

// ── Main Page ─────────────────────────────────────────────

export default function TasksPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const store = useAppStore();
  const today = todayString();

  // UI State
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'created' | 'name'>('dueDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [taskScope, setTaskScope] = useState<'all' | 'today' | 'week' | 'stakes'>('all');

  // Form State
  const [form, setForm] = useState({
    titleEn: '', titleAr: '', descriptionEn: '', descriptionAr: '',
    status: 'todo' as TaskStatus, priority: 'medium' as TaskPriority,
    category: '', dueDate: '', dueTime: '', estimatedMinutes: '' as string | number,
    tags: [] as string[], notes: '', color: 'theme',
    subtasks: [] as { id: string; title: string; completed: boolean }[],
    newSubtask: '',
  });

  const resetForm = () => {
    setForm({
      titleEn: '', titleAr: '', descriptionEn: '', descriptionAr: '',
      status: 'todo', priority: 'medium', category: '', dueDate: '', dueTime: '',
      estimatedMinutes: '', tags: [], notes: '', color: 'theme',
      subtasks: [], newSubtask: '',
    });
    setEditingTask(null);
  };

  const openCreate = () => { resetForm(); setShowForm(true); };

  const openEdit = (task: Task) => {
    setForm({
      titleEn: task.titleEn, titleAr: task.titleAr,
      descriptionEn: task.descriptionEn ?? '', descriptionAr: task.descriptionAr ?? '',
      status: task.status, priority: task.priority,
      category: task.category ?? '', dueDate: task.dueDate ?? '', dueTime: task.dueTime ?? '',
      estimatedMinutes: task.estimatedMinutes ?? '',
      tags: task.tags ?? [], notes: task.notes ?? '', color: task.color ?? 'theme',
      subtasks: task.subtasks ?? [], newSubtask: '',
    });
    setEditingTask(task);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.titleEn && !form.titleAr) return;
    const { newSubtask, ...rest } = form;
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
    };
    if (editingTask) {
      store.updateTask(editingTask.id, data);
    } else {
      store.addTask(data);
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

  const removeSubtask = (id: string) => {
    setForm(f => ({ ...f, subtasks: f.subtasks.filter(s => s.id !== id) }));
  };

  // ── Computed Data ──

  const allTasks = store.tasks ?? [];

  const filteredTasks = useMemo(() => {
    let tasks = [...allTasks];

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      tasks = tasks.filter(t =>
        t.titleEn.toLowerCase().includes(q) ||
        t.titleAr.toLowerCase().includes(q) ||
        t.descriptionEn?.toLowerCase().includes(q) ||
        t.descriptionAr?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q) ||
        t.tags?.some(tag => tag.toLowerCase().includes(q))
      );
    }

    // Filters
    if (filterPriority !== 'all') tasks = tasks.filter(t => t.priority === filterPriority);
    if (filterStatus !== 'all') tasks = tasks.filter(t => t.status === filterStatus);

    // Quick scope (all / due / week / urgent+high)
    if (taskScope === 'today') {
      tasks = tasks.filter(t => {
        if (t.status === 'completed' || t.status === 'cancelled') return false;
        if (!t.dueDate) return false;
        return t.dueDate <= today;
      });
    } else if (taskScope === 'week') {
      const weekEnd = addDaysToIsoDate(today, 7);
      tasks = tasks.filter(t => {
        if (t.status === 'completed' || t.status === 'cancelled') return false;
        if (!t.dueDate) return false;
        return t.dueDate >= today && t.dueDate <= weekEnd;
      });
    } else if (taskScope === 'stakes') {
      tasks = tasks.filter(
        t => t.status !== 'completed' && t.status !== 'cancelled' && (t.priority === 'urgent' || t.priority === 'high'),
      );
    }

    // Sort
    tasks.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'dueDate':
          cmp = (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999');
          break;
        case 'priority': {
          const order: Record<TaskPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
          cmp = order[a.priority] - order[b.priority];
          break;
        }
        case 'created':
          cmp = b.createdAt.localeCompare(a.createdAt);
          break;
        case 'name':
          cmp = (isAr ? a.titleAr : a.titleEn).localeCompare(isAr ? b.titleAr : b.titleEn);
          break;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });

    return tasks;
  }, [allTasks, searchQuery, filterPriority, filterStatus, sortBy, sortDir, isAr, taskScope, today]);

  // Board columns
  const todayTasks = useMemo(() =>
    filteredTasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled' && t.dueDate && t.dueDate <= today),
    [filteredTasks, today]
  );

  const upcomingTasks = useMemo(() =>
    filteredTasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled' && (!t.dueDate || t.dueDate > today)),
    [filteredTasks, today]
  );

  const completedTasks = useMemo(() =>
    filteredTasks.filter(t => t.status === 'completed').slice(0, 20),
    [filteredTasks]
  );

  // Stats
  const stats = useMemo(() => {
    const total = allTasks.filter(t => t.status !== 'cancelled');
    const completed = allTasks.filter(t => t.status === 'completed');
    const todayDue = allTasks.filter(t => t.dueDate === today && t.status !== 'completed' && t.status !== 'cancelled');
    const overdue = allTasks.filter(t => t.dueDate && t.dueDate < today && t.status !== 'completed' && t.status !== 'cancelled');
    const inProgress = allTasks.filter(t => t.status === 'in-progress');
    const completedToday = allTasks.filter(t => t.status === 'completed' && t.completedAt?.startsWith(today));

    return {
      total: total.length,
      completed: completed.length,
      todayDue: todayDue.length,
      overdue: overdue.length,
      inProgress: inProgress.length,
      completedToday: completedToday.length,
      completionRate: total.length > 0 ? Math.round((completed.length / total.length) * 100) : 0,
    };
  }, [allTasks, today]);

  const isOverdue = (task: Task) => task.dueDate && task.dueDate < today && task.status !== 'completed' && task.status !== 'cancelled';
  const isDueToday = (task: Task) => task.dueDate === today;

  // ── Render ──

  return (
    <div className="mx-auto max-w-[1600px] px-3 pb-20 sm:px-6 lg:px-8">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        custom={0}
        className="tasks-glass-shell tasks-glass-stack mt-3"
      >
        {/* ── Header row ── */}
        <div className="tasks-glass-header flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="tasks-glass-icon-btn flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
              <ClipboardList className="h-4 w-4 text-[var(--color-primary)]" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold leading-tight tracking-tight text-[var(--foreground)] sm:text-xl">
                {isAr ? 'المهام' : 'Tasks'}
              </h1>
              <p className="mt-0.5 text-[11px] leading-snug text-[var(--foreground)]/50 sm:text-xs">
                {isAr
                  ? 'مرتبة حسب الموعد والأولوية — بجانب عاداتك.'
                  : 'Sorted by due date and priority — alongside your habits.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg app-btn-primary px-4 py-2 text-xs font-semibold shadow-md transition-all duration-200 hover:brightness-105 hover:shadow-lg active:scale-[0.98] sm:text-sm"
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.5} />
            {isAr ? 'مهمة جديدة' : 'New task'}
          </button>
        </div>

        {/* ── Stats row (divided cells) ── */}
        <div className="tasks-glass-stats-row flex flex-wrap sm:flex-nowrap">
          {[
            { label: isAr ? 'اليوم' : 'Due today', value: stats.todayDue, tone: 'var(--color-primary)' },
            { label: isAr ? 'جارية' : 'In progress', value: stats.inProgress, tone: '#3b82f6' },
            { label: isAr ? 'متأخرة' : 'Overdue', value: stats.overdue, tone: '#ef4444' },
            { label: isAr ? 'أُنجزت اليوم' : 'Done today', value: stats.completedToday, tone: '#10b981' },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className={cn(
                'tasks-glass-stat-cell flex w-1/2 flex-col gap-0.5 border-[rgba(var(--color-primary-rgb),0.14)] py-2.5 ps-3 pe-2 sm:w-1/4',
                'border-e border-b sm:border-b-0',
                i % 2 === 1 && 'border-e-0 sm:border-e',
                i === 3 && 'sm:border-e-0',
              )}
            >
              <span
                className="text-lg font-semibold tabular-nums leading-none sm:text-xl"
                style={{ color: stat.tone }}
              >
                {stat.value}
              </span>
              <span className="text-[10px] font-medium text-[var(--foreground)]/45 sm:text-[11px]">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* ── Toolbar ── */}
        <div className="tasks-glass-toolbar space-y-2.5 px-3 py-2.5 sm:px-4">
          <div
            className="tasks-glass-segmented flex flex-wrap gap-0.5 rounded-xl p-0.5"
            role="tablist"
            aria-label={isAr ? 'نطاق العرض' : 'View scope'}
          >
            {([
              { id: 'all' as const, en: 'All', ar: 'الكل' },
              { id: 'today' as const, en: 'Due', ar: 'مستحقة' },
              { id: 'week' as const, en: 'Week', ar: 'أسبوع' },
              { id: 'stakes' as const, en: 'Urgent', ar: 'عاجلة' },
            ]).map(opt => (
              <button
                key={opt.id}
                type="button"
                role="tab"
                aria-selected={taskScope === opt.id}
                onClick={() => setTaskScope(opt.id)}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all duration-150 sm:px-3 sm:text-xs',
                  taskScope === opt.id
                    ? 'bg-[var(--color-primary)] text-white shadow-md ring-1 ring-white/25'
                    : 'text-[var(--foreground)]/55 hover:bg-[rgba(var(--color-primary-rgb),0.18)] hover:text-[var(--color-primary)] hover:shadow-sm',
                )}
              >
                {isAr ? opt.ar : opt.en}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--foreground)]/35" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'بحث في المهام…' : 'Search tasks…'}
                className="tasks-glass-input w-full rounded-xl py-1.5 ps-8 pe-8 text-xs text-[var(--foreground)] placeholder:text-[var(--foreground)]/40 sm:text-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute end-1.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-[var(--foreground)]/40 transition-colors hover:bg-[rgba(var(--color-primary-rgb),0.1)] hover:text-[var(--color-primary)]"
                  aria-label={isAr ? 'مسح البحث' : 'Clear search'}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex shrink-0 gap-1.5">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all duration-150 sm:text-sm',
                  showFilters
                    ? 'border-[var(--color-primary)]/40 bg-[rgba(var(--color-primary-rgb),0.2)] text-[var(--color-primary)] shadow-md backdrop-blur-md'
                    : 'border-[rgba(var(--color-primary-rgb),0.22)] bg-[rgba(var(--color-primary-rgb),0.06)] text-[var(--foreground)]/60 backdrop-blur-md hover:border-[rgba(var(--color-primary-rgb),0.35)] hover:bg-[rgba(var(--color-primary-rgb),0.12)] hover:text-[var(--color-primary)]',
                )}
              >
                <Filter className="h-3.5 w-3.5 opacity-80" />
                {isAr ? 'فلتر' : 'Filter'}
                {(filterPriority !== 'all' || filterStatus !== 'all') && (
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-primary)]" />
                )}
              </button>

              <div className="tasks-glass-segmented flex rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('board')}
                  className={cn(
                    'rounded-md px-2 py-1.5 transition-all duration-150',
                    viewMode === 'board'
                      ? 'bg-[var(--color-primary)] text-white shadow-sm'
                      : 'text-[var(--foreground)]/40 hover:bg-[rgba(var(--color-primary-rgb),0.08)] hover:text-[var(--color-primary)]',
                  )}
                  aria-pressed={viewMode === 'board'}
                  aria-label={isAr ? 'عرض اللوحة' : 'Board view'}
                >
                  <BarChart3 className="mx-auto h-3.5 w-3.5 rotate-90 sm:h-4 sm:w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'rounded-md px-2 py-1.5 transition-all duration-150',
                    viewMode === 'list'
                      ? 'bg-[var(--color-primary)] text-white shadow-sm'
                      : 'text-[var(--foreground)]/40 hover:bg-[rgba(var(--color-primary-rgb),0.08)] hover:text-[var(--color-primary)]',
                  )}
                  aria-pressed={viewMode === 'list'}
                  aria-label={isAr ? 'عرض القائمة' : 'List view'}
                >
                  <ListChecks className="mx-auto h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 flex flex-wrap gap-2 border-t border-[rgba(var(--color-primary-rgb),0.15)] pt-2.5">
                {/* Priority filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-[var(--foreground)]/40 uppercase tracking-wider">{isAr ? 'الأولوية' : 'Priority'}</span>
                  <div className="flex gap-1">
                    {(['all', 'urgent', 'high', 'medium', 'low'] as const).map(p => (
                      <button key={p} onClick={() => setFilterPriority(p)}
                        className={cn('rounded-md border border-transparent px-2.5 py-1 text-[11px] font-medium transition-all duration-150',
                          filterPriority === p
                            ? 'border-[var(--color-primary)]/30 bg-[rgba(var(--color-primary-rgb),0.12)] text-[var(--color-primary)]'
                            : 'border-[var(--foreground)]/8 bg-[var(--foreground)]/[0.04] text-[var(--foreground)]/55 hover:border-[rgba(var(--color-primary-rgb),0.25)] hover:bg-[rgba(var(--color-primary-rgb),0.06)] hover:text-[var(--color-primary)]')}>
                        {p === 'all' ? (isAr ? 'الكل' : 'All') : (isAr ? PRIORITY_CONFIG[p].ar : PRIORITY_CONFIG[p].en)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-[var(--foreground)]/40 uppercase tracking-wider">{isAr ? 'الحالة' : 'Status'}</span>
                  <div className="flex gap-1">
                    {(['all', 'todo', 'in-progress', 'completed'] as const).map(s => (
                      <button key={s} onClick={() => setFilterStatus(s)}
                        className={cn('rounded-md border border-transparent px-2.5 py-1 text-[11px] font-medium transition-all duration-150',
                          filterStatus === s
                            ? 'border-[var(--color-primary)]/30 bg-[rgba(var(--color-primary-rgb),0.12)] text-[var(--color-primary)]'
                            : 'border-[var(--foreground)]/8 bg-[var(--foreground)]/[0.04] text-[var(--foreground)]/55 hover:border-[rgba(var(--color-primary-rgb),0.25)] hover:bg-[rgba(var(--color-primary-rgb),0.06)] hover:text-[var(--color-primary)]')}>
                        {s === 'all' ? (isAr ? 'الكل' : 'All') : (isAr ? STATUS_CONFIG[s].ar : STATUS_CONFIG[s].en)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-[var(--foreground)]/40 uppercase tracking-wider">{isAr ? 'ترتيب' : 'Sort'}</span>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as typeof sortBy)}
                    className="tasks-glass-input rounded-lg px-2.5 py-1 text-[11px] font-medium text-[var(--foreground)]/70"
                  >
                    <option value="dueDate">{isAr ? 'تاريخ الاستحقاق' : 'Due Date'}</option>
                    <option value="priority">{isAr ? 'الأولوية' : 'Priority'}</option>
                    <option value="created">{isAr ? 'تاريخ الإنشاء' : 'Created'}</option>
                    <option value="name">{isAr ? 'الاسم' : 'Name'}</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
                    className="rounded-md p-1.5 text-[var(--foreground)]/40 transition-colors hover:bg-[rgba(var(--color-primary-rgb),0.1)] hover:text-[var(--color-primary)]"
                  >
                    {sortDir === 'asc' ? <SortAsc className="h-3.5 w-3.5" /> : <SortDesc className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="tasks-glass-board">
      {viewMode === 'board' && (
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
          {allTasks.length === 0 ? (
            <div className="p-4 sm:p-6">
              <EmptyState isAr={isAr} onAdd={openCreate} />
            </div>
          ) : (
          <div className="grid grid-cols-1 divide-y divide-[rgba(var(--color-primary-rgb),0.16)] lg:grid-cols-3 lg:divide-x lg:divide-y-0">
            <div className="p-2.5 sm:p-3 lg:pe-3">
            <BoardColumn
              title={isAr ? 'اليوم والمتأخر' : 'Today & overdue'}
              titleAr="اليوم والمتأخر"
              icon={<AlertCircle className="w-4 h-4" />}
              accent="#ef4444"
              count={todayTasks.length}
              tasks={todayTasks}
              isAr={isAr}
              today={today}
              store={store}
              onEdit={openEdit}
              onToggle={id => store.toggleTaskStatus(id)}
              onToggleSubtask={(taskId, subtaskId) => store.toggleSubtask(taskId, subtaskId)}
              expandedId={expandedTaskId}
              onExpand={id => setExpandedTaskId(expandedTaskId === id ? null : id)}
              emptyMessage={isAr ? 'لا توجد مهام لهذا اليوم.' : 'Nothing due today.'}
              emptyIcon={<CheckCircle2 className="h-6 w-6 text-[var(--foreground)]/20" strokeWidth={1.25} />}
            />
            </div>
            <div className="p-2.5 sm:p-3 lg:px-3">
            <BoardColumn
              title={isAr ? 'لاحقاً' : 'Later'}
              titleAr="لاحقاً"
              icon={<CalendarClock className="w-4 h-4" />}
              accent="var(--color-primary)"
              count={upcomingTasks.length}
              tasks={upcomingTasks}
              isAr={isAr}
              today={today}
              store={store}
              onEdit={openEdit}
              onToggle={id => store.toggleTaskStatus(id)}
              onToggleSubtask={(taskId, subtaskId) => store.toggleSubtask(taskId, subtaskId)}
              expandedId={expandedTaskId}
              onExpand={id => setExpandedTaskId(expandedTaskId === id ? null : id)}
              emptyMessage={isAr ? 'لا مهام بدون تاريخ أو لاحقة.' : 'No undated or upcoming tasks.'}
              emptyIcon={<Sparkles className="h-6 w-6 text-[var(--foreground)]/20" strokeWidth={1.25} />}
            />
            </div>
            <div className="p-2.5 sm:p-3 lg:ps-3">
            <BoardColumn
              title={isAr ? 'منجزة' : 'Done'}
              titleAr="منجزة"
              icon={<CheckCircle2 className="w-4 h-4" />}
              accent="#10b981"
              count={completedTasks.length}
              tasks={completedTasks}
              isAr={isAr}
              today={today}
              store={store}
              onEdit={openEdit}
              onToggle={id => store.toggleTaskStatus(id)}
              onToggleSubtask={(taskId, subtaskId) => store.toggleSubtask(taskId, subtaskId)}
              expandedId={expandedTaskId}
              onExpand={id => setExpandedTaskId(expandedTaskId === id ? null : id)}
              emptyMessage={isAr ? 'لا مهام مكتملة بعد.' : 'No completed tasks yet.'}
              emptyIcon={<CheckCircle2 className="h-6 w-6 text-[var(--foreground)]/20" />}
              isCompleted
            />
            </div>
          </div>
          )}
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* LIST VIEW */}
      {/* ═══════════════════════════════════════════════════════ */}
      {viewMode === 'list' && (
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2} className="p-2.5 sm:p-3">
          {filteredTasks.length === 0 ? (
            <EmptyState isAr={isAr} onAdd={openCreate} />
          ) : (
            <div className="space-y-1.5">
              {filteredTasks.map((task, i) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isAr={isAr}
                  today={today}
                  store={store}
                  onEdit={() => openEdit(task)}
                  onToggle={() => store.toggleTaskStatus(task.id)}
                  onToggleSubtask={(subtaskId) => store.toggleSubtask(task.id, subtaskId)}
                  expanded={expandedTaskId === task.id}
                  onExpand={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                  index={i}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}
        </div>

      {allTasks.length > 0 && (
        <div className="tasks-glass-overview px-3 py-3 sm:px-4 sm:py-4">
            <div className="mb-3 flex items-center gap-2 border-b border-[rgba(var(--color-primary-rgb),0.2)] pb-2">
              <TrendingUp className="h-3.5 w-3.5 text-[var(--color-primary)]" strokeWidth={2} />
              <h3 className="text-xs font-semibold text-[var(--foreground)]/85 sm:text-sm">{isAr ? 'نظرة عامة' : 'Overview'}</h3>
            </div>
            <div className="grid gap-5 sm:grid-cols-3 sm:gap-4">
              {/* Completion rate */}
              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14">
                  <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="24" fill="none" stroke="var(--foreground)" strokeWidth="3" opacity="0.06" />
                    <circle cx="28" cy="28" r="24" fill="none" stroke="var(--color-primary)" strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 24}`}
                      strokeDashoffset={`${2 * Math.PI * 24 * (1 - stats.completionRate / 100)}`}
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">{stats.completionRate}%</span>
                </div>
                <div>
                  <p className="text-sm font-semibold">{isAr ? 'معدل الإنجاز' : 'Completion Rate'}</p>
                  <p className="text-[11px] text-[var(--foreground)]/40">{stats.completed} / {stats.total} {isAr ? 'مهمة' : 'tasks'}</p>
                </div>
              </div>

              {/* Priority breakdown */}
              <div>
                <p className="text-xs font-semibold mb-2">{isAr ? 'حسب الأولوية' : 'By Priority'}</p>
                <div className="space-y-1.5">
                  {(['urgent', 'high', 'medium', 'low'] as const).map(p => {
                    const count = allTasks.filter(t => t.priority === p && t.status !== 'completed' && t.status !== 'cancelled').length;
                    return (
                      <div key={p} className="flex items-center gap-2">
                        <span className={cn('w-2 h-2 rounded-full', p === 'urgent' ? 'bg-red-500' : p === 'high' ? 'bg-orange-500' : p === 'medium' ? 'bg-amber-500' : 'bg-blue-400')} />
                        <span className="text-[11px] text-[var(--foreground)]/50 flex-1">{isAr ? PRIORITY_CONFIG[p].ar : PRIORITY_CONFIG[p].en}</span>
                        <span className="text-[11px] font-semibold">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Upcoming deadlines */}
              <div>
                <p className="text-xs font-semibold mb-2">{isAr ? 'مواعيد قريبة' : 'Upcoming Deadlines'}</p>
                <div className="space-y-1.5">
                  {allTasks
                    .filter(t => t.dueDate && t.dueDate >= today && t.status !== 'completed' && t.status !== 'cancelled')
                    .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
                    .slice(0, 4)
                    .map(t => (
                      <div key={t.id} className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-[var(--foreground)]/30" />
                        <span className="text-[11px] text-[var(--foreground)]/60 truncate flex-1">
                          {isAr ? t.titleAr || t.titleEn : t.titleEn || t.titleAr}
                        </span>
                        <span className={cn('text-[10px] font-medium',
                          t.dueDate === today ? 'text-amber-500' : 'text-[var(--foreground)]/40')}>
                          {t.dueDate === today ? (isAr ? 'اليوم' : 'Today') : t.dueDate}
                        </span>
                      </div>
                    ))}
                  {allTasks.filter(t => t.dueDate && t.dueDate >= today && t.status !== 'completed').length === 0 && (
                    <p className="text-[11px] text-[var(--foreground)]/30">{isAr ? 'لا توجد مواعيد' : 'No deadlines'}</p>
                  )}
                </div>
              </div>
            </div>
        </div>
      )}

      </motion.div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* CREATE / EDIT MODAL */}
      {/* ═══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setShowForm(false); resetForm(); }}
              className="fixed inset-0 z-[var(--z-overlay)] bg-black/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="tasks-glass-modal fixed inset-x-4 top-[5%] z-[var(--z-modal)] max-h-[90vh] overflow-y-auto rounded-2xl sm:inset-x-0 sm:mx-auto sm:w-[560px]"
            >
              <div className="h-0.5 w-full shrink-0 bg-[var(--color-primary)]" aria-hidden />
              {/* Modal header */}
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[rgba(var(--color-primary-rgb),0.2)] bg-[rgba(var(--color-background-rgb),0.55)] px-5 py-4 backdrop-blur-xl">
                <h2 className="flex items-center gap-2 text-base font-semibold">
                  <ClipboardList className="h-5 w-5 text-[var(--color-primary)]" strokeWidth={1.75} />
                  {editingTask ? (isAr ? 'تعديل المهمة' : 'Edit task') : (isAr ? 'مهمة جديدة' : 'New task')}
                </h2>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm(); }}
                  className="rounded-lg p-2 text-[var(--foreground)]/45 hover:bg-[var(--foreground)]/[0.06] hover:text-[var(--foreground)]/70"
                  aria-label={isAr ? 'إغلاق' : 'Close'}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5 space-y-5">
                {/* Title */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-[var(--foreground)]/40 uppercase tracking-wider mb-1.5 block">
                      {isAr ? 'العنوان (عربي)' : 'Title (Arabic)'}
                    </label>
                    <input dir="rtl" value={form.titleAr}
                      onChange={e => setForm(f => ({ ...f, titleAr: e.target.value }))}
                      className="w-full rounded-xl app-input px-3.5 py-2.5 text-sm"
                      placeholder={isAr ? 'عنوان المهمة...' : 'Task title...'}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[var(--foreground)]/40 uppercase tracking-wider mb-1.5 block">
                      {isAr ? 'العنوان (إنجليزي)' : 'Title (English)'}
                    </label>
                    <input dir="ltr" value={form.titleEn}
                      onChange={e => setForm(f => ({ ...f, titleEn: e.target.value }))}
                      className="w-full rounded-xl app-input px-3.5 py-2.5 text-sm"
                      placeholder="Task title..."
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-[11px] font-semibold text-[var(--foreground)]/40 uppercase tracking-wider mb-1.5 block">
                    {isAr ? 'الوصف' : 'Description'}
                  </label>
                  <textarea
                    value={isAr ? form.descriptionAr : form.descriptionEn}
                    onChange={e => setForm(f => isAr ? { ...f, descriptionAr: e.target.value } : { ...f, descriptionEn: e.target.value })}
                    dir={isAr ? 'rtl' : 'ltr'}
                    rows={2}
                    className="w-full rounded-xl app-input px-3.5 py-2.5 text-sm resize-none"
                    placeholder={isAr ? 'وصف اختياري...' : 'Optional description...'}
                  />
                </div>

                {/* Priority & Status */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-[var(--foreground)]/40 uppercase tracking-wider mb-2 block">
                      {isAr ? 'الأولوية' : 'Priority'}
                    </label>
                    <div className="flex gap-1.5">
                      {(['low', 'medium', 'high', 'urgent'] as const).map(p => (
                        <button key={p}
                          onClick={() => setForm(f => ({ ...f, priority: p }))}
                          className={cn(
                            'flex-1 py-2 rounded-lg text-[11px] font-semibold transition-all',
                            form.priority === p
                              ? cn(PRIORITY_CONFIG[p].bg, PRIORITY_CONFIG[p].color, 'ring-1', p === 'urgent' ? 'ring-red-500/30' : p === 'high' ? 'ring-orange-500/30' : p === 'medium' ? 'ring-amber-500/30' : 'ring-blue-400/30')
                              : 'bg-[var(--foreground)]/[0.05] text-[var(--foreground)]/50'
                          )}>
                          {isAr ? PRIORITY_CONFIG[p].ar : PRIORITY_CONFIG[p].en}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[var(--foreground)]/40 uppercase tracking-wider mb-2 block">
                      {isAr ? 'الحالة' : 'Status'}
                    </label>
                    <div className="flex gap-1.5">
                      {(['todo', 'in-progress', 'completed'] as const).map(s => (
                        <button key={s}
                          onClick={() => setForm(f => ({ ...f, status: s }))}
                          className={cn(
                            'flex-1 py-2 rounded-lg text-[11px] font-semibold transition-all',
                            form.status === s
                              ? cn(STATUS_CONFIG[s].bg, STATUS_CONFIG[s].color, 'ring-1 ring-current/20')
                              : 'bg-[var(--foreground)]/[0.05] text-[var(--foreground)]/50'
                          )}>
                          {isAr ? STATUS_CONFIG[s].ar : STATUS_CONFIG[s].en}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Due Date, Time, Estimate */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-[var(--foreground)]/40 uppercase tracking-wider mb-1.5 block">
                      {isAr ? 'تاريخ الاستحقاق' : 'Due Date'}
                    </label>
                    <input type="date" value={form.dueDate}
                      onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                      className="w-full rounded-xl app-input px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[var(--foreground)]/40 uppercase tracking-wider mb-1.5 block">
                      {isAr ? 'الوقت' : 'Time'}
                    </label>
                    <input type="time" value={form.dueTime}
                      onChange={e => setForm(f => ({ ...f, dueTime: e.target.value }))}
                      className="w-full rounded-xl app-input px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[var(--foreground)]/40 uppercase tracking-wider mb-1.5 block">
                      {isAr ? 'الوقت المقدر' : 'Estimate'}
                    </label>
                    <input type="number" min={1} value={form.estimatedMinutes}
                      onChange={e => setForm(f => ({ ...f, estimatedMinutes: e.target.value }))}
                      placeholder="min"
                      className="w-full rounded-xl app-input px-3 py-2.5 text-sm"
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="text-[11px] font-semibold text-[var(--foreground)]/40 uppercase tracking-wider mb-2 block">
                    {isAr ? 'التصنيف' : 'Category'}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORY_PRESETS.map(c => (
                      <button key={c.en}
                        onClick={() => setForm(f => ({ ...f, category: f.category === c.en ? '' : c.en }))}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all',
                          form.category === c.en
                            ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/20'
                            : 'bg-[var(--foreground)]/[0.05] text-[var(--foreground)]/50 hover:bg-[var(--foreground)]/[0.08]'
                        )}>
                        {isAr ? c.ar : c.en}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subtasks */}
                <div>
                  <label className="text-[11px] font-semibold text-[var(--foreground)]/40 uppercase tracking-wider mb-2 block">
                    {isAr ? 'المهام الفرعية' : 'Subtasks'}
                  </label>
                  {form.subtasks.length > 0 && (
                    <div className="space-y-1.5 mb-2">
                      {form.subtasks.map(st => (
                        <div key={st.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--foreground)]/[0.03]">
                          <Circle className="w-3.5 h-3.5 text-[var(--foreground)]/30" />
                          <span className="text-xs flex-1">{st.title}</span>
                          <button onClick={() => removeSubtask(st.id)} className="text-[var(--foreground)]/20 hover:text-red-400">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      value={form.newSubtask}
                      onChange={e => setForm(f => ({ ...f, newSubtask: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                      placeholder={isAr ? 'إضافة مهمة فرعية...' : 'Add subtask...'}
                      className="flex-1 rounded-xl app-input px-3 py-2 text-sm"
                    />
                    <button onClick={addSubtask}
                      className="px-3 py-2 rounded-xl bg-[var(--foreground)]/[0.05] hover:bg-[var(--foreground)]/[0.1] text-[var(--foreground)]/50">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-[11px] font-semibold text-[var(--foreground)]/40 uppercase tracking-wider mb-1.5 block">
                    {isAr ? 'ملاحظات' : 'Notes'}
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    dir={isAr ? 'rtl' : 'ltr'}
                    rows={2}
                    className="w-full rounded-xl app-input px-3.5 py-2.5 text-sm resize-none"
                    placeholder={isAr ? 'ملاحظات إضافية...' : 'Additional notes...'}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-[var(--color-background)] flex items-center justify-between gap-3 p-5 pt-4 border-t border-[var(--foreground)]/[0.18]">
                {editingTask && (
                  <button
                    onClick={() => { store.deleteTask(editingTask.id); setShowForm(false); resetForm(); }}
                    className="text-xs text-red-400 flex items-center gap-1 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> {isAr ? 'حذف' : 'Delete'}
                  </button>
                )}
                <div className="flex gap-3 ms-auto">
                  <button onClick={() => { setShowForm(false); resetForm(); }}
                    className="px-4 py-2.5 rounded-xl text-sm text-[var(--foreground)]/50 hover:bg-[var(--foreground)]/[0.05]">
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button onClick={handleSave}
                    disabled={!form.titleEn && !form.titleAr}
                    className="px-6 py-2.5 rounded-xl app-btn-primary text-sm font-semibold disabled:opacity-40">
                    {editingTask ? (isAr ? 'تحديث' : 'Update') : (isAr ? 'إنشاء' : 'Create')}
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

// ═══════════════════════════════════════════════════════════
// BOARD COLUMN
// ═══════════════════════════════════════════════════════════

function BoardColumn({
  title, titleAr, icon, accent, count, tasks, isAr, today, store, onEdit, onToggle, onToggleSubtask,
  expandedId, onExpand, emptyMessage, emptyIcon, isCompleted,
}: {
  title: string; titleAr: string; icon: React.ReactNode; accent: string; count: number;
  tasks: Task[]; isAr: boolean; today: string; store: any;
  onEdit: (task: Task) => void; onToggle: (id: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  expandedId: string | null; onExpand: (id: string) => void;
  emptyMessage: string; emptyIcon: React.ReactNode; isCompleted?: boolean;
}) {
  return (
    <div
      className="tasks-glass-column flex min-h-[200px] flex-col overflow-hidden"
      role="region"
      aria-label={isAr ? titleAr : title}
    >
      <div className="h-0.5 w-full shrink-0" style={{ backgroundColor: accent }} aria-hidden />
      <div className="tasks-glass-column-head flex items-center gap-2 px-2.5 py-2 sm:px-3">
        <span
          className="tasks-glass-icon-btn flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
          style={{ color: accent }}
        >
          {icon}
        </span>
        <h2 className="min-w-0 flex-1 text-xs font-semibold text-[var(--foreground)]/90 sm:text-sm">{title}</h2>
        <span
          className="tabular-nums rounded-lg border border-[rgba(var(--color-primary-rgb),0.22)] bg-[rgba(var(--color-primary-rgb),0.1)] px-2 py-0.5 text-[11px] font-bold backdrop-blur-sm"
          style={{ color: accent }}
        >
          {count}
        </span>
      </div>

      <div className="flex min-h-[100px] flex-1 flex-col gap-1.5 p-2 sm:p-2.5">
        {tasks.length === 0 ? (
          <div className="tasks-glass-empty flex flex-1 flex-col items-center justify-center py-8 transition-all hover:border-[rgba(var(--color-primary-rgb),0.35)] hover:bg-[rgba(var(--color-primary-rgb),0.08)]">
            <span className="opacity-50">{emptyIcon}</span>
            <p className="mt-2 max-w-[200px] px-2 text-center text-[11px] leading-relaxed text-[var(--foreground)]/45">{emptyMessage}</p>
          </div>
        ) : (
          tasks.map((task, i) => (
            <TaskCard
              key={task.id}
              task={task}
              isAr={isAr}
              today={today}
              store={store}
              onEdit={() => onEdit(task)}
              onToggle={() => onToggle(task.id)}
              onToggleSubtask={(subtaskId) => onToggleSubtask(task.id, subtaskId)}
              expanded={expandedId === task.id}
              onExpand={() => onExpand(task.id)}
              index={i}
              compact={isCompleted}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TASK CARD
// ═══════════════════════════════════════════════════════════

function TaskCard({
  task, isAr, today, store, onEdit, onToggle, onToggleSubtask, expanded, onExpand, index, compact,
}: {
  task: Task; isAr: boolean; today: string; store: any;
  onEdit: () => void; onToggle: () => void;
  onToggleSubtask: (subtaskId: string) => void;
  expanded: boolean; onExpand: () => void; index: number; compact?: boolean;
}) {
  const name = isAr ? (task.titleAr || task.titleEn) : (task.titleEn || task.titleAr);
  const desc = isAr ? (task.descriptionAr || task.descriptionEn) : (task.descriptionEn || task.descriptionAr);
  const isOver = task.dueDate && task.dueDate < today && task.status !== 'completed' && task.status !== 'cancelled';
  const isDone = task.status === 'completed';
  const isToday = task.dueDate === today;
  const priority = PRIORITY_CONFIG[task.priority];
  const subtasksDone = task.subtasks?.filter(s => s.completed).length ?? 0;
  const subtasksTotal = task.subtasks?.length ?? 0;
  const subtaskProgress = subtasksTotal > 0 ? (subtasksDone / subtasksTotal) * 100 : 0;

  const stripeColor = isDone
    ? 'rgba(var(--color-primary-rgb), 0.35)'
    : isOver
      ? '#f87171'
      : 'var(--color-primary)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02, duration: 0.2 }}
      className={cn(
        'tasks-glass-task group relative overflow-hidden transition-all duration-200',
        isDone && 'opacity-[0.88]',
        !isDone && isOver && '!border-red-400/45 !bg-red-500/[0.1] hover:!shadow-red-500/10',
        !isDone &&
          !isOver &&
          'hover:-translate-y-px motion-reduce:hover:translate-y-0',
      )}
      style={{ borderInlineStartWidth: 3, borderInlineStartColor: stripeColor }}
    >
      <div className="p-2.5 sm:p-3">
        <div className="flex items-start gap-3">
          {/* Completion toggle */}
          <button
            onClick={onToggle}
            className={cn(
              'mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-150',
              isDone
                ? 'border-emerald-500 bg-emerald-500 shadow-sm'
                : isOver
                  ? 'border-red-400 hover:scale-105 hover:border-red-500 hover:bg-red-500/15 hover:shadow-sm'
                  : 'border-[var(--foreground)]/25 hover:scale-105 hover:border-[var(--color-primary)] hover:bg-[rgba(var(--color-primary-rgb),0.12)] hover:shadow-[0_0_0_3px_rgba(var(--color-primary-rgb),0.12)]',
            )}
          >
            {isDone && <Check className="w-3 h-3 text-white" />}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'text-[13px] font-semibold leading-snug sm:text-sm',
                  isDone && 'line-through text-[var(--foreground)]/40',
                )}>
                  {name}
                </p>
                {desc && !compact && (
                  <p className="text-[12px] text-[var(--foreground)]/40 mt-0.5 line-clamp-1">{desc}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-0.5 opacity-0 transition-all duration-150 group-hover:opacity-100 max-sm:opacity-100">
                <button
                  type="button"
                  onClick={onEdit}
                  className="rounded-md p-1.5 text-[var(--foreground)]/40 transition-colors hover:bg-[rgba(var(--color-primary-rgb),0.12)] hover:text-[var(--color-primary)]"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onExpand}
                  className="rounded-md p-1.5 text-[var(--foreground)]/40 transition-colors hover:bg-[rgba(var(--color-primary-rgb),0.12)] hover:text-[var(--color-primary)]"
                >
                  {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {/* Priority badge */}
              <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium', priority.bg, priority.color)}>
                {isAr ? priority.ar : priority.en}
              </span>

              {/* Status badge */}
              {task.status === 'in-progress' && (
                <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium', STATUS_CONFIG['in-progress'].bg, STATUS_CONFIG['in-progress'].color)}>
                  {isAr ? STATUS_CONFIG['in-progress'].ar : STATUS_CONFIG['in-progress'].en}
                </span>
              )}

              {/* Category */}
              {task.category && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--foreground)]/[0.05] text-[var(--foreground)]/40">
                  {isAr ? CATEGORY_PRESETS.find(c => c.en === task.category)?.ar ?? task.category : task.category}
                </span>
              )}

              {/* Due date */}
              {task.dueDate && (
                <span className={cn(
                  'text-[10px] font-medium flex items-center gap-0.5',
                  isOver ? 'text-red-500' : isToday ? 'text-amber-500' : 'text-[var(--foreground)]/35',
                )}>
                  <Calendar className="w-2.5 h-2.5" />
                  {isOver ? (isAr ? 'متأخر' : 'Overdue') : isToday ? (isAr ? 'اليوم' : 'Today') : task.dueDate}
                </span>
              )}

              {/* Estimated time */}
              {task.estimatedMinutes && (
                <span className="text-[10px] font-medium text-[var(--foreground)]/30 flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" />{task.estimatedMinutes}m
                </span>
              )}

              {/* Subtask progress */}
              {subtasksTotal > 0 && (
                <span className="text-[10px] font-medium text-[var(--foreground)]/35 flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" /> {subtasksDone}/{subtasksTotal}
                </span>
              )}
            </div>

            {/* Subtask progress bar */}
            {subtasksTotal > 0 && !compact && (
              <div className="mt-2 h-1 rounded-full bg-[var(--foreground)]/[0.05] overflow-hidden">
                <div className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-500"
                  style={{ width: `${subtaskProgress}%` }} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-0 border-t border-[rgba(var(--color-primary-rgb),0.14)] bg-[rgba(var(--color-primary-rgb),0.04)] px-3.5 pb-3.5 pt-0 backdrop-blur-sm">
              <div className="pt-3 space-y-2.5">
                {/* Description */}
                {desc && (
                  <p className="text-xs text-[var(--foreground)]/50 leading-relaxed">{desc}</p>
                )}

                {/* Subtasks checklist */}
                {task.subtasks && task.subtasks.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-[var(--foreground)]/40 uppercase tracking-wider mb-1">
                      {isAr ? 'المهام الفرعية' : 'Subtasks'}
                    </p>
                    {task.subtasks.map(st => (
                      <button
                        key={st.id}
                        onClick={() => onToggleSubtask(st.id)}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start transition-colors hover:bg-[rgba(var(--color-primary-rgb),0.08)]"
                      >
                        <div className={cn(
                          'w-4 h-4 rounded border-[1.5px] flex items-center justify-center flex-shrink-0 transition-all',
                          st.completed
                            ? 'border-emerald-500 bg-emerald-500'
                            : 'border-[var(--foreground)]/20'
                        )}>
                          {st.completed && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <span className={cn('text-xs', st.completed && 'line-through text-[var(--foreground)]/30')}>
                          {st.title}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Notes */}
                {task.notes && (
                  <div className="px-3 py-2 rounded-lg bg-[var(--foreground)]/[0.03] text-xs text-[var(--foreground)]/40">
                    {task.notes}
                  </div>
                )}

                {/* Footer meta */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-[var(--foreground)]/25">
                    {isAr ? 'أنشئت' : 'Created'} {new Date(task.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex gap-1">
                    <button onClick={onEdit} className="text-[10px] text-[var(--color-primary)] font-medium flex items-center gap-0.5 hover:underline">
                      <Edit3 className="w-3 h-3" /> {isAr ? 'تعديل' : 'Edit'}
                    </button>
                    <span className="text-[var(--foreground)]/10 mx-1">|</span>
                    <button
                      onClick={() => store.deleteTask(task.id)}
                      className="text-[10px] text-red-400 font-medium flex items-center gap-0.5 hover:underline"
                    >
                      <Trash2 className="w-3 h-3" /> {isAr ? 'حذف' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
// EMPTY STATE
// ═══════════════════════════════════════════════════════════

function EmptyState({ isAr, onAdd }: { isAr: boolean; onAdd: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="tasks-glass-empty mx-auto flex max-w-md flex-col items-center justify-center px-8 py-14 sm:py-20"
    >
      <div className="tasks-glass-icon-btn mb-5 flex h-14 w-14 items-center justify-center rounded-2xl">
        <ClipboardList className="h-7 w-7 text-[var(--color-primary)]" strokeWidth={1.5} />
      </div>
      <h3 className="mb-1 text-lg font-semibold text-[var(--foreground)]">{isAr ? 'لا مهام بعد' : 'No tasks yet'}</h3>
      <p className="mb-6 max-w-sm text-center text-sm text-[var(--foreground)]/45">
        {isAr ? 'أضف مهمة لتتبع ما يجب إنجازه.' : 'Add a task to track what needs doing.'}
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-2 rounded-xl app-btn-primary px-5 py-2.5 text-sm font-medium"
      >
        <Plus className="h-4 w-4" strokeWidth={2} />
        {isAr ? 'مهمة جديدة' : 'New task'}
      </button>
    </motion.div>
  );
}
