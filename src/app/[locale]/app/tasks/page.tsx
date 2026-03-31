'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import {
  Task, TaskStatus, TaskPriority, todayString, generateId, ITEM_COLORS,
} from '@/types/app';
import {
  Plus, Search, X, Check, ChevronDown, ChevronRight, Clock, Calendar,
  Flag, Tag, Filter, SortAsc, SortDesc, AlertCircle, CheckCircle2,
  Circle, Timer, Trash2, Edit3, MoreHorizontal, Sparkles, Target,
  ArrowUpRight, TrendingUp, ClipboardList, ListChecks, Zap, Star,
  ChevronUp, GripVertical, CalendarClock, CircleDot, BarChart3,
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
  'todo': { en: 'To Do', ar: 'للتنفيذ', color: 'text-[var(--foreground)]/60', bg: 'bg-[var(--foreground)]/[0.06]' },
  'in-progress': { en: 'In Progress', ar: 'قيد التنفيذ', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  'completed': { en: 'Completed', ar: 'مكتمل', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  'cancelled': { en: 'Cancelled', ar: 'ملغي', color: 'text-[var(--foreground)]/40', bg: 'bg-[var(--foreground)]/[0.04]' },
};

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
  }, [allTasks, searchQuery, filterPriority, filterStatus, sortBy, sortDir, isAr]);

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
    <div className="px-4 sm:px-6 lg:px-8 py-6 pb-20 max-w-[1600px] mx-auto">

      {/* ═══════════════════════════════════════════════════════ */}
      {/* HEADER */}
      {/* ═══════════════════════════════════════════════════════ */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl"
                style={{ background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.6))' }}>
                <ClipboardList className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{isAr ? 'المهام' : 'Tasks'}</h1>
                <p className="text-sm text-[var(--foreground)]/50">
                  {isAr ? 'نظم وأنجز مهامك بكفاءة' : 'Organize, prioritize, and execute'}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl app-btn-primary px-5 py-2.5 text-sm font-semibold shadow-lg"
            style={{ boxShadow: '0 4px 20px rgba(var(--color-primary-rgb) / 0.3)' }}
          >
            <Plus className="h-4 w-4" />
            {isAr ? 'مهمة جديدة' : 'New Task'}
          </button>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {[
            { label: isAr ? 'مهام اليوم' : 'Due Today', value: stats.todayDue, icon: CalendarClock, accent: 'var(--color-primary)' },
            { label: isAr ? 'قيد التنفيذ' : 'In Progress', value: stats.inProgress, icon: Zap, accent: '#3b82f6' },
            { label: isAr ? 'متأخرة' : 'Overdue', value: stats.overdue, icon: AlertCircle, accent: '#ef4444' },
            { label: isAr ? 'أنجزت اليوم' : 'Done Today', value: stats.completedToday, icon: CheckCircle2, accent: '#10b981' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="rounded-xl border border-[var(--foreground)]/[0.06] bg-[var(--color-background)] p-4 flex items-center gap-3"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-lg" style={{ background: `${stat.accent}15` }}>
                <stat.icon className="w-4.5 h-4.5" style={{ color: stat.accent }} />
              </div>
              <div>
                <p className="text-xl font-bold tracking-tight" style={{ color: stat.accent }}>{stat.value}</p>
                <p className="text-[10px] font-medium text-[var(--foreground)]/40 uppercase tracking-wider">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* TOOLBAR */}
      {/* ═══════════════════════════════════════════════════════ */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--foreground)]/30" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث في المهام...' : 'Search tasks...'}
              className="w-full ps-10 pe-4 py-2.5 rounded-xl bg-[var(--foreground)]/[0.04] border border-[var(--foreground)]/[0.08] text-sm focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]/30 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute end-3 top-1/2 -translate-y-1/2">
                <X className="h-3.5 w-3.5 text-[var(--foreground)]/30" />
              </button>
            )}
          </div>

          {/* Filter toggle + View mode */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all',
                showFilters
                  ? 'border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                  : 'border-[var(--foreground)]/[0.08] bg-[var(--foreground)]/[0.04] text-[var(--foreground)]/60'
              )}
            >
              <Filter className="h-4 w-4" />
              {isAr ? 'تصفية' : 'Filter'}
              {(filterPriority !== 'all' || filterStatus !== 'all') && (
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />
              )}
            </button>

            <div className="flex rounded-xl border border-[var(--foreground)]/[0.08] overflow-hidden">
              <button
                onClick={() => setViewMode('board')}
                className={cn('px-3 py-2.5 text-xs font-medium transition-all',
                  viewMode === 'board' ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'text-[var(--foreground)]/40')}
              >
                <BarChart3 className="h-4 w-4 rotate-90" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn('px-3 py-2.5 text-xs font-medium transition-all',
                  viewMode === 'list' ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'text-[var(--foreground)]/40')}
              >
                <ListChecks className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Expanded Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-[var(--foreground)]/[0.06]">
                {/* Priority filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-[var(--foreground)]/40 uppercase tracking-wider">{isAr ? 'الأولوية' : 'Priority'}</span>
                  <div className="flex gap-1">
                    {(['all', 'urgent', 'high', 'medium', 'low'] as const).map(p => (
                      <button key={p} onClick={() => setFilterPriority(p)}
                        className={cn('px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all',
                          filterPriority === p
                            ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/20'
                            : 'bg-[var(--foreground)]/[0.04] text-[var(--foreground)]/50 hover:bg-[var(--foreground)]/[0.08]')}>
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
                        className={cn('px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all',
                          filterStatus === s
                            ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/20'
                            : 'bg-[var(--foreground)]/[0.04] text-[var(--foreground)]/50 hover:bg-[var(--foreground)]/[0.08]')}>
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
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[var(--foreground)]/[0.04] border-0 text-[var(--foreground)]/60"
                  >
                    <option value="dueDate">{isAr ? 'تاريخ الاستحقاق' : 'Due Date'}</option>
                    <option value="priority">{isAr ? 'الأولوية' : 'Priority'}</option>
                    <option value="created">{isAr ? 'تاريخ الإنشاء' : 'Created'}</option>
                    <option value="name">{isAr ? 'الاسم' : 'Name'}</option>
                  </select>
                  <button onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
                    className="p-1 rounded-lg hover:bg-[var(--foreground)]/[0.06] text-[var(--foreground)]/40">
                    {sortDir === 'asc' ? <SortAsc className="h-3.5 w-3.5" /> : <SortDesc className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* BOARD VIEW */}
      {/* ═══════════════════════════════════════════════════════ */}
      {viewMode === 'board' && (
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
          <div className="grid lg:grid-cols-3 gap-5">
            {/* Today / Overdue Column */}
            <BoardColumn
              title={isAr ? 'اليوم والمتأخر' : 'Today & Overdue'}
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
              emptyMessage={isAr ? 'لا توجد مهام لليوم' : 'No tasks due today'}
              emptyIcon={<CheckCircle2 className="w-8 h-8 text-emerald-400" />}
            />

            {/* Upcoming Column */}
            <BoardColumn
              title={isAr ? 'القادمة' : 'Upcoming'}
              titleAr="القادمة"
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
              emptyMessage={isAr ? 'لا توجد مهام قادمة' : 'No upcoming tasks'}
              emptyIcon={<Sparkles className="w-8 h-8 text-[var(--color-primary)]/40" />}
            />

            {/* Completed Column */}
            <BoardColumn
              title={isAr ? 'المكتمل' : 'Completed'}
              titleAr="المكتمل"
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
              emptyMessage={isAr ? 'لا توجد مهام مكتملة' : 'No completed tasks yet'}
              emptyIcon={<Target className="w-8 h-8 text-[var(--foreground)]/20" />}
              isCompleted
            />
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* LIST VIEW */}
      {/* ═══════════════════════════════════════════════════════ */}
      {viewMode === 'list' && (
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
          {filteredTasks.length === 0 ? (
            <EmptyState isAr={isAr} onAdd={openCreate} />
          ) : (
            <div className="space-y-2">
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

      {/* ═══════════════════════════════════════════════════════ */}
      {/* PROGRESS INSIGHTS STRIP */}
      {/* ═══════════════════════════════════════════════════════ */}
      {allTasks.length > 0 && (
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="mt-8">
          <div className="rounded-2xl border border-[var(--foreground)]/[0.06] bg-[var(--color-background)] p-5"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-[var(--color-primary)]" />
              <h3 className="text-sm font-semibold">{isAr ? 'نظرة عامة' : 'Progress Overview'}</h3>
            </div>
            <div className="grid sm:grid-cols-3 gap-6">
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
        </motion.div>
      )}

      {/* Empty state when no tasks at all */}
      {allTasks.length === 0 && viewMode === 'board' && (
        <EmptyState isAr={isAr} onAdd={openCreate} />
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* CREATE / EDIT MODAL */}
      {/* ═══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setShowForm(false); resetForm(); }}
              className="fixed inset-0 z-[var(--z-overlay)] bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="fixed inset-x-4 sm:inset-x-0 sm:mx-auto top-[5%] z-[var(--z-modal)] sm:w-[560px] max-h-[90vh] overflow-y-auto rounded-2xl bg-[var(--color-background)] border border-[var(--foreground)]/[0.12] shadow-2xl"
            >
              {/* Modal header */}
              <div className="sticky top-0 z-10 bg-[var(--color-background)] p-5 pb-4 border-b border-[var(--foreground)]/[0.08] flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-[var(--color-primary)]" />
                  {editingTask ? (isAr ? 'تعديل المهمة' : 'Edit Task') : (isAr ? 'مهمة جديدة' : 'New Task')}
                </h2>
                <button onClick={() => { setShowForm(false); resetForm(); }}
                  className="p-2 rounded-lg hover:bg-[var(--foreground)]/[0.06] text-[var(--foreground)]/40">
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
                              : 'bg-[var(--foreground)]/[0.04] text-[var(--foreground)]/50'
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
                              : 'bg-[var(--foreground)]/[0.04] text-[var(--foreground)]/50'
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
                            : 'bg-[var(--foreground)]/[0.04] text-[var(--foreground)]/50 hover:bg-[var(--foreground)]/[0.08]'
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
                      className="px-3 py-2 rounded-xl bg-[var(--foreground)]/[0.06] hover:bg-[var(--foreground)]/[0.1] text-[var(--foreground)]/50">
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
              <div className="sticky bottom-0 bg-[var(--color-background)] flex items-center justify-between gap-3 p-5 pt-4 border-t border-[var(--foreground)]/[0.08]">
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
                    className="px-4 py-2.5 rounded-xl text-sm text-[var(--foreground)]/50 hover:bg-[var(--foreground)]/[0.06]">
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
  title, icon, accent, count, tasks, isAr, today, store, onEdit, onToggle, onToggleSubtask,
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
    <div className="flex flex-col">
      {/* Column Header */}
      <div className="flex items-center gap-2.5 mb-4 px-1">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg" style={{ background: `${accent}15`, color: accent }}>
          {icon}
        </div>
        <h2 className="text-sm font-bold flex-1">{title}</h2>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${accent}12`, color: accent }}>
          {count}
        </span>
      </div>

      {/* Column Content */}
      <div className="flex-1 space-y-2.5 min-h-[200px]">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 rounded-2xl border-2 border-dashed border-[var(--foreground)]/[0.06]">
            {emptyIcon}
            <p className="text-xs text-[var(--foreground)]/30 mt-3">{emptyMessage}</p>
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className={cn(
        'group rounded-xl border transition-all duration-200',
        isDone
          ? 'border-[var(--foreground)]/[0.04] bg-[var(--foreground)]/[0.015]'
          : isOver
            ? 'border-red-500/20 bg-red-500/[0.02]'
            : 'border-[var(--foreground)]/[0.08] bg-[var(--color-background)] hover:border-[var(--color-primary)]/20 hover:shadow-sm',
      )}
      style={!isDone && !isOver ? { boxShadow: '0 1px 2px rgba(0,0,0,0.03)' } : undefined}
    >
      <div className="p-3.5">
        <div className="flex items-start gap-3">
          {/* Completion toggle */}
          <button
            onClick={onToggle}
            className={cn(
              'mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
              isDone
                ? 'border-emerald-500 bg-emerald-500'
                : isOver
                  ? 'border-red-400 hover:border-red-500 hover:bg-red-500/10'
                  : 'border-[var(--foreground)]/20 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10',
            )}
          >
            {isDone && <Check className="w-3 h-3 text-white" />}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'text-sm font-semibold leading-tight',
                  isDone && 'line-through text-[var(--foreground)]/40',
                )}>
                  {name}
                </p>
                {desc && !compact && (
                  <p className="text-[12px] text-[var(--foreground)]/40 mt-0.5 line-clamp-1">{desc}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-[var(--foreground)]/[0.06] text-[var(--foreground)]/30">
                  <Edit3 className="w-3 h-3" />
                </button>
                <button onClick={onExpand} className="p-1.5 rounded-lg hover:bg-[var(--foreground)]/[0.06] text-[var(--foreground)]/30">
                  {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {/* Priority badge */}
              <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded', priority.bg, priority.color)}>
                {isAr ? priority.ar : priority.en}
              </span>

              {/* Status badge */}
              {task.status === 'in-progress' && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500">
                  {isAr ? 'قيد التنفيذ' : 'In Progress'}
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
              <div className="mt-2 h-1 rounded-full bg-[var(--foreground)]/[0.06] overflow-hidden">
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
            <div className="px-3.5 pb-3.5 pt-0 border-t border-[var(--foreground)]/[0.06] mt-0">
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
                        className="flex items-center gap-2 w-full text-start px-2 py-1.5 rounded-lg hover:bg-[var(--foreground)]/[0.04] transition-colors"
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex flex-col items-center justify-center py-20"
    >
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, rgba(var(--color-primary-rgb) / 0.1), rgba(var(--color-primary-rgb) / 0.05))' }}>
          <ClipboardList className="w-10 h-10 text-[var(--color-primary)]/40" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-[var(--color-primary)]/15 flex items-center justify-center">
          <Plus className="w-4 h-4 text-[var(--color-primary)]" />
        </div>
      </div>
      <h3 className="text-lg font-bold mb-1">{isAr ? 'لا توجد مهام بعد' : 'No tasks yet'}</h3>
      <p className="text-sm text-[var(--foreground)]/40 mb-6 text-center max-w-xs">
        {isAr ? 'ابدأ بإضافة مهمتك الأولى لتنظيم يومك بكفاءة' : 'Start by adding your first task to organize and execute with clarity'}
      </p>
      <button onClick={onAdd}
        className="inline-flex items-center gap-2 rounded-xl app-btn-primary px-6 py-3 text-sm font-semibold shadow-lg"
        style={{ boxShadow: '0 4px 20px rgba(var(--color-primary-rgb) / 0.3)' }}>
        <Plus className="h-4 w-4" />
        {isAr ? 'إنشاء مهمة' : 'Create Task'}
      </button>
    </motion.div>
  );
}
