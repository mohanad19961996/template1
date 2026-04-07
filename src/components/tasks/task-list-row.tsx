'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Task } from '@/types/app';
import { Check } from 'lucide-react';
import { PRIORITY_CONFIG } from './task-constants';

export default function ListRow({
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
