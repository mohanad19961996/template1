'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getDoneRepCountForDate, getTotalCompletionUnits } from '@/lib/habit-completion';
import { useAppStore } from '@/stores/app-store';
import { Habit, HabitLog, todayString, formatLocalDate } from '@/types/app';
import { CheckCircle2, Clock, Flame, Target, BarChart3, TrendingUp, Activity, Trophy, Calendar as CalendarIcon } from 'lucide-react';
import { fadeUp, DAY_LABELS, MONTH_LABELS, CATEGORY_LABELS } from '@/components/habits/habit-constants';

function HabitsInsights({ isAr, store }: { isAr: boolean; store: ReturnType<typeof useAppStore> }) {
  const today = todayString();
  const activeHabits = store.habits.filter(h => !h.archived);
  const allLogs = store.habitLogs.filter(l => l.completed);
  const allHabitLogs = store.habitLogs; // All logs including incomplete — for time tracking

  // ── Time-based stats ──
  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = todayString();

    // Total completions (per habit semantics — boolean = one unit per completed day)
    const totalCompletions = activeHabits.reduce((sum, h) => sum + getTotalCompletionUnits(h, store.habitLogs), 0);

    const sumCompletionUnitsInRange = (startStr: string, endStr: string) =>
      activeHabits.reduce((habitSum, h) => {
        const dates = [...new Set(
          store.habitLogs.filter(l => l.habitId === h.id && l.date >= startStr && l.date <= endStr).map(l => l.date),
        )];
        return habitSum + dates.reduce((dSum, d) => dSum + getDoneRepCountForDate(h, store.habitLogs, d), 0);
      }, 0);

    // Total hours — count ALL logged time (completed or not)
    const totalMinutes = allHabitLogs.reduce((sum, l) => sum + (l.duration ?? 0), 0);
    const totalHours = Math.round(totalMinutes / 60 * 10) / 10;

    // This week completions
    const weekStart = new Date(now);
    const wd = weekStart.getDay(); weekStart.setDate(weekStart.getDate() - (wd === 0 ? 6 : wd - 1));
    const weekStartStr = formatLocalDate(weekStart);
    const thisWeek = sumCompletionUnitsInRange(weekStartStr, todayStr);
    const thisWeekMinutes = allHabitLogs.filter(l => l.date >= weekStartStr && l.date <= todayStr).reduce((s, l) => s + (l.duration ?? 0), 0);

    // This month
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const thisMonth = sumCompletionUnitsInRange(monthStart, todayStr);
    const thisMonthMinutes = allHabitLogs.filter(l => l.date >= monthStart && l.date <= todayStr).reduce((s, l) => s + (l.duration ?? 0), 0);

    // This year
    const yearStart = `${now.getFullYear()}-01-01`;
    const thisYear = sumCompletionUnitsInRange(yearStart, todayStr);
    const thisYearMinutes = allHabitLogs.filter(l => l.date >= yearStart && l.date <= todayStr).reduce((s, l) => s + (l.duration ?? 0), 0);

    // Active days (unique dates with at least one completion)
    const activeDays = new Set(allLogs.map(l => l.date)).size;

    // Longest streak across all habits
    let bestStreak = 0;
    let bestStreakHabit = '';
    activeHabits.forEach(h => {
      const s = store.getHabitStreak(h.id);
      if (s.best > bestStreak) {
        bestStreak = s.best;
        bestStreakHabit = isAr ? h.nameAr : h.nameEn;
      }
    });

    // Average daily completions
    const firstLog = allLogs.length > 0 ? allLogs.reduce((min, l) => l.date < min ? l.date : min, allLogs[0].date) : todayStr;
    const daysSinceFirst = Math.max(1, Math.floor((Date.now() - new Date(firstLog).getTime()) / 86400000));
    const avgPerDay = Math.round((totalCompletions / daysSinceFirst) * 10) / 10;

    return {
      totalCompletions, totalHours, totalMinutes,
      thisWeek, thisWeekMinutes,
      thisMonth, thisMonthMinutes,
      thisYear, thisYearMinutes,
      activeDays, bestStreak, bestStreakHabit,
      avgPerDay, daysSinceFirst,
    };
  }, [allLogs, activeHabits, store, store.habitLogs, isAr]);

  // ── Weekly heatmap (last 12 weeks) ──
  const weeklyData = useMemo(() => {
    const weeks: { weekLabel: string; days: { date: string; count: number; isToday: boolean }[] }[] = [];
    const base = new Date();
    for (let w = 11; w >= 0; w--) {
      const weekStart = new Date(base);
      const wd4529 = weekStart.getDay(); weekStart.setDate(weekStart.getDate() - (wd4529 === 0 ? 6 : wd4529 - 1) - w * 7);
      const days: { date: string; count: number; isToday: boolean }[] = [];
      for (let d = 0; d < 7; d++) {
        const dt = new Date(weekStart);
        dt.setDate(dt.getDate() + d);
        const ds = formatLocalDate(dt);
        days.push({
          date: ds,
          count: ds <= today
            ? activeHabits.reduce((s, h) => s + getDoneRepCountForDate(h, store.habitLogs, ds), 0)
            : -1,
          isToday: ds === today,
        });
      }
      const wStart = weekStart.toLocaleDateString(isAr ? 'ar-SA-u-nu-latn' : 'en-US', { month: 'short', day: 'numeric' });
      weeks.push({ weekLabel: wStart, days });
    }
    return weeks;
  }, [allLogs, today, isAr, activeHabits, store.habitLogs]);

  const maxDayCount = Math.max(...weeklyData.flatMap(w => w.days.map(d => d.count)), 1);

  // ── Per-habit breakdown ──
  const habitBreakdown = useMemo(() => {
    return activeHabits.map(h => {
      const logs = allLogs.filter(l => l.habitId === h.id);
      const totalMin = logs.reduce((s, l) => s + (l.duration ?? 0), 0);
      const streak = store.getHabitStreak(h.id);
      const st = store.getHabitStats(h.id);
      return {
        habit: h,
        completions: st.totalCompletions,
        totalMinutes: totalMin,
        streak: streak.current,
        bestStreak: streak.best,
        rate: st.completionRate,
        lastDate: streak.lastCompletedDate,
      };
    }).sort((a, b) => b.completions - a.completions);
  }, [activeHabits, allLogs, store]);

  // ── Monthly trend (last 6 months) ──
  const monthlyTrend = useMemo(() => {
    const months: { label: string; count: number; minutes: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = formatLocalDate(d);
      const end = formatLocalDate(new Date(d.getFullYear(), d.getMonth() + 1, 0));
      const mLogs = allLogs.filter(l => l.date >= start && l.date <= end);
      months.push({
        label: d.toLocaleDateString(isAr ? 'ar-SA-u-nu-latn' : 'en-US', { month: 'short' }),
        count: mLogs.length,
        minutes: mLogs.reduce((s, l) => s + (l.duration ?? 0), 0),
      });
    }
    return months;
  }, [allLogs, isAr]);

  const maxMonthCount = Math.max(...monthlyTrend.map(m => m.count), 1);

  const fmtTime = (min: number) => {
    if (min < 60) return `${min}${isAr ? ' د' : 'm'}`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}${isAr ? ' س' : 'h'} ${m}${isAr ? ' د' : 'm'}` : `${h}${isAr ? ' ساعة' : 'h'}`;
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <motion.div initial="hidden" animate="visible" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {[
          { labelEn: 'Total Completions', labelAr: 'إجمالي الإنجازات', value: stats.totalCompletions, icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-500/10' },
          { labelEn: 'Total Hours', labelAr: 'إجمالي الساعات', value: stats.totalHours > 0 ? fmtTime(stats.totalMinutes) : '—', icon: Clock, color: 'text-blue-500 bg-blue-500/10' },
          { labelEn: 'This Week', labelAr: 'هذا الأسبوع', value: stats.thisWeek, sub: stats.thisWeekMinutes > 0 ? fmtTime(stats.thisWeekMinutes) : undefined, icon: CalendarIcon, color: 'text-violet-500 bg-violet-500/10' },
          { labelEn: 'This Month', labelAr: 'هذا الشهر', value: stats.thisMonth, sub: stats.thisMonthMinutes > 0 ? fmtTime(stats.thisMonthMinutes) : undefined, icon: BarChart3, color: 'text-amber-500 bg-amber-500/10' },
          { labelEn: 'This Year', labelAr: 'هذه السنة', value: stats.thisYear, sub: stats.thisYearMinutes > 0 ? fmtTime(stats.thisYearMinutes) : undefined, icon: TrendingUp, color: 'text-pink-500 bg-pink-500/10' },
          { labelEn: 'Active Days', labelAr: 'أيام نشطة', value: stats.activeDays, icon: Flame, color: 'text-orange-500 bg-orange-500/10' },
          { labelEn: 'Avg / Day', labelAr: 'متوسط يومي', value: stats.avgPerDay, icon: Activity, color: 'text-cyan-500 bg-cyan-500/10' },
          { labelEn: 'Best Streak', labelAr: 'أطول سلسلة', value: stats.bestStreak, sub: stats.bestStreakHabit, icon: Trophy, color: 'text-yellow-500 bg-yellow-500/10' },
        ].map((s, i) => (
          <motion.div key={i} variants={fadeUp} custom={i} className="app-stat-card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-medium text-[var(--foreground)] uppercase tracking-wider">{isAr ? s.labelAr : s.labelEn}</span>
              <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', s.color.split(' ')[1])}>
                <s.icon className={cn('h-4 w-4', s.color.split(' ')[0])} />
              </div>
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
            {'sub' in s && s.sub && <p className="text-[10px] text-[var(--foreground)] mt-0.5 truncate">{s.sub}</p>}
          </motion.div>
        ))}
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={8} className="app-card rounded-2xl p-5">
          <h3 className="text-sm font-bold mb-4">{isAr ? 'الإنجازات الشهرية' : 'Monthly Completions'}</h3>
          <div className="flex items-end gap-2 h-36">
            {monthlyTrend.map((m, i) => {
              const pct = (m.count / maxMonthCount) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-[10px] font-bold text-[var(--foreground)]">{m.count}</span>
                  <div className="w-full rounded-t-lg bg-[var(--color-primary)]/15 relative" style={{ height: `${Math.max(pct, 4)}%` }}>
                    <div className="absolute bottom-0 w-full rounded-t-lg bg-[var(--color-primary)] transition-all" style={{ height: `${pct}%` }} />
                  </div>
                  <span className="text-[9px] text-[var(--foreground)] font-medium">{m.label}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* 12-week Heatmap */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={9} className="app-card rounded-2xl p-5">
          <h3 className="text-sm font-bold mb-4">{isAr ? 'خريطة النشاط (١٢ أسبوع)' : 'Activity Heatmap (12 weeks)'}</h3>
          {/* Day labels */}
          <div className="flex gap-1">
            <div className="w-8 shrink-0 flex flex-col gap-1 pt-0">
              {(isAr ? DAY_LABELS.ar : DAY_LABELS.en).map((d, i) => (
                <div key={i} className="h-4 flex items-center">
                  <span className="text-[7px] text-[var(--foreground)]">{d[0]}</span>
                </div>
              ))}
            </div>
            <div className="flex-1 flex gap-1 overflow-x-auto">
              {weeklyData.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-1 min-w-[16px] flex-1">
                  {week.days.map((day, di) => (
                    <div key={di} title={`${day.date}: ${day.count >= 0 ? day.count : '—'}`}
                      className={cn(
                        'h-4 rounded-sm transition-colors',
                        day.count < 0 && 'bg-[var(--foreground)]/[0.02]',
                        day.count === 0 && 'bg-[var(--foreground)]/[0.05]',
                        day.count > 0 && day.count <= maxDayCount * 0.33 && 'bg-emerald-300',
                        day.count > maxDayCount * 0.33 && day.count <= maxDayCount * 0.66 && 'bg-emerald-500',
                        day.count > maxDayCount * 0.66 && 'bg-emerald-600',
                        day.isToday && 'ring-1 ring-[var(--color-primary)]',
                      )} />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-end gap-1.5 mt-2">
            <span className="text-[8px] text-[var(--foreground)]">{isAr ? 'أقل' : 'Less'}</span>
            {[0.02, 0.06].map((_, i) => <div key={`e${i}`} className={cn('h-3 w-3 rounded-sm', i === 0 ? 'bg-[var(--foreground)]/[0.02]' : 'bg-[var(--foreground)]/[0.05]')} />)}
            {['bg-emerald-300', 'bg-emerald-500', 'bg-emerald-600'].map((c, i) => <div key={i} className={cn('h-3 w-3 rounded-sm', c)} />)}
            <span className="text-[8px] text-[var(--foreground)]">{isAr ? 'أكثر' : 'More'}</span>
          </div>
        </motion.div>
      </div>

      {/* Per-Habit Breakdown Table */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={10} className="app-card rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-[var(--foreground)]/[0.18]">
          <h3 className="text-sm font-bold">{isAr ? 'تفاصيل كل عادة' : 'Per-Habit Breakdown'}</h3>
        </div>
        {habitBreakdown.length === 0 ? (
          <div className="p-8 text-center">
            <Target className="h-8 w-8 text-[var(--foreground)] mx-auto mb-2" />
            <p className="text-xs text-[var(--foreground)]">{isAr ? 'لا توجد عادات' : 'No habits yet'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--foreground)]/[0.15]">
                  <th className="text-start px-5 py-3 text-[10px] font-bold text-[var(--foreground)] uppercase tracking-wider">{isAr ? 'العادة' : 'Habit'}</th>
                  <th className="px-3 py-3 text-center text-[10px] font-bold text-[var(--foreground)] uppercase">{isAr ? 'الإنجازات' : 'Done'}</th>
                  <th className="px-3 py-3 text-center text-[10px] font-bold text-[var(--foreground)] uppercase">{isAr ? 'الوقت' : 'Time'}</th>
                  <th className="px-3 py-3 text-center text-[10px] font-bold text-[var(--foreground)] uppercase">{isAr ? 'السلسلة' : 'Streak'}</th>
                  <th className="px-3 py-3 text-center text-[10px] font-bold text-[var(--foreground)] uppercase">{isAr ? 'أفضل' : 'Best'}</th>
                  <th className="px-3 py-3 text-center text-[10px] font-bold text-[var(--foreground)] uppercase">{isAr ? 'المعدل' : 'Rate'}</th>
                  <th className="px-3 py-3 text-center text-[10px] font-bold text-[var(--foreground)] uppercase">{isAr ? 'آخر التزام' : 'Last'}</th>
                </tr>
              </thead>
              <tbody>
                {habitBreakdown.map((row, ri) => (
                  <tr key={row.habit.id} className={cn('border-b border-[var(--foreground)]/[0.15] hover:bg-[var(--foreground)]/[0.02]', ri % 2 === 1 && 'bg-[var(--foreground)]/[0.015]')}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: row.habit.color }} />
                        <div>
                          <span className="text-sm font-semibold block">{isAr ? row.habit.nameAr : row.habit.nameEn}</span>
                          <span className="text-[9px] text-[var(--foreground)]">{isAr ? (CATEGORY_LABELS[row.habit.category]?.ar ?? row.habit.category) : (CATEGORY_LABELS[row.habit.category]?.en ?? row.habit.category)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-sm font-bold">{row.completions}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-sm font-medium text-[var(--foreground)]">{row.totalMinutes > 0 ? fmtTime(row.totalMinutes) : '—'}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-sm font-bold text-orange-500">{row.streak}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-sm font-bold text-amber-500">{row.bestStreak}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={cn(
                        'text-xs font-bold px-2 py-0.5 rounded-full',
                        row.rate >= 80 ? 'text-emerald-500 bg-emerald-500/10' :
                        row.rate >= 50 ? 'text-amber-500 bg-amber-500/10' :
                        'text-red-400 bg-red-500/10'
                      )}>{row.rate}%</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-[11px] text-[var(--foreground)]">
                        {row.lastDate ? new Date(row.lastDate).toLocaleDateString(isAr ? 'ar-SA-u-nu-latn' : 'en-US', { month: 'short', day: 'numeric' }) : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Category Breakdown */}
      {(() => {
        const usedCategories = [...new Set(activeHabits.map(h => h.category))];
        const categoryData = usedCategories.map(cat => {
          const catHabits = activeHabits.filter(h => h.category === cat);
          const catLogs = allLogs.filter(l => catHabits.some(h => h.id === l.habitId));
          const catAllLogs = allHabitLogs.filter(l => catHabits.some(h => h.id === l.habitId));
          const totalMins = catAllLogs.reduce((s, l) => s + (l.duration ?? 0), 0);
          const avgRate = catHabits.length > 0
            ? Math.round(catHabits.reduce((s, h) => s + store.getHabitStats(h.id).completionRate, 0) / catHabits.length)
            : 0;
          return { category: cat, count: catHabits.length, completions: catLogs.length, minutes: totalMins, avgRate };
        }).sort((a, b) => b.avgRate - a.avgRate);
        const maxRate = Math.max(...categoryData.map(c => c.avgRate), 1);

        return categoryData.length > 0 ? (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={11} className="app-card rounded-2xl p-5">
            <h3 className="text-sm font-bold mb-4">{isAr ? 'الأداء حسب الفئة' : 'Performance by Category'}</h3>
            <div className="space-y-2.5">
              {categoryData.map((c, i) => (
                <div key={c.category} className="flex items-center gap-3">
                  <span className="text-[10px] font-semibold text-[var(--foreground)] w-20 truncate text-end">
                    {isAr ? (CATEGORY_LABELS[c.category]?.ar ?? c.category) : (CATEGORY_LABELS[c.category]?.en ?? c.category)}
                  </span>
                  <div className="flex-1 h-5 rounded-full bg-[var(--foreground)]/[0.05] overflow-hidden relative">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${(c.avgRate / maxRate) * 100}%`, background: i === 0 ? '#22c55e' : i === categoryData.length - 1 ? '#ef4444' : '#3b82f6' }} />
                    <span className="absolute inset-y-0 end-2 flex items-center text-[9px] font-bold text-[var(--foreground)]">
                      {c.avgRate}%
                    </span>
                  </div>
                  <span className="text-[9px] text-[var(--foreground)] w-8 text-end">{c.count}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ) : null;
      })()}

      {/* Day-of-Week Analysis */}
      {(() => {
        const dayCompletions = Array(7).fill(0);
        const dayTotal = Array(7).fill(0);
        const now = new Date();
        // Last 90 days
        for (let i = 0; i < 90; i++) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          const ds = formatLocalDate(d);
          const dow = d.getDay();
          dayTotal[dow]++;
          dayCompletions[dow] += allLogs.filter(l => l.date === ds).length;
        }
        const dayRates = dayCompletions.map((c, i) => ({
          day: i,
          label: isAr ? DAY_LABELS.ar[i] : DAY_LABELS.en[i],
          completions: c,
          total: dayTotal[i],
          avg: dayTotal[i] > 0 ? Math.round((c / dayTotal[i]) * 10) / 10 : 0,
        }));
        const maxDayAvg = Math.max(...dayRates.map(d => d.avg), 1);
        const bestDayIdx = dayRates.reduce((best, d) => d.avg > dayRates[best].avg ? d.day : best, 0);
        const worstDayIdx = dayRates.reduce((worst, d) => d.avg < dayRates[worst].avg ? d.day : worst, 0);

        return (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={12} className="app-card rounded-2xl p-5">
            <h3 className="text-sm font-bold mb-4">{isAr ? 'أنماط أيام الأسبوع (٩٠ يوم)' : 'Weekday Patterns (90 days)'}</h3>
            <div className="flex items-end gap-2 h-28">
              {dayRates.map((d, i) => {
                const pct = (d.avg / maxDayAvg) * 100;
                const isBest = i === bestDayIdx;
                const isWorst = i === worstDayIdx;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] font-bold text-[var(--foreground)]">{d.avg}</span>
                    <div className={cn('w-full rounded-t-lg transition-all relative', isBest ? 'bg-emerald-500' : isWorst ? 'bg-red-400' : 'bg-blue-400')}
                      style={{ height: `${Math.max(pct, 6)}%` }} />
                    <span className={cn('text-[9px] font-medium', isBest ? 'text-emerald-600 font-bold' : isWorst ? 'text-red-500 font-bold' : 'text-[var(--foreground)]')}>
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-[var(--foreground)] mt-3 text-center">
              {isAr
                ? `🟢 أفضل يوم: ${dayRates[bestDayIdx].label} — 🔴 أضعف يوم: ${dayRates[worstDayIdx].label}`
                : `🟢 Best: ${dayRates[bestDayIdx].label} — 🔴 Weakest: ${dayRates[worstDayIdx].label}`}
            </p>
          </motion.div>
        );
      })()}

      {/* Week-over-Week Comparison */}
      {(() => {
        const now = new Date();
        const thisWeekStart = new Date(now);
        const wd4847 = thisWeekStart.getDay(); thisWeekStart.setDate(thisWeekStart.getDate() - (wd4847 === 0 ? 6 : wd4847 - 1));
        const lastWeekStart = new Date(thisWeekStart);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        const lastWeekEnd = new Date(thisWeekStart);
        lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
        const twStr = formatLocalDate(thisWeekStart);
        const lwStr = formatLocalDate(lastWeekStart);
        const lweStr = formatLocalDate(lastWeekEnd);
        const todayStr = todayString();

        const thisWeekCount = allLogs.filter(l => l.date >= twStr && l.date <= todayStr).length;
        const thisWeekMins = allLogs.filter(l => l.date >= twStr && l.date <= todayStr).reduce((s, l) => s + (l.duration ?? 0), 0);
        const lastWeekCount = allLogs.filter(l => l.date >= lwStr && l.date <= lweStr).length;
        const lastWeekMins = allLogs.filter(l => l.date >= lwStr && l.date <= lweStr).reduce((s, l) => s + (l.duration ?? 0), 0);

        const countDiff = thisWeekCount - lastWeekCount;
        const countPct = lastWeekCount > 0 ? Math.round(((thisWeekCount - lastWeekCount) / lastWeekCount) * 100) : 0;

        return (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={13} className="app-card rounded-2xl p-5">
            <h3 className="text-sm font-bold mb-4">{isAr ? 'مقارنة الأسبوع' : 'Week over Week'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center rounded-xl bg-[var(--foreground)]/[0.03] p-3">
                <p className="text-[10px] font-semibold text-[var(--foreground)] uppercase mb-1">{isAr ? 'الأسبوع الماضي' : 'Last Week'}</p>
                <p className="text-xl font-black">{lastWeekCount}</p>
                {lastWeekMins > 0 && <p className="text-[10px] text-[var(--foreground)]">{fmtTime(lastWeekMins)}</p>}
              </div>
              <div className="text-center rounded-xl bg-[var(--foreground)]/[0.03] p-3">
                <p className="text-[10px] font-semibold text-[var(--foreground)] uppercase mb-1">{isAr ? 'هذا الأسبوع' : 'This Week'}</p>
                <p className="text-xl font-black">{thisWeekCount}</p>
                {thisWeekMins > 0 && <p className="text-[10px] text-[var(--foreground)]">{fmtTime(thisWeekMins)}</p>}
              </div>
            </div>
            {lastWeekCount > 0 && (
              <div className={cn('mt-3 text-center text-xs font-bold px-3 py-2 rounded-lg',
                countDiff > 0 ? 'bg-emerald-500/10 text-emerald-600' :
                countDiff < 0 ? 'bg-red-500/10 text-red-500' : 'bg-[var(--foreground)]/[0.05] text-[var(--foreground)]')}>
                {countDiff > 0 ? '↑' : countDiff < 0 ? '↓' : '→'} {Math.abs(countPct)}%
                {' '}{countDiff > 0 ? (isAr ? 'تحسن' : 'improvement') : countDiff < 0 ? (isAr ? 'تراجع' : 'decrease') : (isAr ? 'ثبات' : 'stable')}
              </div>
            )}
          </motion.div>
        );
      })()}
    </div>
  );
}

export default HabitsInsights;
