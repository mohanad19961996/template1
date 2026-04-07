'use client';

import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Task, TaskPriority } from '@/types/app';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Check, Clock, Calendar, CheckCircle2, Trash2, Edit3,
  ListChecks, CalendarClock, Play, ArrowRight, MoreHorizontal, Link2,
} from 'lucide-react';
import { PRIORITY_CONFIG } from './task-constants';

// ═══════════════════════════════════════════════════════════
// TASK CARD (shared by board & list)
// ═══════════════════════════════════════════════════════════

export function TaskCard({
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
        'group relative cursor-pointer overflow-hidden rounded-xl border border-[var(--foreground)]/10 bg-[var(--color-background)] transition-all hover:shadow-md',
        isDone && 'opacity-70',
      )}
      style={{ borderInlineStartWidth: 3, borderInlineStartColor: isOver ? '#ef4444' : isInProgress ? '#3b82f6' : priority.border }}
    >
      <div className="p-2.5">
        {/* Row 1: Toggle + Title + Priority badge + Menu */}
        <div className="flex items-start gap-2">
          <button type="button" onClick={(e) => { e.stopPropagation(); onComplete(); }}
            className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all',
              isDone ? 'border-emerald-500 bg-emerald-500' : isOver ? 'border-red-400 hover:bg-red-500/15' : 'border-[var(--foreground)]/25 hover:border-[var(--color-primary)]')}>
            {isDone && <Check className="h-3 w-3 text-white" />}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {isInProgress && (
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
                </span>
              )}
              <p className={cn('text-[13px] font-bold leading-snug', isDone && 'text-[var(--foreground)]/40 line-through')}>
                {name}
              </p>
              <span className={cn('shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold', priority.bg, priority.color)}>
                {isAr ? priority.ar : priority.en}
              </span>
            </div>
          </div>

          {/* Menu */}
          <div className="relative shrink-0" ref={menuRef}>
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

        {/* Row 2: Inline badges — category, due date, estimate, subtask count, status badges */}
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          {task.category && (
            <span className="rounded-md bg-[var(--foreground)]/[0.06] px-1.5 py-0.5 text-[9px] font-bold text-[var(--foreground)]/55">
              {task.category}
            </span>
          )}
          {task.dueDate && (
            <span className={cn('flex items-center gap-0.5 rounded-md bg-[var(--foreground)]/[0.04] px-1.5 py-0.5 text-[9px] font-bold', getRelativeDate(task.dueDate).cls)}>
              <Calendar className="h-2.5 w-2.5" />
              {getRelativeDate(task.dueDate).text}
            </span>
          )}
          {task.estimatedMinutes && (
            <span className="flex items-center gap-0.5 rounded-md bg-[var(--foreground)]/[0.04] px-1.5 py-0.5 text-[9px] font-bold text-[var(--foreground)]/40">
              <Clock className="h-2.5 w-2.5" />
              {task.estimatedMinutes}{isAr ? 'د' : 'm'}
            </span>
          )}
          {subtasksTotal > 0 && (
            <span className="flex items-center gap-0.5 rounded-md bg-[var(--foreground)]/[0.04] px-1.5 py-0.5 text-[9px] font-bold text-[var(--foreground)]/40">
              <ListChecks className="h-2.5 w-2.5" />
              {subtasksDone}/{subtasksTotal}
            </span>
          )}
          {isOver && (
            <span className="rounded-md bg-red-500/15 px-1.5 py-0.5 text-[9px] font-bold text-red-500">
              {isAr ? 'متأخرة' : 'Overdue'}
            </span>
          )}
          {isInProgress && (
            <span className="rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-bold text-blue-500">
              {isAr ? 'جارية' : 'In Progress'}
            </span>
          )}
        </div>

        {/* Subtask progress bar */}
        {subtasksTotal > 0 && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--foreground)]/[0.08]">
              <div className="h-full rounded-full bg-[var(--color-primary)] transition-all" style={{ width: `${subtaskPct}%` }} />
            </div>
          </div>
        )}

        {/* Tags (max 2 visible + "+N") */}
        {task.tags && task.tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {task.tags.slice(0, 2).map(t => (
              <span key={t} className="rounded-full bg-[var(--color-primary)]/[0.08] px-1.5 py-px text-[9px] font-bold text-[var(--color-primary)]">
                {t}
              </span>
            ))}
            {task.tags.length > 2 && (
              <span className="rounded-full bg-[var(--foreground)]/[0.06] px-1.5 py-px text-[9px] font-bold text-[var(--foreground)]/35">
                +{task.tags.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Linked habit */}
        {habitName && (
          <div className="mt-1 flex items-center gap-1">
            <Link2 className="h-2.5 w-2.5 text-[var(--color-primary)]/50" />
            <span className="text-[9px] font-bold text-[var(--color-primary)]/70">{habitName}</span>
          </div>
        )}

        {/* Row 3: Quick action buttons */}
        {!isDone && (
          <div className="mt-2 flex items-center gap-1">
            {task.status === 'todo' && (
              <button type="button" onClick={(e) => { e.stopPropagation(); onStart(); }}
                title={isAr ? 'بدء' : 'Start'}
                className="rounded-lg bg-blue-500/10 px-2 py-1 text-[10px] font-bold text-blue-500 transition-colors hover:bg-blue-500 hover:text-white">
                <span className="flex items-center gap-1"><Play className="h-3 w-3" />{isAr ? 'بدء' : 'Start'}</span>
              </button>
            )}
            <button type="button" onClick={(e) => { e.stopPropagation(); onComplete(); }}
              title={isAr ? 'إكمال' : 'Complete'}
              className="rounded-lg bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-500 transition-colors hover:bg-emerald-500 hover:text-white">
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />{isAr ? 'إكمال' : 'Done'}</span>
            </button>
            <button type="button" onClick={(e) => { e.stopPropagation(); onDetail(); }}
              className="ms-auto rounded-lg bg-[var(--color-primary)]/10 px-2 py-1 text-[10px] font-bold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)] hover:text-white">
              {isAr ? 'تفاصيل' : 'Details'}
            </button>
          </div>
        )}
        {isDone && (
          <div className="mt-2 flex items-center">
            <button type="button" onClick={(e) => { e.stopPropagation(); onDetail(); }}
              className="ms-auto rounded-lg bg-[var(--color-primary)]/10 px-2 py-1 text-[10px] font-bold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)] hover:text-white">
              {isAr ? 'تفاصيل' : 'Details'}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
// SORTABLE TASK CARD
// ═══════════════════════════════════════════════════════════

export default function SortableTaskCard(props: {
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
