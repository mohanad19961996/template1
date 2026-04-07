'use client';

import React, { useMemo } from 'react';
import { Task } from '@/types/app';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useAppStore } from '@/stores/app-store';
import SortableTaskCard from './task-card';
import { EmptyColumn } from './task-empty-states';
import { type BoardColumnId } from './task-constants';

export default function BoardColumn({
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
    <div className="flex flex-col overflow-hidden rounded-xl border border-[var(--foreground)]/10 bg-[var(--color-background)] shadow-sm">
      <div className="h-[3px] w-full shrink-0" style={{ backgroundColor: accent }} />
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ color: accent, background: `${accent}15` }}>
          {icon}
        </span>
        <h2 className="flex-1 text-[13px] font-bold text-[var(--foreground)]/90">{title}</h2>
        <span className="rounded-full px-2 py-0.5 text-[11px] font-black tabular-nums" style={{ color: accent, background: `${accent}15` }}>
          {tasks.length}
        </span>
      </div>

      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="flex min-h-[120px] flex-1 flex-col gap-2.5 p-2 sm:gap-3">
          {tasks.length === 0 ? (
            <EmptyColumn isAr={isAr} columnId={columnId} />
          ) : columnId === 'today-overdue' ? (
            <>
              {/* Overdue section */}
              {overdueTasks.length > 0 && (
                <div className="rounded-lg border border-red-500/10 p-1.5">
                  <div className="mb-1.5 flex items-center gap-1.5 px-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    <span className="text-[10px] font-bold text-red-500">
                      {isAr ? 'متأخرة' : 'Overdue'} ({overdueTasks.length})
                    </span>
                  </div>
                  <div className="flex flex-col gap-2.5">
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
                    <span className="text-[10px] font-bold text-amber-500">
                      {isAr ? 'اليوم' : 'Today'} ({todayTasks.length})
                    </span>
                  </div>
                  <div className="flex flex-col gap-2.5">
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
