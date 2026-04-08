'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import { useToast } from '@/components/app/toast-notifications';
import { HabitTimerControls } from '@/components/app/habit-timer-controls';
import { getDoneRepCountForDate, sumLoggedDurationSecsOnDate } from '@/lib/habit-completion';
import { Habit, HabitLog, todayString, formatDurationSecs, resolveHabitColor } from '@/types/app';
import { isHabitDoneToday, getCategoryLabel, fadeUp, CATEGORY_LABELS } from '@/components/habits/habit-constants';
import { CheckCircle2, Circle, Timer, Clock, Hash, ListChecks, Eye, Archive } from 'lucide-react';

/* ---- Compact Habit Row ---- */
const TRACKING_LABELS: Record<string, { en: string; ar: string }> = {
  boolean: { en: 'Yes/No', ar: 'نعم/لا' },
  timer: { en: 'Timer', ar: 'مؤقت' },
  count: { en: 'Count', ar: 'عداد' },
  checklist: { en: 'Checklist', ar: 'قائمة' },
};

function HabitCompactRow({ habit, index, isAr, store, today, onEdit, onArchive, onDelete, onDetail, onViewPage }: {
  habit: Habit; index: number; isAr: boolean; store: ReturnType<typeof useAppStore>; today: string;
  onEdit: () => void; onArchive: () => void; onDelete: () => void; onDetail: () => void; onViewPage?: string;
}) {
  const toast = useToast();
  const hc = resolveHabitColor(habit.color);
  const done = isHabitDoneToday(habit, store.habitLogs, today);
  const hasDuration = !!habit.expectedDuration;
  const name = isAr ? habit.nameAr : habit.nameEn;
  const catLabel = getCategoryLabel(habit.category, isAr, store.deletedCategories, habit.archived);
  const tt = habit.trackingType ?? 'boolean';
  const sessionsToday = getDoneRepCountForDate(habit, store.habitLogs, today);
  const cumulativeSecsToday = hasDuration ? sumLoggedDurationSecsOnDate(habit.id, store.habitLogs, today) : 0;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (habit.archived) { toast.notifyWarning(isAr ? 'العادة مؤرشفة' : 'Habit is archived', isAr ? 'استعد العادة أولاً' : 'Restore the habit first'); return; }
    if (done) { toast.notifyInfo(isAr ? 'لا يمكن التراجع' : 'Cannot undo', isAr ? 'العادة مكتملة اليوم — الالتزام يعني عدم التراجع!' : 'Habit is done today — commitment means no going back!'); return; }
    if (hasDuration) { toast.notifyInfo(isAr ? 'يتطلب مؤقت' : 'Timer required', isAr ? 'شغّل المؤقت أولاً' : 'Start the timer first'); return; }
    if (tt === 'boolean' || tt === 'checklist') {
      store.logHabit({ habitId: habit.id, date: today, time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }), note: '', reminderUsed: false, perceivedDifficulty: habit.difficulty, completed: true });
    }
  };

  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      initial="hidden"
      animate="visible"
      whileHover={
        habit.archived
          ? undefined
          : { scale: 1.02, y: -4, transition: { type: 'spring', stiffness: 420, damping: 26 } }
      }
      whileTap={habit.archived ? undefined : { scale: 0.995 }}
      className={cn(
        'group relative rounded-2xl p-3 transition-[border-color,box-shadow,filter] duration-200 flex flex-col gap-1.5 cursor-default overflow-hidden',
        habit.archived ? 'opacity-75' : 'habit-card-animate',
      )}
      style={{
        border: `2px solid ${habit.archived ? 'rgba(245,158,11,0.35)' : `${hc}25`}`,
        borderInlineStartWidth: '4px',
        borderInlineStartColor: habit.archived ? '#f59e0b' : hc,
        background: habit.archived
          ? 'rgba(245,158,11,0.03)'
          : `linear-gradient(135deg, ${hc}08 0%, ${hc}03 100%)`,
        boxShadow: `0 2px 8px ${hc}10, 0 1px 2px rgba(0,0,0,0.04)`,
      }}
    >
      {/* Row 1: Done toggle + Name + badges */}
      <div className="flex items-center gap-2">
        <button type="button" onClick={handleToggle}
          className={cn(
            'shrink-0 rounded-full p-0.5 transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30',
            !(habit.archived || (hasDuration && !done)) && 'motion-safe:hover:scale-110 motion-safe:active:scale-95 motion-safe:hover:bg-[var(--foreground)]/[0.06]',
            (habit.archived || (hasDuration && !done)) && 'cursor-not-allowed',
          )}>
          {habit.archived
            ? <Archive className="h-[18px] w-[18px] text-amber-500" />
            : done
              ? <CheckCircle2 className="h-[18px] w-[18px] text-emerald-500" />
              : hasDuration
                ? <Timer className="h-[18px] w-[18px]" style={{ color: `${hc}70` }} />
                : <Circle className="h-[18px] w-[18px] text-[var(--foreground)]/20 hover:text-emerald-400 transition-colors" />}
        </button>
        <span className={cn('flex-1 text-[13px] font-bold leading-tight truncate', habit.archived && 'text-[var(--foreground)]/40', done && !habit.archived && 'line-through text-[var(--foreground)]/50')}>
          {name}
        </span>
        {done && !habit.archived && (
          <span className="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-black bg-emerald-500 text-white shadow-sm">
            {isAr ? '✓ تم' : '✓ Done'}
          </span>
        )}
        {habit.archived && (
          <span className="shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold bg-amber-500/15 text-amber-600 border border-amber-500/20">
            {isAr ? 'مؤرشفة' : 'Archived'}
          </span>
        )}
        <span className="shrink-0 rounded px-1.5 py-px text-[9px] font-bold transition-transform duration-200 motion-safe:group-hover:scale-105" style={{ background: `${hc}10`, color: hc }}>
          {catLabel}
        </span>
        {sessionsToday > 0 && (
          <span className="shrink-0 text-[10px] font-extrabold tabular-nums" style={{ color: hc }}>
            {sessionsToday}x
          </span>
        )}
      </div>

      {/* Row 2: Tracking type + timer info + Details button */}
      <div className="flex items-center gap-1.5">
        <span className="flex items-center gap-0.5 text-[10px] font-semibold text-[var(--foreground)]/45">
          {tt === 'timer' && <Clock className="h-2.5 w-2.5" />}
          {tt === 'count' && <Hash className="h-2.5 w-2.5" />}
          {tt === 'checklist' && <ListChecks className="h-2.5 w-2.5" />}
          {tt === 'boolean' && <CheckCircle2 className="h-2.5 w-2.5" />}
          {isAr ? TRACKING_LABELS[tt]?.ar : TRACKING_LABELS[tt]?.en}
        </span>
        {hasDuration && cumulativeSecsToday > 0 && (
          <span className="text-[10px] font-mono font-bold tabular-nums text-[var(--foreground)]/40">
            {formatDurationSecs(cumulativeSecsToday)}
          </span>
        )}
        {/* Timer controls inline */}
        {hasDuration && !habit.archived && (
          <div className="ms-auto" onClick={e => e.stopPropagation()}>
            <HabitTimerControls habit={habit} isAr={isAr} store={store} today={today} done={done} size="xs" />
          </div>
        )}
        <button type="button" onClick={(e) => { e.stopPropagation(); onDetail(); }}
          className="shrink-0 ms-auto flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] motion-safe:hover:scale-105 motion-safe:active:scale-95 motion-safe:hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--color-background)]"
          style={{ background: `${hc}10`, color: hc, border: `1px solid ${hc}18` }}
          onMouseEnter={(e) => { e.currentTarget.style.background = hc; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = hc; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = `${hc}10`; e.currentTarget.style.color = hc; e.currentTarget.style.borderColor = `${hc}18`; }}>
          <Eye className="h-3 w-3" />
          {isAr ? 'التفاصيل' : 'Details'}
        </button>
      </div>
    </motion.div>
  );
}

export default HabitCompactRow;
