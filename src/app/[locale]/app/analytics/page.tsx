'use client';

import React, { useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import { todayString, formatDuration, parseLocalDate, formatLocalDate } from '@/types/app';
import {
  BarChart3, TrendingUp, Clock, CheckCircle2, Flame, Star,
  Calendar, Target, Brain, Zap, Award, Activity,
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } }),
};

export default function AnalyticsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const store = useAppStore();
  const today = todayString();
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');

  // Date range
  const dateRange = useMemo(() => {
    const end = parseLocalDate(today);
    const start = parseLocalDate(today);
    if (period === 'week') start.setDate(start.getDate() - 7);
    else if (period === 'month') start.setDate(start.getDate() - 30);
    else start.setDate(start.getDate() - 365);
    return { start: formatLocalDate(start), end: today };
  }, [today, period]);

  // Core stats
  const activeHabits = store.habits.filter(h => !h.archived);
  const periodLogs = useMemo(() =>
    store.habitLogs.filter(l => l.date >= dateRange.start && l.date <= dateRange.end && l.completed),
    [store.habitLogs, dateRange]
  );
  const periodSessions = useMemo(() =>
    store.skillSessions.filter(s => s.date >= dateRange.start && s.date <= dateRange.end),
    [store.skillSessions, dateRange]
  );

  const totalFocusMinutes = periodSessions.reduce((a, s) => a + s.duration, 0);
  const avgQuality = periodSessions.length
    ? Math.round(periodSessions.reduce((a, s) => a + s.qualityRating, 0) / periodSessions.length * 10) / 10 : 0;

  // Habit completion by day
  const dailyCompletion = useMemo(() => {
    const days: { date: string; count: number; total: number }[] = [];
    const numDays = period === 'week' ? 7 : period === 'month' ? 30 : 52;
    const d = parseLocalDate(today);
    for (let i = numDays - 1; i >= 0; i--) {
      const dt = new Date(d);
      dt.setDate(dt.getDate() - i);
      const dateStr = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
      const completed = store.habitLogs.filter(l => l.date === dateStr && l.completed).length;
      days.push({ date: dateStr, count: completed, total: activeHabits.length });
    }
    return days;
  }, [store.habitLogs, activeHabits, today, period]);

  // Weekday performance
  const weekdayStats = useMemo(() => {
    const stats = [0, 0, 0, 0, 0, 0, 0];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    periodLogs.forEach(l => {
      const day = parseLocalDate(l.date).getDay();
      stats[day]++;
    });
    return stats;
  }, [periodLogs]);

  const dayLabels = isAr
    ? ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const bestDayIdx = weekdayStats.indexOf(Math.max(...weekdayStats));
  const worstDayIdx = weekdayStats.indexOf(Math.min(...weekdayStats));

  // Top skills by time
  const topSkills = useMemo(() => {
    const map = new Map<string, number>();
    periodSessions.forEach(s => {
      map.set(s.skillId, (map.get(s.skillId) ?? 0) + s.duration);
    });
    return [...map.entries()]
      .map(([id, mins]) => ({ skill: store.skills.find(s => s.id === id), minutes: mins }))
      .filter(s => s.skill)
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 5);
  }, [periodSessions, store.skills]);

  // Streaks
  const allStreaks = useMemo(() =>
    activeHabits.map(h => ({ habit: h, streak: store.getHabitStreak(h.id) }))
      .sort((a, b) => b.streak.current - a.streak.current),
    [activeHabits, store]
  );

  // Focus distribution by hour
  const hourlyFocus = useMemo(() => {
    const hours = new Array(24).fill(0);
    periodSessions.forEach(s => {
      const hour = parseInt(s.startTime.split(':')[0]);
      hours[hour] += s.duration;
    });
    return hours;
  }, [periodSessions]);

  const peakHour = hourlyFocus.indexOf(Math.max(...hourlyFocus));

  // Insights
  const insights = useMemo(() => {
    const list: { textEn: string; textAr: string; icon: React.ElementType; color: string }[] = [];

    if (bestDayIdx >= 0) {
      list.push({
        textEn: `You're most consistent on ${dayLabels[bestDayIdx]}s`,
        textAr: `أكثر أيامك إنتاجية هو ${dayLabels[bestDayIdx]}`,
        icon: TrendingUp, color: 'text-emerald-500',
      });
    }
    if (peakHour >= 0 && hourlyFocus[peakHour] > 0) {
      list.push({
        textEn: `Peak focus time: ${peakHour}:00 - ${peakHour + 1}:00`,
        textAr: `أفضل وقت للتركيز: ${peakHour}:00 - ${peakHour + 1}:00`,
        icon: Zap, color: 'text-amber-500',
      });
    }
    if (totalFocusMinutes > 0) {
      list.push({
        textEn: `${Math.round(totalFocusMinutes / 60)}h focused in this period`,
        textAr: `${Math.round(totalFocusMinutes / 60)} ساعة تركيز في هذه الفترة`,
        icon: Clock, color: 'text-blue-500',
      });
    }
    if (allStreaks.length > 0 && allStreaks[0].streak.current > 0) {
      list.push({
        textEn: `Longest active streak: ${allStreaks[0].streak.current} days (${isAr ? allStreaks[0].habit.nameAr : allStreaks[0].habit.nameEn})`,
        textAr: `أطول سلسلة نشطة: ${allStreaks[0].streak.current} أيام (${allStreaks[0].habit.nameAr})`,
        icon: Flame, color: 'text-orange-500',
      });
    }

    return list;
  }, [bestDayIdx, peakHour, totalFocusMinutes, allStreaks, hourlyFocus, dayLabels, isAr]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 pb-20 max-w-[1400px] mx-auto">
      {/* Header */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{isAr ? 'التحليلات' : 'Analytics'}</h1>
          <p className="text-sm text-[var(--foreground)]/70 mt-1">{isAr ? 'نظرة شاملة على أدائك' : 'Overview of your performance'}</p>
        </div>
        <div className="flex p-1 rounded-xl bg-[var(--foreground)]/[0.05]">
          {(['week', 'month', 'year'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={cn('px-4 py-1.5 rounded-lg text-xs font-medium transition-all',
                period === p ? 'bg-[var(--color-background)] shadow-sm' : 'text-[var(--foreground)]/60')}>
              {p === 'week' ? (isAr ? 'أسبوع' : 'Week') : p === 'month' ? (isAr ? 'شهر' : 'Month') : (isAr ? 'سنة' : 'Year')}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Overview Cards */}
      <motion.div initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { labelEn: 'Habits Done', labelAr: 'عادات مكتملة', value: periodLogs.length, icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-500/10' },
          { labelEn: 'Focus Hours', labelAr: 'ساعات التركيز', value: `${Math.round(totalFocusMinutes / 60)}h`, icon: Clock, color: 'text-blue-500 bg-blue-500/10' },
          { labelEn: 'Sessions', labelAr: 'الجلسات', value: periodSessions.length, icon: Activity, color: 'text-purple-500 bg-purple-500/10' },
          { labelEn: 'Avg Quality', labelAr: 'متوسط الجودة', value: `${avgQuality}/5`, icon: Star, color: 'text-amber-500 bg-amber-500/10' },
        ].map((s, i) => (
          <motion.div key={i} variants={fadeUp} custom={i + 1}
            className="rounded-2xl app-stat-card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-medium text-[var(--foreground)]/60 uppercase tracking-wider">{isAr ? s.labelAr : s.labelEn}</span>
              <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', s.color.split(' ')[1])}>
                <s.icon className={cn('h-4 w-4', s.color.split(' ')[0])} />
              </div>
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Daily Completion Chart */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={5}
            className="rounded-2xl app-card p-5">
            <h3 className="text-sm font-semibold mb-4">{isAr ? 'الإنجاز اليومي' : 'Daily Completion'}</h3>
            <div className="flex items-end gap-[2px] h-32 overflow-hidden">
              {dailyCompletion.map((day, i) => {
                const max = Math.max(...dailyCompletion.map(d => d.count), 1);
                const height = (day.count / max) * 100;
                return (
                  <div key={i} className="flex-1 min-w-[2px] group relative">
                    <div className="w-full rounded-t-sm transition-all duration-300 hover:opacity-80"
                      style={{ height: `${Math.max(height, 2)}%`, backgroundColor: 'var(--color-primary)', opacity: 0.3 + (height / 100) * 0.7 }} />
                    <div className="absolute bottom-full mb-1 start-1/2 -translate-x-1/2 hidden group-hover:block z-10 px-2 py-1 rounded-md bg-[var(--foreground)] text-[var(--background)] text-[10px] font-medium whitespace-nowrap">
                      {day.date}: {day.count}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Weekday Performance */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={6}
            className="rounded-2xl app-card p-5">
            <h3 className="text-sm font-semibold mb-4">{isAr ? 'الأداء حسب اليوم' : 'Performance by Day'}</h3>
            <div className="flex items-end gap-2 h-24">
              {weekdayStats.map((count, i) => {
                const max = Math.max(...weekdayStats, 1);
                const height = (count / max) * 100;
                const isBest = i === bestDayIdx;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className="text-[10px] font-medium tabular-nums">{count}</span>
                    <div className={cn('w-full rounded-t-md transition-all', isBest ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-primary)]/30')}
                      style={{ height: `${Math.max(height, 4)}%` }} />
                    <span className={cn('text-[10px]', isBest ? 'font-bold text-[var(--color-primary)]' : 'text-[var(--foreground)]/50')}>
                      {dayLabels[i]}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Hourly Focus Distribution */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={7}
            className="rounded-2xl app-card p-5">
            <h3 className="text-sm font-semibold mb-1">{isAr ? 'توزيع التركيز بالساعة' : 'Focus Distribution by Hour'}</h3>
            <p className="text-xs text-[var(--foreground)]/60 mb-4">
              {peakHour >= 0 && hourlyFocus[peakHour] > 0
                ? (isAr ? `ذروة التركيز: ${peakHour}:00` : `Peak focus: ${peakHour}:00`)
                : (isAr ? 'لا توجد بيانات' : 'No data yet')}
            </p>
            <div className="flex items-end gap-[1px] h-16">
              {hourlyFocus.map((mins, h) => {
                const max = Math.max(...hourlyFocus, 1);
                const height = (mins / max) * 100;
                return (
                  <div key={h} className="flex-1 rounded-t-sm transition-all"
                    style={{ height: `${Math.max(height, 1)}%`, backgroundColor: h === peakHour ? 'var(--color-primary)' : 'var(--color-primary)', opacity: h === peakHour ? 1 : 0.2 + (height / 100) * 0.5 }} />
                );
              })}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[8px] text-[var(--foreground)]/40">00</span>
              <span className="text-[8px] text-[var(--foreground)]/40">06</span>
              <span className="text-[8px] text-[var(--foreground)]/40">12</span>
              <span className="text-[8px] text-[var(--foreground)]/40">18</span>
              <span className="text-[8px] text-[var(--foreground)]/40">24</span>
            </div>
          </motion.div>
        </div>

        <div className="space-y-6">
          {/* Smart Insights */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={5}
            className="rounded-2xl app-card p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Brain className="h-4 w-4 text-[var(--color-primary)]" />
              {isAr ? 'رؤى ذكية' : 'Smart Insights'}
            </h3>
            {insights.length === 0 ? (
              <p className="text-xs text-[var(--foreground)]/50 text-center py-4">{isAr ? 'ابدأ التتبع للحصول على رؤى' : 'Start tracking to get insights'}</p>
            ) : (
              <div className="space-y-3">
                {insights.map((ins, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className={cn('mt-0.5 flex h-6 w-6 items-center justify-center rounded-lg shrink-0', ins.color.replace('text-', 'bg-').replace('500', '500/10'))}>
                      <ins.icon className={cn('h-3.5 w-3.5', ins.color)} />
                    </div>
                    <p className="text-xs text-[var(--foreground)]/80 leading-relaxed">{isAr ? ins.textAr : ins.textEn}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Top Skills */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={6}
            className="rounded-2xl app-card p-5">
            <h3 className="text-sm font-semibold mb-3">{isAr ? 'أفضل المهارات' : 'Top Skills'}</h3>
            {topSkills.length === 0 ? (
              <p className="text-xs text-[var(--foreground)]/50 text-center py-4">{isAr ? 'لا توجد بيانات' : 'No data'}</p>
            ) : (
              <div className="space-y-3">
                {topSkills.map(({ skill, minutes }, i) => (
                  <div key={skill!.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{isAr ? skill!.nameAr : skill!.nameEn}</span>
                      <span className="text-[10px] text-[var(--foreground)]/60">{formatDuration(minutes)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--foreground)]/[0.05] overflow-hidden">
                      <div className="h-full rounded-full" style={{
                        width: `${(minutes / Math.max(...topSkills.map(s => s.minutes), 1)) * 100}%`,
                        backgroundColor: skill!.color,
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Streak Rankings */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={7}
            className="rounded-2xl app-card p-5">
            <h3 className="text-sm font-semibold mb-3">{isAr ? 'ترتيب السلاسل' : 'Streak Rankings'}</h3>
            {allStreaks.filter(s => s.streak.current > 0 || s.streak.best > 0).length === 0 ? (
              <p className="text-xs text-[var(--foreground)]/50 text-center py-4">{isAr ? 'لا توجد سلاسل' : 'No streaks yet'}</p>
            ) : (
              <div className="space-y-2">
                {allStreaks.filter(s => s.streak.best > 0).slice(0, 5).map(({ habit, streak }, i) => (
                  <div key={habit.id} className="flex items-center gap-3 rounded-lg bg-[var(--foreground)]/[0.03] px-3 py-2">
                    <span className="text-xs font-bold text-[var(--foreground)]/50 w-4">#{i + 1}</span>
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: habit.color }} />
                    <span className="text-xs flex-1 truncate">{isAr ? habit.nameAr : habit.nameEn}</span>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-0.5 text-[10px]">
                        <Flame className="h-3 w-3 text-orange-400" /> {streak.current}
                      </span>
                      <span className="flex items-center gap-0.5 text-[10px] text-[var(--foreground)]/50">
                        <Award className="h-3 w-3" /> {streak.best}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
