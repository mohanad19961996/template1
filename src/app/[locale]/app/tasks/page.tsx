'use client';

import React, { useState, useMemo, useCallback } from 'react';
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
  Link2, Timer, ChevronUp, ChevronLeft, ChevronRight, Columns3,
} from 'lucide-react';
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

// ── Extracted components ────────────────────────────────
import {
  fadeUp, PRIORITY_CONFIG, STATUS_CONFIG, CATEGORY_PRESETS, COLOR_OPTIONS,
  addDays, daysBetween, type StatFilter, type BoardColumnId,
} from '@/components/tasks/task-constants';
import BoardColumn from '@/components/tasks/task-board-column';
import TaskDetailModal from '@/components/tasks/task-detail-modal';
import ListRow from '@/components/tasks/task-list-row';
import { EmptyGlobal, EmptyFiltered } from '@/components/tasks/task-empty-states';
import TaskFormModal from '@/components/tasks/task-form';

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
  const [viewMode, setViewMode] = useState<'board' | 'list' | 'calendar'>('board');
  const [calDate, setCalDate] = useState(today);
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() }; });
  const [showFilters, setShowFilters] = useState(false);
  const [statFilter, setStatFilter] = useState<StatFilter>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [newCatEditing, setNewCatEditing] = useState(false);
  const [newCatValue, setNewCatValue] = useState('');
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
    if (!form.dueDate) { toast.notifyWarning(isAr ? 'تاريخ الاستحقاق مطلوب' : 'Due date is required'); return; }
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
          className="relative overflow-hidden rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.7))',
            boxShadow: '0 6px 24px rgba(var(--color-primary-rgb) / 0.18)',
          }}
        >
          {/* Decorative glow */}
          <div className="pointer-events-none absolute -end-16 -top-16 h-48 w-48 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3), transparent 70%)' }} />

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-7 sm:py-5">
            {/* Left: Icon + Title */}
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12"
                style={{ background: 'rgba(255,255,255,0.18)' }}>
                <ClipboardList className="h-6 w-6 text-white sm:h-7 sm:w-7" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl">
                  {isAr ? 'المهام' : 'Tasks'}
                </h1>
                <p className="text-[11px] font-medium text-white/65 sm:text-xs">
                  {isAr ? 'نظّم مهامك وتابع تقدمك' : 'Organize your tasks and track progress'}
                </p>
              </div>
            </div>

            {/* Right: Stat chips */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {([
                { key: 'today' as StatFilter, label: isAr ? 'اليوم' : 'Today', value: stats.todayDue },
                { key: 'in-progress' as StatFilter, label: isAr ? 'جارية' : 'Active', value: stats.inProgress },
                { key: 'overdue' as StatFilter, label: isAr ? 'متأخرة' : 'Overdue', value: stats.overdue },
                { key: 'completed-today' as StatFilter, label: isAr ? 'أُنجزت' : 'Done', value: stats.completedToday },
                { key: 'completion-rate' as StatFilter, label: isAr ? 'إنجاز' : 'Rate', value: `${stats.completionRate}%` },
              ]).map(stat => (
                <button
                  key={stat.key}
                  type="button"
                  onClick={() => stat.key !== 'completion-rate' ? handleStatClick(stat.key) : undefined}
                  className={cn(
                    'flex flex-col items-center rounded-lg px-3 py-1.5 text-center transition-all',
                    stat.key !== 'completion-rate' && 'cursor-pointer hover:brightness-110',
                  )}
                  style={{ background: statFilter === stat.key ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.15)' }}
                >
                  <span className="text-base font-black tabular-nums leading-none text-white sm:text-lg">
                    {stat.value}
                  </span>
                  <span className="mt-0.5 text-[8px] font-bold text-white/60 sm:text-[9px]">{stat.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══ TOOLBAR ═══ */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="mt-3 flex items-center gap-1.5 sm:gap-2">
        {/* Search */}
        <div className="group/search relative min-w-0 flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-200 group-focus-within/search:text-[var(--color-primary)]" style={{ color: 'rgba(var(--color-primary-rgb) / 0.35)' }} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'بحث...' : 'Search...'}
            className="w-full rounded-xl border bg-transparent py-2 ps-9 pe-9 text-[13px] font-semibold placeholder:text-[var(--foreground)]/30 focus:outline-none transition-all duration-200"
            style={{ borderColor: 'rgba(var(--color-primary-rgb) / 0.12)' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(var(--color-primary-rgb) / 0.08)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(var(--color-primary-rgb) / 0.12)'; e.currentTarget.style.boxShadow = 'none'; }}
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')}
              className="absolute end-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--foreground)]/[0.08] transition-colors hover:bg-[var(--foreground)]/[0.15]">
              <X className="h-3 w-3 text-[var(--foreground)]/50" />
            </button>
          )}
        </div>

        {/* New Task */}
        <button type="button" onClick={openCreate}
          className="shrink-0 flex items-center gap-1.5 rounded-xl px-3.5 sm:px-5 py-2 text-[13px] font-bold text-white transition-all active:scale-[0.95]"
          style={{ background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.85))', boxShadow: '0 4px 14px rgba(var(--color-primary-rgb) / 0.2)' }}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{isAr ? 'مهمة جديدة' : 'New Task'}</span>
        </button>

        {/* View toggle */}
        <div className="flex shrink-0 rounded-xl border p-0.5" style={{ borderColor: 'rgba(var(--color-primary-rgb) / 0.12)' }}>
          {([
            { key: 'board' as const, icon: Columns3, labelAr: 'لوحة', labelEn: 'Board' },
            { key: 'list' as const, icon: ListChecks, labelAr: 'قائمة', labelEn: 'List' },
            { key: 'calendar' as const, icon: Calendar, labelAr: 'تقويم', labelEn: 'Calendar' },
          ]).map(v => (
            <button key={v.key} type="button" onClick={() => setViewMode(v.key)}
              className={cn('rounded-lg px-2 py-1.5 text-[13px] font-bold transition-all', viewMode === v.key ? 'text-white shadow-sm' : 'text-[var(--foreground)]/40 hover:text-[var(--color-primary)]')}
              style={viewMode === v.key ? { background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.8))' } : undefined}
              aria-label={isAr ? v.labelAr : v.labelEn}>
              <v.icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>

        {/* Filter button */}
        <button type="button" onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'shrink-0 flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[13px] font-bold transition-all cursor-pointer',
            showFilters || activeFilterCount > 0
              ? 'text-white'
              : 'text-[var(--foreground)]/70 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/25',
          )}
          style={(showFilters || activeFilterCount > 0)
            ? { background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.8))', borderColor: 'var(--color-primary)' }
            : { borderColor: 'rgba(var(--color-primary-rgb) / 0.12)' }
          }>
          <Filter className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{isAr ? 'فلتر' : 'Filter'}</span>
          {activeFilterCount > 0 && (
            <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-white/25 text-[10px] font-black text-white">
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

      {/* ═══ CATEGORY FILTER ═══ */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1.5} className="mt-3">
        <div
          className="overflow-hidden rounded-xl border-2 shadow-sm"
          style={{
            borderColor: 'rgba(var(--color-primary-rgb) / 0.14)',
            background: 'linear-gradient(180deg, rgba(var(--color-primary-rgb) / 0.04) 0%, var(--color-background) 40%)',
            boxShadow: '0 1px 0 rgba(255,255,255,0.05) inset, 0 4px 18px -6px rgba(0,0,0,0.07)',
          }}
        >
          <div
            className="flex items-center gap-2 border-b-2 px-2.5 py-2 sm:px-3 sm:py-2"
            style={{ borderColor: 'rgba(var(--color-primary-rgb) / 0.1)', background: 'rgba(var(--color-primary-rgb) / 0.04)' }}
          >
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border sm:h-8 sm:w-8"
              style={{ borderColor: 'rgba(var(--color-primary-rgb) / 0.2)', background: 'rgba(var(--color-primary-rgb) / 0.08)' }}
            >
              <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: 'var(--color-primary)' }} strokeWidth={2.25} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black tracking-tight text-[var(--foreground)] sm:text-[13px]">
                {isAr ? 'تصفية حسب الفئة' : 'Filter by category'}
              </p>
              <p className="text-[9px] font-semibold leading-tight text-[var(--foreground)]/40 sm:text-[10px]">
                {isAr ? 'اختر فئة أو اعرض الكل' : 'Pick one or show all'}
              </p>
            </div>
          </div>

          <div className="p-2 sm:p-2.5">
            <div className="flex flex-wrap gap-1.5">
              {/* All chip */}
              <button
                type="button"
                onClick={() => setFilterCategory('all')}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition-all duration-150',
                  filterCategory === 'all'
                    ? 'border-[var(--color-primary)] text-white shadow-sm'
                    : 'border-[var(--foreground)]/[0.1] bg-[var(--foreground)]/[0.015] text-[var(--foreground)] hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/[0.06]',
                )}
                style={filterCategory === 'all' ? { background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.8))' } : undefined}
              >
                {isAr ? 'الكل' : 'All'}
                <span className={cn('rounded-full px-1.5 py-px text-[10px] font-black tabular-nums', filterCategory === 'all' ? 'bg-white/25 text-white' : 'bg-[var(--foreground)]/[0.07] text-[var(--foreground)]/60')}>
                  {allTasks.length}
                </span>
              </button>

              {/* Category chips */}
              {categories.map(c => {
                const count = allTasks.filter(t => t.category === c).length;
                const isSelected = filterCategory === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFilterCategory(isSelected ? 'all' : c)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition-all duration-150',
                      isSelected
                        ? 'border-[var(--color-primary)] text-white shadow-sm'
                        : 'border-[var(--foreground)]/[0.1] bg-[var(--foreground)]/[0.015] text-[var(--foreground)] hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/[0.06]',
                    )}
                    style={isSelected ? { background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.8))' } : undefined}
                  >
                    <span className="truncate max-w-[120px]">{c}</span>
                    <span className={cn('shrink-0 rounded-full px-1.5 py-px text-[10px] font-black tabular-nums', isSelected ? 'bg-white/25 text-white' : 'bg-[var(--foreground)]/[0.07] text-[var(--foreground)]/60')}>
                      {count}
                    </span>
                  </button>
                );
              })}

              {/* Add new category */}
              {newCatEditing ? (
                <div className="flex items-center gap-1 rounded-lg border border-dashed border-[var(--color-primary)]/40 bg-[var(--color-primary)]/[0.04] px-2 py-0.5">
                  <input
                    autoFocus
                    value={newCatValue}
                    onChange={e => setNewCatValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Escape') { setNewCatEditing(false); setNewCatValue(''); }
                    }}
                    placeholder={isAr ? 'اسم الفئة...' : 'Name...'}
                    className="w-20 bg-transparent text-[11px] font-bold outline-none placeholder:text-[var(--foreground)]/30"
                  />
                  <button
                    type="button"
                    disabled={!newCatValue.trim()}
                    onClick={() => {
                      if (!newCatValue.trim()) return;
                      const catName = newCatValue.trim();
                      resetForm();
                      setForm(f => ({ ...f, category: catName }));
                      setShowForm(true);
                      setNewCatEditing(false);
                      setNewCatValue('');
                    }}
                    className={cn('shrink-0 rounded-md px-2 py-1 text-[10px] font-bold transition-all',
                      newCatValue.trim() ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--foreground)]/[0.08] text-[var(--foreground)]/30')}
                  >
                    {isAr ? 'إنشاء' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setNewCatEditing(false); setNewCatValue(''); }}
                    className="shrink-0 rounded-md p-1 text-[var(--foreground)]/30 hover:text-[var(--foreground)]/60"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setNewCatEditing(true)}
                  className="flex items-center gap-1 rounded-lg border border-dashed px-2.5 py-1.5 text-[11px] font-bold transition-all duration-150 border-[var(--foreground)]/[0.12] text-[var(--foreground)]/40 hover:border-[var(--color-primary)]/30 hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/[0.04]"
                >
                  <Plus className="h-3 w-3" />
                  {isAr ? 'فئة جديدة' : 'New'}
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══ BOARD VIEW ═══ */}
      {viewMode === 'board' && (
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2} className="mt-3">
          {allTasks.length === 0 && !searchQuery && activeFilterCount === 0 && !statFilter ? (
            <EmptyGlobal isAr={isAr} onAdd={openCreate} />
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4" style={{ gap: '0.75rem' }}>
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

      {/* ═══ CALENDAR VIEW ═══ */}
      {viewMode === 'calendar' && (
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2} className="mt-3">
          {(() => {
            const MONTH_NAMES_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
            const MONTH_NAMES_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
            const DAY_NAMES_EN = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
            const DAY_NAMES_AR = ['أحد','إثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت'];
            const dayNames = isAr ? DAY_NAMES_AR : DAY_NAMES_EN;

            const { year, month } = calMonth;
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const pad = (n: number) => String(n).padStart(2, '0');

            const prevMonth = () => setCalMonth(p => p.month === 0 ? { year: p.year - 1, month: 11 } : { ...p, month: p.month - 1 });
            const nextMonth = () => setCalMonth(p => p.month === 11 ? { year: p.year + 1, month: 0 } : { ...p, month: p.month + 1 });
            const goToday = () => { const d = new Date(); setCalMonth({ year: d.getFullYear(), month: d.getMonth() }); setCalDate(today); };

            // Tasks for selected date
            const selectedDateTasks = allTasks.filter(t => {
              if (t.status === 'cancelled') return false;
              if (t.dueDate === calDate) return true;
              if (t.status === 'completed' && t.completedAt?.startsWith(calDate)) return true;
              return false;
            });
            const doneTasks = selectedDateTasks.filter(t => t.status === 'completed');
            const pendingTasks = selectedDateTasks.filter(t => t.status !== 'completed');
            const isToday = calDate === today;
            const isFuture = calDate > today;
            const isPast = calDate < today;

            // Count tasks per day for dots
            const taskCountForDay = (d: number) => {
              const ds = `${year}-${pad(month + 1)}-${pad(d)}`;
              return allTasks.filter(t => t.status !== 'cancelled' && (t.dueDate === ds || (t.status === 'completed' && t.completedAt?.startsWith(ds)))).length;
            };
            const hasOverdueForDay = (d: number) => {
              const ds = `${year}-${pad(month + 1)}-${pad(d)}`;
              return ds < today && allTasks.some(t => t.dueDate === ds && t.status !== 'completed' && t.status !== 'cancelled');
            };

            const selectedDateLabel = (() => {
              const d = new Date(calDate + 'T00:00:00');
              if (calDate === today) return isAr ? 'اليوم' : 'Today';
              return d.toLocaleDateString(isAr ? 'ar-u-nu-latn' : 'en', { weekday: 'long', day: 'numeric', month: 'long' });
            })();

            return (
              <div className="grid gap-3 lg:grid-cols-[1fr_1.2fr]">
                {/* Calendar grid */}
                <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor: 'rgba(var(--color-primary-rgb) / 0.14)' }}>
                  {/* Month header */}
                  <div className="flex items-center justify-between px-4 py-2.5" style={{ background: 'rgba(var(--color-primary-rgb) / 0.05)' }}>
                    <button onClick={prevMonth} className="rounded-lg p-1.5 hover:bg-[var(--foreground)]/[0.06] transition-colors">
                      <ChevronLeft className="h-4 w-4 text-[var(--foreground)]/60" />
                    </button>
                    <div className="text-center">
                      <span className="text-sm font-bold">{isAr ? MONTH_NAMES_AR[month] : MONTH_NAMES_EN[month]} {year}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={goToday} className="rounded-lg px-2 py-1 text-[10px] font-bold text-[var(--color-primary)] hover:bg-[var(--color-primary)]/[0.08] transition-colors">
                        {isAr ? 'اليوم' : 'Today'}
                      </button>
                      <button onClick={nextMonth} className="rounded-lg p-1.5 hover:bg-[var(--foreground)]/[0.06] transition-colors">
                        <ChevronRight className="h-4 w-4 text-[var(--foreground)]/60" />
                      </button>
                    </div>
                  </div>

                  {/* Day names */}
                  <div className="grid grid-cols-7 border-t" style={{ borderColor: 'rgba(var(--color-primary-rgb) / 0.08)' }}>
                    {dayNames.map(d => (
                      <div key={d} className="py-1.5 text-center text-[10px] font-bold text-[var(--foreground)]/40">{d}</div>
                    ))}
                  </div>

                  {/* Day cells */}
                  <div className="grid grid-cols-7">
                    {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} className="h-10" />)}
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
                      const ds = `${year}-${pad(month + 1)}-${pad(d)}`;
                      const isSelected = ds === calDate;
                      const isTodayCell = ds === today;
                      const count = taskCountForDay(d);
                      const hasOverdue = hasOverdueForDay(d);
                      return (
                        <button key={d} onClick={() => setCalDate(ds)}
                          className={cn(
                            'relative h-10 flex flex-col items-center justify-center gap-0.5 transition-all text-[12px] font-semibold',
                            isSelected ? 'text-white' : isTodayCell ? 'text-[var(--color-primary)] font-bold' : 'text-[var(--foreground)]/70 hover:bg-[var(--foreground)]/[0.04]',
                          )}
                          style={isSelected ? { background: 'var(--color-primary)', borderRadius: 8 } : undefined}
                        >
                          {d}
                          {count > 0 && !isSelected && (
                            <div className="flex gap-px">
                              <span className={cn('h-1 w-1 rounded-full', hasOverdue ? 'bg-red-500' : 'bg-[var(--color-primary)]')} />
                              {count > 1 && <span className="h-1 w-1 rounded-full bg-[var(--color-primary)]/50" />}
                            </div>
                          )}
                          {isSelected && count > 0 && (
                            <span className="absolute -top-0.5 -end-0.5 h-3.5 min-w-[14px] rounded-full bg-white text-[8px] font-black text-[var(--color-primary)] flex items-center justify-center">{count}</span>
                          )}
                          {isTodayCell && !isSelected && (
                            <span className="absolute bottom-0.5 h-0.5 w-3 rounded-full bg-[var(--color-primary)]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected day details */}
                <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor: 'rgba(var(--color-primary-rgb) / 0.14)' }}>
                  <div className="flex items-center justify-between px-4 py-2.5" style={{ background: 'rgba(var(--color-primary-rgb) / 0.05)' }}>
                    <div>
                      <p className="text-sm font-bold">{selectedDateLabel}</p>
                      <p className="text-[10px] text-[var(--foreground)]/45">
                        {selectedDateTasks.length === 0
                          ? (isAr ? 'لا توجد مهام' : 'No tasks')
                          : `${doneTasks.length}/${selectedDateTasks.length} ${isAr ? 'مكتملة' : 'done'}`}
                      </p>
                    </div>
                    {calDate !== today && (
                      <button onClick={goToday} className="rounded-lg px-2.5 py-1 text-[11px] font-bold text-[var(--color-primary)] border border-[var(--color-primary)]/20 hover:bg-[var(--color-primary)]/[0.06] transition-colors">
                        {isAr ? 'ارجع لليوم' : 'Go to today'}
                      </button>
                    )}
                  </div>

                  <div className="p-3 space-y-2 max-h-[500px] overflow-y-auto">
                    {selectedDateTasks.length === 0 ? (
                      <div className="py-8 text-center">
                        <Calendar className="h-8 w-8 mx-auto mb-2 text-[var(--foreground)]/20" />
                        <p className="text-sm font-medium text-[var(--foreground)]/40">
                          {isFuture
                            ? (isAr ? 'لا توجد مهام مجدولة لهذا اليوم' : 'No tasks scheduled for this day')
                            : isPast
                              ? (isAr ? 'لا توجد مهام لهذا اليوم' : 'No tasks for this day')
                              : (isAr ? 'لا توجد مهام اليوم' : 'No tasks today')}
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Pending / scheduled tasks */}
                        {pendingTasks.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500 mb-1.5 flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              {isFuture ? (isAr ? 'مجدولة' : 'Scheduled') : isToday ? (isAr ? 'متبقية' : 'Remaining') : (isAr ? 'لم تكتمل' : 'Not completed')}
                              <span className="text-[var(--foreground)]/30">({pendingTasks.length})</span>
                            </p>
                            <div className="space-y-1.5">
                              {pendingTasks.map(task => {
                                const name = isAr ? (task.titleAr || task.titleEn) : (task.titleEn || task.titleAr);
                                const pri = PRIORITY_CONFIG[task.priority];
                                const isOver = task.dueDate != null && task.dueDate < today && task.status !== 'completed';
                                return (
                                  <button key={task.id} onClick={() => setDetailTask(task)}
                                    className="w-full text-start rounded-xl border p-2.5 transition-all hover:shadow-md cursor-pointer"
                                    style={{ borderColor: 'rgba(var(--color-primary-rgb) / 0.1)', borderInlineStartWidth: 3, borderInlineStartColor: isOver ? '#ef4444' : pri.border }}>
                                    <div className="flex items-center gap-2">
                                      <Circle className="h-4 w-4 shrink-0 text-[var(--foreground)]/20" />
                                      <span className="text-[13px] font-bold flex-1 truncate">{name}</span>
                                      <span className={cn('rounded px-1.5 py-0.5 text-[9px] font-bold', pri.bg, pri.color)}>{isAr ? pri.ar : pri.en}</span>
                                    </div>
                                    <div className="mt-1 flex flex-wrap items-center gap-2 ps-6">
                                      {task.category && <span className="text-[10px] text-[var(--foreground)]/40">{task.category}</span>}
                                      {task.estimatedMinutes && <span className="flex items-center gap-0.5 text-[10px] text-[var(--foreground)]/35"><Clock className="h-2.5 w-2.5" />{task.estimatedMinutes}{isAr ? 'د' : 'm'}</span>}
                                      {(task.subtasks?.length ?? 0) > 0 && <span className="text-[10px] text-[var(--foreground)]/35">{task.subtasks!.filter(s => s.completed).length}/{task.subtasks!.length} {isAr ? 'فرعية' : 'subtasks'}</span>}
                                      {isOver && <span className="text-[10px] font-bold text-red-500">{isAr ? 'متأخرة' : 'Overdue'}</span>}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Completed tasks */}
                        {doneTasks.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 mb-1.5 flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              {isAr ? 'مكتملة' : 'Completed'}
                              <span className="text-[var(--foreground)]/30">({doneTasks.length})</span>
                            </p>
                            <div className="space-y-1.5">
                              {doneTasks.map(task => {
                                const name = isAr ? (task.titleAr || task.titleEn) : (task.titleEn || task.titleAr);
                                return (
                                  <button key={task.id} onClick={() => setDetailTask(task)}
                                    className="w-full text-start rounded-xl border border-emerald-500/15 bg-emerald-500/[0.03] p-2.5 transition-all hover:shadow-md cursor-pointer"
                                    style={{ borderInlineStartWidth: 3, borderInlineStartColor: '#10b981' }}>
                                    <div className="flex items-center gap-2">
                                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                                      <span className="text-[13px] font-bold flex-1 truncate line-through text-[var(--foreground)]/40">{name}</span>
                                    </div>
                                    <div className="mt-1 flex flex-wrap items-center gap-2 ps-6">
                                      {task.category && <span className="text-[10px] text-[var(--foreground)]/30">{task.category}</span>}
                                      {task.completedAt && <span className="text-[10px] text-emerald-500/60">{new Date(task.completedAt).toLocaleTimeString(isAr ? 'ar' : 'en', { hour: '2-digit', minute: '2-digit' })}</span>}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </motion.div>
      )}

      {/* ═══ CREATE/EDIT MODAL ═══ */}
      <TaskFormModal
        showForm={showForm}
        editingTask={editingTask}
        form={form}
        setForm={setForm}
        isAr={isAr}
        onClose={() => { setShowForm(false); resetForm(); }}
        onSave={handleSave}
        onDelete={() => {
          if (editingTask) {
            store.deleteTask(editingTask.id);
            setShowForm(false);
            resetForm();
            toast.notifySuccess(isAr ? 'تم الحذف' : 'Deleted');
          }
        }}
        addSubtask={addSubtask}
        addTag={addTag}
        habits={(store.habits ?? []).map(h => ({ id: h.id, nameEn: h.nameEn, nameAr: h.nameAr, archived: h.archived }))}
      />

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
