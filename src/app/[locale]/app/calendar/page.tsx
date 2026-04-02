'use client';

import React, { useState, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import { todayString, getDaysInMonth, formatDuration } from '@/types/app';
import {
  ChevronLeft, ChevronRight, Calendar, CheckCircle2, Clock,
  Brain, Apple, Smile, Activity,
} from 'lucide-react';

function formatDurationPrecise(totalSecs: number): string {
  if (totalSecs <= 0) return '0s';
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = Math.floor(totalSecs % 60);
  if (h > 0) return s > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${h}h ${m}m` : `${h}h`;
  if (m > 0) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  return `${s}s`;
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } }),
};

export default function CalendarPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const store = useAppStore();
  const today = todayString();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(today);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const monthName = currentDate.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { month: 'long', year: 'numeric' });

  const dayNames = isAr
    ? ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calendar data for each day
  const calendarDays = useMemo(() => {
    const days: { date: string; day: number; habits: number; sessions: number; hormones: number; nutrition: number; isToday: boolean }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        date: dateStr, day: d,
        habits: store.habitLogs.filter(l => l.date === dateStr && l.completed).length,
        sessions: store.skillSessions.filter(s => s.date === dateStr).length,
        hormones: store.hormoneLogs.filter(l => l.date === dateStr).length,
        nutrition: store.nutritionLogs.filter(n => n.date === dateStr).length,
        isToday: dateStr === today,
      });
    }
    return days;
  }, [year, month, daysInMonth, store.habitLogs, store.skillSessions, store.hormoneLogs, store.nutritionLogs, today]);

  // Selected day details
  const selectedData = useMemo(() => store.getLogsForDate(selectedDate), [store, selectedDate]);
  const selectedFocusMin = useMemo(() => selectedData.skills.reduce((a, s) => a + s.duration, 0), [selectedData]);

  const prevMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 pb-20 max-w-[1400px] mx-auto">
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{isAr ? 'التقويم والسجل' : 'Calendar & History'}</h1>
        <p className="text-sm text-[var(--foreground)]/70 mt-1">{isAr ? 'مراجعة أنشطتك وتقدمك' : 'Review your activities and progress'}</p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="lg:col-span-2">
          <div className="rounded-2xl app-card overflow-hidden">
            {/* Month navigation */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--foreground)]/[0.1]">
              <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-[var(--foreground)]/[0.05]">
                {isAr ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>
              <h2 className="text-sm font-semibold">{monthName}</h2>
              <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-[var(--foreground)]/[0.05]">
                {isAr ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            </div>

            {/* Day names */}
            <div className="grid grid-cols-7 px-2">
              {dayNames.map(d => (
                <div key={d} className="py-2 text-center text-[10px] font-medium text-[var(--foreground)]/50">{d}</div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 px-2 pb-3 gap-1">
              {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e${i}`} />)}
              {calendarDays.map(day => {
                const hasActivity = day.habits > 0 || day.sessions > 0 || day.hormones > 0;
                const isSelected = day.date === selectedDate;
                return (
                  <button
                    key={day.date}
                    onClick={() => setSelectedDate(day.date)}
                    className={cn(
                      'relative flex flex-col items-center justify-center rounded-xl py-2 sm:py-3 text-sm transition-all',
                      isSelected ? 'bg-[var(--color-primary)] text-white' :
                      day.isToday ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold' :
                      'hover:bg-[var(--foreground)]/[0.08]'
                    )}
                  >
                    <span className="font-medium">{day.day}</span>
                    {hasActivity && !isSelected && (
                      <div className="flex gap-0.5 mt-0.5">
                        {day.habits > 0 && <div className="h-1 w-1 rounded-full bg-emerald-500" />}
                        {day.sessions > 0 && <div className="h-1 w-1 rounded-full bg-blue-500" />}
                        {day.hormones > 0 && <div className="h-1 w-1 rounded-full bg-purple-500" />}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Day Details */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2} className="space-y-4">
          <div className="rounded-2xl app-card p-5">
            <h3 className="text-sm font-semibold mb-1">
              {new Date(selectedDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>
            <p className="text-xs text-[var(--foreground)]/60 mb-4">{selectedDate === today ? (isAr ? 'اليوم' : 'Today') : ''}</p>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { labelEn: 'Habits', labelAr: 'عادات', value: new Set(selectedData.habits.filter(l => l.completed).map(l => l.habitId)).size, icon: CheckCircle2, color: 'text-emerald-500' },
                { labelEn: 'Focus', labelAr: 'تركيز', value: formatDuration(selectedFocusMin), icon: Clock, color: 'text-blue-500' },
                { labelEn: 'Wellness', labelAr: 'عافية', value: selectedData.hormones.length, icon: Brain, color: 'text-purple-500' },
                { labelEn: 'Meals', labelAr: 'وجبات', value: selectedData.nutrition.length, icon: Apple, color: 'text-orange-500' },
              ].map((s, i) => (
                <div key={i} className="rounded-lg bg-[var(--foreground)]/[0.03] p-2.5 text-center">
                  <s.icon className={cn('h-4 w-4 mx-auto mb-1', s.color)} />
                  <p className="text-sm font-bold">{s.value}</p>
                  <p className="text-[9px] text-[var(--foreground)]/60">{isAr ? s.labelAr : s.labelEn}</p>
                </div>
              ))}
            </div>

            {/* Activity list — group multiple sessions per habit */}
            <div className="space-y-2">
              {(() => {
                const completedLogs = selectedData.habits.filter(l => l.completed);
                // Group logs by habitId
                const grouped = new Map<string, typeof completedLogs>();
                for (const log of completedLogs) {
                  const arr = grouped.get(log.habitId) ?? [];
                  arr.push(log);
                  grouped.set(log.habitId, arr);
                }
                return Array.from(grouped.entries()).map(([habitId, logs]) => {
                  const habit = store.habits.find(h => h.id === habitId);
                  const totalDurationSecs = logs.reduce((sum, l) => {
                    const d = l.duration ?? 0;
                    return sum + (d <= 300 ? d * 60 : d); // normalize old minutes to seconds
                  }, 0);
                  return (
                    <div key={habitId} className="flex items-center gap-2 text-xs">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                      <span className="text-[var(--foreground)]/80">
                        {isAr ? habit?.nameAr : habit?.nameEn}
                        {logs.length > 1 && <span className="text-emerald-600 font-bold"> ×{logs.length}</span>}
                      </span>
                      <span className="text-[var(--foreground)]/50 ms-auto">
                        {totalDurationSecs > 0 ? formatDurationPrecise(totalDurationSecs) : logs[logs.length - 1].time}
                      </span>
                    </div>
                  );
                });
              })()}
              {selectedData.skills.map(session => {
                const skill = store.skills.find(s => s.id === session.skillId);
                return (
                  <div key={session.id} className="flex items-center gap-2 text-xs">
                    <Clock className="h-3 w-3 text-blue-500 shrink-0" />
                    <span className="text-[var(--foreground)]/80">{isAr ? skill?.nameAr : skill?.nameEn}</span>
                    <span className="text-[var(--foreground)]/50 ms-auto">{formatDuration(session.duration)}</span>
                  </div>
                );
              })}
              {selectedData.habits.length === 0 && selectedData.skills.length === 0 && (
                <p className="text-xs text-[var(--foreground)]/50 text-center py-4">
                  {isAr ? 'لا توجد أنشطة في هذا اليوم' : 'No activities on this day'}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
