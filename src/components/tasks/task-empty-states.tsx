'use client';

import React from 'react';
import {
  Plus, Search, ClipboardList, CheckCircle2, Play, CalendarClock,
} from 'lucide-react';
import { type BoardColumnId } from './task-constants';

export function EmptyGlobal({ isAr, onAdd }: { isAr: boolean; onAdd: () => void }) {
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

export function EmptyFiltered({ isAr, onClear }: { isAr: boolean; onClear: () => void }) {
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

export function EmptyColumn({ isAr, columnId }: { isAr: boolean; columnId: BoardColumnId }) {
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
