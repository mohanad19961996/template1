'use client';

import React, { useState, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Link } from '@/i18n/navigation';
import { useAppStore } from '@/stores/app-store';
import { Habit, HabitLog, todayString, resolveHabitColor } from '@/types/app';
import {
  ChevronLeft, CheckCircle2, Circle, Clock, Flame, ArrowRight,
  Timer, Calendar as CalendarIcon, X, Play, Pause, Square, Sparkles,
  Target, TrendingUp, BarChart3,
} from 'lucide-react';

export default function HabitsLogPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const store = useAppStore();
  const today = todayString();
  const [filterHabitId, setFilterHabitId] = useState<string>('all');
  const [daysBack, setDaysBack] = useState(30);

  const allHabits = store.habits;
  const activeHabits = allHabits.filter(h => !h.archived);

  // Build date range
  const dates = useMemo(() => {
    const result: string[] = [];
    for (let i = 0; i < daysBack; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      result.push(d.toISOString().split('T')[0]);
    }
    return result;
  }, [daysBack]);

  // Group all events by date
  const dayData = useMemo(() => {
    return dates.map(date => {
      const habits = filterHabitId === 'all' ? allHabits : allHabits.filter(h => h.id === filterHabitId);
      const logs: { habit: Habit; log: HabitLog }[] = [];
      habits.forEach(habit => {
        store.habitLogs.filter(l => l.habitId === habit.id && l.date === date).forEach(log => {
          logs.push({ habit, log });
        });
      });
      const sessions = store.timerSessions.filter(s => {
        if (s.type !== 'habit-linked') return false;
        if (filterHabitId !== 'all' && s.habitId !== filterHabitId) return false;
        return s.startedAt.split('T')[0] === date;
      });
      return { date, logs, sessions };
    }).filter(d => d.logs.length > 0 || d.sessions.length > 0);
  }, [dates, store.habitLogs, store.timerSessions, allHabits, filterHabitId]);

  const totalCompletions = dayData.reduce((s, d) => s + d.logs.filter(l => l.log.completed).length, 0);
  const totalSessions = dayData.reduce((s, d) => s + d.sessions.length, 0);

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const formatDur = (secs: number) => { const m = Math.floor(secs / 60); return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`; };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 pb-20 max-w-[1000px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/app/habits" className="inline-flex items-center gap-1.5 text-sm font-bold mb-3 transition-colors hover:underline" style={{ color: 'var(--color-primary)' }}>
          <ChevronLeft className={cn('h-4 w-4', isAr && 'rotate-180')} />
          {isAr ? 'العادات' : 'Habits'}
        </Link>
        <div className="flex items-center gap-4">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
            className="h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.6))', boxShadow: '0 8px 24px rgba(var(--color-primary-rgb) / 0.25)' }}>
            <CalendarIcon className="h-7 w-7 text-white" />
          </motion.div>
          <div>
            <h1 className="text-3xl font-black tracking-tight"
              style={{ background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.5))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {isAr ? 'سجل العادات' : 'Habits History'}
            </h1>
            <p className="text-sm font-bold text-[var(--foreground)]/70">{isAr ? 'كل ما حدث — مسجل هنا بالتواريخ' : 'Everything that happened — recorded with dates'}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select value={filterHabitId} onChange={e => setFilterHabitId(e.target.value)}
          className="rounded-xl border border-[var(--foreground)]/[0.12] bg-transparent px-4 py-2.5 text-sm font-bold text-[var(--foreground)] hover:bg-[var(--foreground)]/[0.05] transition-all cursor-pointer">
          <option value="all">{isAr ? 'كل العادات' : 'All Habits'}</option>
          {allHabits.map(h => (
            <option key={h.id} value={h.id}>{isAr ? h.nameAr : h.nameEn} {h.archived ? `(${isAr ? 'مؤرشفة' : 'archived'})` : ''}</option>
          ))}
        </select>
        <div className="flex items-center gap-1 rounded-xl border border-[var(--foreground)]/[0.12] p-1">
          {[7, 30, 90, 365].map(d => (
            <button key={d} onClick={() => setDaysBack(d)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                daysBack === d ? 'text-white' : 'text-[var(--foreground)] hover:bg-[var(--foreground)]/[0.06]')}
              style={daysBack === d ? { background: 'var(--color-primary)' } : undefined}>
              {d === 365 ? (isAr ? 'سنة' : 'Year') : `${d} ${isAr ? 'يوم' : 'd'}`}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: isAr ? 'إنجازات' : 'Completions', value: totalCompletions, icon: CheckCircle2, color: 'emerald' },
          { label: isAr ? 'أيام نشطة' : 'Active Days', value: dayData.length, icon: CalendarIcon, color: 'blue' },
          { label: isAr ? 'جلسات مؤقت' : 'Timer Sessions', value: totalSessions, icon: Timer, color: 'violet' },
        ].map((s, i) => (
          <motion.div key={i} whileHover={{ scale: 1.02, y: -2 }}
            className={cn('rounded-2xl p-5 text-center border transition-shadow hover:shadow-lg')}
            style={{ background: `rgba(var(--color-primary-rgb) / 0.04)`, borderColor: `rgba(var(--color-primary-rgb) / 0.12)` }}>
            <s.icon className="h-5 w-5 mx-auto mb-2" style={{ color: 'var(--color-primary)' }} />
            <p className="text-3xl font-black" style={{ color: 'var(--color-primary)' }}>{s.value}</p>
            <p className="text-xs font-bold text-[var(--foreground)]/70 mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {dayData.map(({ date, logs, sessions }) => {
          const dateObj = new Date(date);
          const isToday = date === today;
          const dayName = dateObj.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { weekday: 'long' });
          const dateLabel = dateObj.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' });

          return (
            <motion.div key={date}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border overflow-hidden"
              style={{ borderColor: isToday ? `rgba(var(--color-primary-rgb) / 0.3)` : `rgba(var(--color-primary-rgb) / 0.08)` }}>

              {/* Date header */}
              <div className="flex items-center justify-between px-5 py-4"
                style={{ background: isToday ? `rgba(var(--color-primary-rgb) / 0.08)` : `rgba(var(--color-primary-rgb) / 0.03)` }}>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center"
                    style={{ background: isToday ? 'var(--color-primary)' : `rgba(var(--color-primary-rgb) / 0.1)` }}>
                    <CalendarIcon className={cn('h-5 w-5', isToday ? 'text-white' : '')} style={!isToday ? { color: 'var(--color-primary)' } : undefined} />
                  </div>
                  <div>
                    <p className="text-sm font-black">{dayName}</p>
                    <p className="text-xs font-bold text-[var(--foreground)]/60">{dateLabel}</p>
                  </div>
                  {isToday && <span className="text-[10px] font-black px-2.5 py-1 rounded-full text-white" style={{ background: 'var(--color-primary)' }}>{isAr ? 'اليوم' : 'Today'}</span>}
                </div>
                <div className="flex items-center gap-3 text-sm font-bold">
                  <span className="text-emerald-600">{logs.filter(l => l.log.completed).length} {isAr ? 'إنجاز' : 'done'}</span>
                  {sessions.length > 0 && <span className="text-[var(--foreground)]/50">{sessions.length} {isAr ? 'جلسة' : 'session'}</span>}
                </div>
              </div>

              {/* Logs */}
              <div className="divide-y divide-[var(--foreground)]/[0.06]">
                {logs.map(({ habit, log }) => {
                  const hc = resolveHabitColor(habit.color);
                  return (
                    <Link key={log.id} href={`/app/habits/${habit.id}`}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-[var(--foreground)]/[0.03] transition-colors group">
                      <div className="h-4 w-4 rounded-full shrink-0" style={{ background: hc }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold group-hover:underline">{isAr ? habit.nameAr : habit.nameEn}</p>
                        <div className="flex items-center gap-2.5 text-xs font-semibold text-[var(--foreground)]/60 mt-0.5">
                          {log.time && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{log.time}</span>}
                          {log.duration && log.duration > 0 && <span>{log.duration}m</span>}
                          {log.value !== undefined && log.value > 0 && <span>{log.value} {habit.targetUnit || ''}</span>}
                          {log.source && log.source !== 'manual' && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[var(--foreground)]/[0.06]">{log.source}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {log.status && log.status !== 'completed' && log.status !== 'pending' && (
                          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full',
                            log.status === 'partial' ? 'bg-amber-500/10 text-amber-600' :
                            log.status === 'skipped' ? 'bg-blue-500/10 text-blue-500' :
                            log.status === 'missed' ? 'bg-red-500/10 text-red-500' : '')}>
                            {log.status}
                          </span>
                        )}
                        {log.completed ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Circle className="h-5 w-5 text-[var(--foreground)]/20" />}
                        <ArrowRight className={cn('h-4 w-4 text-[var(--foreground)]/30 group-hover:text-[var(--color-primary)] transition-colors', isAr && 'rotate-180')} />
                      </div>
                    </Link>
                  );
                })}

                {/* Timer sessions */}
                {sessions.map(session => {
                  const habit = allHabits.find(h => h.id === session.habitId);
                  if (!habit) return null;
                  const hc = resolveHabitColor(habit.color);
                  return (
                    <Link key={session.id} href={`/app/habits/${habit.id}`}
                      className="block px-5 py-3.5 hover:bg-[var(--foreground)]/[0.03] transition-colors group">
                      <div className="flex items-center gap-4 mb-2">
                        <Timer className="h-4 w-4 shrink-0" style={{ color: hc }} />
                        <p className="text-sm font-bold flex-1 group-hover:underline">{isAr ? habit.nameAr : habit.nameEn}</p>
                        <span className="text-sm font-black" style={{ color: hc }}>{formatDur(session.duration)}</span>
                        {session.completed ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <X className="h-4 w-4 text-red-400" />}
                        <ArrowRight className={cn('h-4 w-4 text-[var(--foreground)]/30 group-hover:text-[var(--color-primary)] transition-colors', isAr && 'rotate-180')} />
                      </div>
                      {session.events && session.events.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap ms-8">
                          {session.events.map((evt, ei) => (
                            <span key={ei} className={cn('text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1',
                              evt.action === 'start' || evt.action === 'finish' ? 'bg-emerald-500/10 text-emerald-600' :
                              evt.action === 'pause' ? 'bg-amber-500/10 text-amber-600' :
                              evt.action === 'resume' ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500')}>
                              {evt.action === 'start' && <Play className="h-2.5 w-2.5" />}
                              {evt.action === 'pause' && <Pause className="h-2.5 w-2.5" />}
                              {evt.action === 'resume' && <Play className="h-2.5 w-2.5" />}
                              {evt.action === 'finish' && <Square className="h-2.5 w-2.5" />}
                              {evt.action === 'cancel' && <X className="h-2.5 w-2.5" />}
                              {evt.action} {formatTime(evt.at)}
                            </span>
                          ))}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          );
        })}

        {dayData.length === 0 && (
          <div className="text-center py-16">
            <CalendarIcon className="h-12 w-12 mx-auto mb-3" style={{ color: 'rgba(var(--color-primary-rgb) / 0.2)' }} />
            <p className="text-base font-bold text-[var(--foreground)]/70">{isAr ? 'لا توجد سجلات بعد' : 'No history yet'}</p>
            <p className="text-sm text-[var(--foreground)]/50 mt-1">{isAr ? 'ابدأ بإنجاز عاداتك وسيظهر كل شيء هنا' : 'Start completing habits and everything appears here'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
