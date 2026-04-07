'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Task } from '@/types/app';
import { useAppStore } from '@/stores/app-store';
import {
  X, Check, Clock, Calendar, CheckCircle2, Trash2, Edit3,
  CalendarClock, Play, ArrowRight, Tag, Link2, Timer,
} from 'lucide-react';
import { PRIORITY_CONFIG, STATUS_CONFIG } from './task-constants';

// ═══════════════════════════════════════════════════════════
// SECTION LABEL
// ═══════════════════════════════════════════════════════════

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground)]/40">
      {children}
    </h3>
  );
}

// ═══════════════════════════════════════════════════════════
// DETAIL ROW
// ═══════════════════════════════════════════════════════════

export function DetailRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
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
// TASK DETAIL MODAL
// ═══════════════════════════════════════════════════════════

export default function TaskDetailModal({
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
