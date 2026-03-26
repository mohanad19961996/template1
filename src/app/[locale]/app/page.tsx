'use client';

import React, { useMemo } from 'react';
import { useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import { todayString, formatDuration } from '@/types/app';
import {
  CheckCircle2, Circle, Flame, TrendingUp, Timer, Target,
  Brain, Zap, ArrowRight, ArrowLeft, Plus, BarChart3, Star,
  Calendar, Sparkles, Award, Clock, Activity, ChevronRight,
  ListChecks, GraduationCap, Heart, Sun, Moon, Coffee,
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } }),
};

export default function DashboardPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const store = useAppStore();
  const today = todayString();

  const Arrow = isAr ? ArrowLeft : ArrowRight;

  // Compute dashboard data
  const activeHabits = useMemo(() => store.habits.filter(h => !h.archived), [store.habits]);
  const todayHabits = useMemo(() => activeHabits.filter(h => {
    if (h.frequency === 'daily') return true;
    if (h.frequency === 'weekly') {
      const dow = new Date(today).getDay();
      return h.customDays?.includes(dow as any) ?? true;
    }
    return true;
  }), [activeHabits, today]);

  const completedToday = useMemo(() =>
    todayHabits.filter(h => store.habitLogs.some(l => l.habitId === h.id && l.date === today && l.completed)),
    [todayHabits, store.habitLogs, today]
  );

  const completionRate = todayHabits.length > 0
    ? Math.round((completedToday.length / todayHabits.length) * 100) : 0;

  const totalFocusToday = useMemo(() =>
    store.skillSessions.filter(s => s.date === today).reduce((a, s) => a + s.duration, 0),
    [store.skillSessions, today]
  );

  const currentStreaks = useMemo(() =>
    activeHabits.map(h => ({ habit: h, streak: store.getHabitStreak(h.id) }))
      .filter(s => s.streak.current > 0)
      .sort((a, b) => b.streak.current - a.streak.current)
      .slice(0, 5),
    [activeHabits, store]
  );

  const longestStreak = useMemo(() =>
    activeHabits.reduce((max, h) => {
      const s = store.getHabitStreak(h.id);
      return s.best > max ? s.best : max;
    }, 0),
    [activeHabits, store]
  );

  const topSkills = useMemo(() =>
    [...store.skills].sort((a, b) => b.totalMinutes - a.totalMinutes).slice(0, 4),
    [store.skills]
  );

  const recentSessions = useMemo(() =>
    [...store.skillSessions].sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime)).slice(0, 5),
    [store.skillSessions]
  );

  const activeGoals = useMemo(() => store.goals.filter(g => !g.completed).slice(0, 3), [store.goals]);

  // Greeting
  const hour = new Date().getHours();
  const greetingEn = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const greetingAr = hour < 12 ? 'صباح الخير' : hour < 17 ? 'مساء الخير' : 'مساء الخير';
  const GreetingIcon = hour < 12 ? Sun : hour < 17 ? Coffee : Moon;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 pb-20 max-w-[1400px] mx-auto">
      {/* Header */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <GreetingIcon className="h-5 w-5 text-[var(--color-primary)]" />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {isAr ? greetingAr : greetingEn}{store.settings.displayName ? `, ${store.settings.displayName}` : ''} 👋
          </h1>
        </div>
        <p className="text-[var(--foreground)]/50 text-sm mt-1">
          {isAr
            ? `${new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`
            : `${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
        </p>
      </motion.div>

      {/* Quick Stats */}
      <motion.div initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {[
          {
            labelEn: 'Completion', labelAr: 'الإنجاز',
            value: `${completionRate}%`,
            subEn: `${completedToday.length}/${todayHabits.length} habits`,
            subAr: `${completedToday.length}/${todayHabits.length} عادة`,
            icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10',
          },
          {
            labelEn: 'Focus Time', labelAr: 'وقت التركيز',
            value: formatDuration(totalFocusToday),
            subEn: `Today's sessions`, subAr: 'جلسات اليوم',
            icon: Timer, color: 'text-blue-500', bg: 'bg-blue-500/10',
          },
          {
            labelEn: 'Active Streak', labelAr: 'سلسلة نشطة',
            value: `${currentStreaks.length > 0 ? currentStreaks[0].streak.current : 0}`,
            subEn: 'days in a row', subAr: 'أيام متتالية',
            icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10',
          },
          {
            labelEn: 'Best Streak', labelAr: 'أفضل سلسلة',
            value: `${longestStreak}`,
            subEn: 'all time record', subAr: 'الرقم القياسي',
            icon: Award, color: 'text-purple-500', bg: 'bg-purple-500/10',
          },
        ].map((stat, i) => (
          <motion.div
            key={i}
            variants={fadeUp}
            custom={i + 1}
            className="rounded-2xl border border-[var(--foreground)]/[0.06] bg-[var(--foreground)]/[0.02] p-4 sm:p-5 hover:border-[var(--foreground)]/[0.12] transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-[var(--foreground)]/40 uppercase tracking-wider">
                {isAr ? stat.labelAr : stat.labelEn}
              </span>
              <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', stat.bg)}>
                <stat.icon className={cn('h-4 w-4', stat.color)} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight">{stat.value}</p>
            <p className="text-xs text-[var(--foreground)]/40 mt-1">{isAr ? stat.subAr : stat.subEn}</p>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Today's Habits */}
        <motion.div
          initial="hidden" animate="visible" variants={fadeUp} custom={5}
          className="lg:col-span-2 space-y-6"
        >
          {/* Today's Habits */}
          <div className="rounded-2xl border border-[var(--foreground)]/[0.06] bg-[var(--foreground)]/[0.02] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[var(--foreground)]/[0.06]">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-primary)]/10">
                  <ListChecks className="h-5 w-5 text-[var(--color-primary)]" />
                </div>
                <div>
                  <h2 className="font-semibold text-sm">{isAr ? 'عادات اليوم' : "Today's Habits"}</h2>
                  <p className="text-xs text-[var(--foreground)]/40">
                    {completedToday.length}/{todayHabits.length} {isAr ? 'مكتملة' : 'completed'}
                  </p>
                </div>
              </div>
              <Link href="/app/habits" className="text-xs font-medium text-[var(--color-primary)] hover:underline flex items-center gap-1">
                {isAr ? 'عرض الكل' : 'View all'} <Arrow className="h-3 w-3" />
              </Link>
            </div>

            {todayHabits.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--foreground)]/[0.04]">
                  <Sparkles className="h-6 w-6 text-[var(--foreground)]/20" />
                </div>
                <p className="text-sm text-[var(--foreground)]/40 mb-3">
                  {isAr ? 'لا توجد عادات بعد. ابدأ رحلتك!' : 'No habits yet. Start your journey!'}
                </p>
                <Link
                  href="/app/habits"
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
                >
                  <Plus className="h-4 w-4" /> {isAr ? 'إضافة عادة' : 'Add Habit'}
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-[var(--foreground)]/[0.04]">
                {todayHabits.slice(0, 6).map((habit) => {
                  const done = store.habitLogs.some(l => l.habitId === habit.id && l.date === today && l.completed);
                  return (
                    <div
                      key={habit.id}
                      className={cn(
                        'flex items-center gap-3 px-5 py-3.5 transition-all duration-200',
                        done ? 'opacity-60' : 'hover:bg-[var(--foreground)]/[0.02]'
                      )}
                    >
                      <button
                        onClick={() => {
                          if (!done) {
                            store.logHabit({
                              habitId: habit.id,
                              date: today,
                              time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
                              note: '',
                              reminderUsed: false,
                              perceivedDifficulty: 'medium',
                              completed: true,
                            });
                          }
                        }}
                        className="shrink-0"
                      >
                        {done ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-[var(--foreground)]/20 hover:text-[var(--color-primary)] transition-colors" />
                        )}
                      </button>
                      <div
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: habit.color }}
                      />
                      <span className={cn('text-sm flex-1', done && 'line-through text-[var(--foreground)]/40')}>
                        {isAr ? habit.nameAr : habit.nameEn}
                      </span>
                      {!done && (
                        <span className={cn(
                          'text-[10px] px-2 py-0.5 rounded-full font-medium',
                          habit.priority === 'high' ? 'bg-red-500/10 text-red-500' :
                          habit.priority === 'medium' ? 'bg-amber-500/10 text-amber-500' :
                          'bg-blue-500/10 text-blue-500'
                        )}>
                          {isAr
                            ? (habit.priority === 'high' ? 'عالية' : habit.priority === 'medium' ? 'متوسطة' : 'منخفضة')
                            : habit.priority}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Completion bar */}
            {todayHabits.length > 0 && (
              <div className="px-5 py-3 border-t border-[var(--foreground)]/[0.06]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-medium text-[var(--foreground)]/40 uppercase tracking-wider">
                    {isAr ? 'التقدم' : 'Progress'}
                  </span>
                  <span className="text-xs font-bold text-[var(--color-primary)]">{completionRate}%</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--foreground)]/[0.06] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${completionRate}%` }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] as const, delay: 0.3 }}
                    className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary)]/60"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Recent Sessions */}
          <div className="rounded-2xl border border-[var(--foreground)]/[0.06] bg-[var(--foreground)]/[0.02] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[var(--foreground)]/[0.06]">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10">
                  <Clock className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h2 className="font-semibold text-sm">{isAr ? 'الجلسات الأخيرة' : 'Recent Sessions'}</h2>
                  <p className="text-xs text-[var(--foreground)]/40">
                    {isAr ? 'آخر جلسات المهارات' : 'Latest skill sessions'}
                  </p>
                </div>
              </div>
              <Link href="/app/skills" className="text-xs font-medium text-[var(--color-primary)] hover:underline flex items-center gap-1">
                {isAr ? 'عرض الكل' : 'View all'} <Arrow className="h-3 w-3" />
              </Link>
            </div>

            {recentSessions.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--foreground)]/[0.04]">
                  <GraduationCap className="h-6 w-6 text-[var(--foreground)]/20" />
                </div>
                <p className="text-sm text-[var(--foreground)]/40 mb-3">
                  {isAr ? 'لا توجد جلسات بعد. ابدأ التعلم!' : 'No sessions yet. Start learning!'}
                </p>
                <Link
                  href="/app/skills"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
                >
                  <Plus className="h-4 w-4" /> {isAr ? 'إضافة مهارة' : 'Add Skill'}
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-[var(--foreground)]/[0.04]">
                {recentSessions.map((session) => {
                  const skill = store.skills.find(s => s.id === session.skillId);
                  return (
                    <div key={session.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-[var(--foreground)]/[0.02] transition-all">
                      <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${skill?.color ?? '#3B82F6'}20` }}>
                        <GraduationCap className="h-4 w-4" style={{ color: skill?.color ?? '#3B82F6' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{isAr ? skill?.nameAr : skill?.nameEn}</p>
                        <p className="text-xs text-[var(--foreground)]/40">{session.date} · {session.startTime}</p>
                      </div>
                      <div className="text-end">
                        <p className="text-sm font-semibold">{formatDuration(session.duration)}</p>
                        <div className="flex items-center gap-0.5 justify-end">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={cn('h-2.5 w-2.5', i < session.qualityRating ? 'text-amber-400 fill-amber-400' : 'text-[var(--foreground)]/10')} />
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Right Column */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={6} className="space-y-6">
          {/* Quick Actions */}
          <div className="rounded-2xl border border-[var(--foreground)]/[0.06] bg-[var(--foreground)]/[0.02] p-5">
            <h3 className="font-semibold text-sm mb-4">{isAr ? 'إجراءات سريعة' : 'Quick Actions'}</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { href: '/app/habits', labelEn: 'New Habit', labelAr: 'عادة جديدة', icon: ListChecks, color: 'text-emerald-500 bg-emerald-500/10' },
                { href: '/app/skills', labelEn: 'New Skill', labelAr: 'مهارة جديدة', icon: GraduationCap, color: 'text-blue-500 bg-blue-500/10' },
                { href: '/app/timers', labelEn: 'Start Timer', labelAr: 'بدء مؤقت', icon: Timer, color: 'text-purple-500 bg-purple-500/10' },
                { href: '/app/goals', labelEn: 'New Goal', labelAr: 'هدف جديد', icon: Target, color: 'text-orange-500 bg-orange-500/10' },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex flex-col items-center gap-2 rounded-xl border border-[var(--foreground)]/[0.06] p-3 hover:border-[var(--foreground)]/[0.12] hover:bg-[var(--foreground)]/[0.02] transition-all duration-200"
                >
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', action.color.split(' ')[1])}>
                    <action.icon className={cn('h-5 w-5', action.color.split(' ')[0])} />
                  </div>
                  <span className="text-xs font-medium text-center">{isAr ? action.labelAr : action.labelEn}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Active Streaks */}
          <div className="rounded-2xl border border-[var(--foreground)]/[0.06] bg-[var(--foreground)]/[0.02] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">{isAr ? 'السلاسل النشطة' : 'Active Streaks'}</h3>
              <Flame className="h-4 w-4 text-orange-500" />
            </div>
            {currentStreaks.length === 0 ? (
              <p className="text-xs text-[var(--foreground)]/40 text-center py-4">
                {isAr ? 'ابدأ بإكمال عاداتك لبناء سلاسل!' : 'Complete habits to build streaks!'}
              </p>
            ) : (
              <div className="space-y-3">
                {currentStreaks.map(({ habit, streak }) => (
                  <div key={habit.id} className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: habit.color }} />
                    <span className="text-xs flex-1 truncate">{isAr ? habit.nameAr : habit.nameEn}</span>
                    <div className="flex items-center gap-1">
                      <Flame className="h-3 w-3 text-orange-400" />
                      <span className="text-xs font-bold">{streak.current}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Skills */}
          <div className="rounded-2xl border border-[var(--foreground)]/[0.06] bg-[var(--foreground)]/[0.02] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">{isAr ? 'أفضل المهارات' : 'Top Skills'}</h3>
              <TrendingUp className="h-4 w-4 text-[var(--color-primary)]" />
            </div>
            {topSkills.length === 0 ? (
              <p className="text-xs text-[var(--foreground)]/40 text-center py-4">
                {isAr ? 'أضف مهاراتك وابدأ التتبع!' : 'Add skills and start tracking!'}
              </p>
            ) : (
              <div className="space-y-3">
                {topSkills.map((skill) => (
                  <div key={skill.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium truncate">{isAr ? skill.nameAr : skill.nameEn}</span>
                      <span className="text-[10px] text-[var(--foreground)]/40">{formatDuration(skill.totalMinutes)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--foreground)]/[0.06] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${skill.currentLevel}%`,
                          backgroundColor: skill.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Goals */}
          <div className="rounded-2xl border border-[var(--foreground)]/[0.06] bg-[var(--foreground)]/[0.02] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">{isAr ? 'الأهداف النشطة' : 'Active Goals'}</h3>
              <Target className="h-4 w-4 text-emerald-500" />
            </div>
            {activeGoals.length === 0 ? (
              <p className="text-xs text-[var(--foreground)]/40 text-center py-4">
                {isAr ? 'حدد أهدافك وحققها!' : 'Set your goals and achieve them!'}
              </p>
            ) : (
              <div className="space-y-3">
                {activeGoals.map((goal) => (
                  <div key={goal.id} className="flex items-center gap-3">
                    <div className="relative h-8 w-8 shrink-0">
                      <svg className="h-8 w-8 -rotate-90" viewBox="0 0 32 32">
                        <circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" strokeWidth="3" className="text-[var(--foreground)]/[0.06]" />
                        <circle cx="16" cy="16" r="12" fill="none" stroke={goal.color} strokeWidth="3"
                          strokeDasharray={`${goal.progress * 0.754} 75.4`} strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold">{goal.progress}%</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{isAr ? goal.titleAr : goal.titleEn}</p>
                      <p className="text-[10px] text-[var(--foreground)]/40">
                        {goal.milestones.filter(m => m.completed).length}/{goal.milestones.length} {isAr ? 'مراحل' : 'milestones'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Motivational Card */}
          <div className="rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary)]/70 p-5 text-white">
            <Sparkles className="h-6 w-6 mb-3 opacity-80" />
            <p className="text-sm font-semibold mb-1">
              {isAr ? 'استمر في التقدم!' : 'Keep Growing!'}
            </p>
            <p className="text-xs opacity-80 leading-relaxed">
              {isAr
                ? 'كل يوم هو فرصة جديدة لبناء عادات أفضل وتطوير مهاراتك. التقدم الصغير يصنع فرقاً كبيراً.'
                : 'Every day is a new opportunity to build better habits and develop your skills. Small progress makes a big difference.'}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
