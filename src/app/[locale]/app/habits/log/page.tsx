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
  Target, TrendingUp, BarChart3, ChevronDown, Filter,
} from 'lucide-react';

const DAY_NAMES_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES_AR = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

function fmtDate(date: string) {
  const [y, m, d] = date.split('-');
  return `${d}/${m}/${y}`;
}

function fmtDateShort(date: string) {
  const [y, m, d] = date.split('-');
  return `${d}/${m}`;
}

export default function HabitsLogPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const store = useAppStore();
  const today = todayString();
  const [filterHabitId, setFilterHabitId] = useState<string>('all');
  const [daysBack, setDaysBack] = useState(30);

  const allHabits = store.habits;

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

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, '0');
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m} ${period}`;
  };
  const formatDur = (secs: number) => { const m = Math.floor(secs / 60); return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`; };

  const getDayName = (date: string) => {
    const d = new Date(date);
    return isAr ? DAY_NAMES_AR[d.getDay()] : DAY_NAMES_EN[d.getDay()];
  };

  const getYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };
  const yesterday = getYesterday();

  const getDateLabel = (date: string) => {
    if (date === today) return isAr ? 'اليوم' : 'Today';
    if (date === yesterday) return isAr ? 'أمس' : 'Yesterday';
    return getDayName(date);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 pb-20 max-w-[1000px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/app/habits" className="inline-flex items-center gap-1.5 text-sm font-bold mb-4 transition-all duration-300 hover:gap-2.5 group" style={{ color: 'var(--color-primary)' }}>
          <ChevronLeft className={cn('h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5', isAr && 'rotate-180 group-hover:translate-x-0.5')} />
          {isAr ? 'العادات' : 'Habits'}
        </Link>
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.6))', boxShadow: '0 8px 24px rgba(var(--color-primary-rgb) / 0.25)' }}>
            <CalendarIcon className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight"
              style={{ background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.5))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {isAr ? 'سجل العادات' : 'History'}
            </h1>
            <p className="text-sm font-medium text-[var(--foreground)]/50">{isAr ? 'سجل إنجازاتك اليومية' : 'Your daily accomplishments log'}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Habit filter dropdown */}
        <div className="relative group/hf">
          <button className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-all duration-300 cursor-pointer group-hover/hf:shadow-[0_4px_16px_rgba(var(--color-primary-rgb)/0.1)]"
            style={{ borderColor: filterHabitId !== 'all' ? 'rgba(var(--color-primary-rgb) / 0.3)' : 'rgba(var(--color-primary-rgb) / 0.12)', background: filterHabitId !== 'all' ? 'rgba(var(--color-primary-rgb) / 0.06)' : 'transparent', color: filterHabitId !== 'all' ? 'var(--color-primary)' : 'var(--foreground)' }}>
            <Filter className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
            {filterHabitId === 'all' ? (isAr ? 'كل العادات' : 'All Habits') : (isAr ? (allHabits.find(h => h.id === filterHabitId)?.nameAr ?? '') : (allHabits.find(h => h.id === filterHabitId)?.nameEn ?? ''))}
            <ChevronDown className="h-3.5 w-3.5 transition-transform duration-300 group-hover/hf:rotate-180" style={{ color: 'rgba(var(--color-primary-rgb) / 0.5)' }} />
          </button>
          <div className="absolute top-full pt-1.5 start-0 z-50 w-60 max-h-[360px] opacity-0 invisible group-hover/hf:opacity-100 group-hover/hf:visible transition-all duration-200 translate-y-1 group-hover/hf:translate-y-0">
            <div className="rounded-xl overflow-hidden shadow-xl" style={{ background: 'var(--color-background)', border: '1px solid rgba(var(--color-primary-rgb) / 0.12)' }}>
              <div className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg, transparent, var(--color-primary), transparent)' }} />
              <div className="py-1.5 max-h-[340px] overflow-y-auto">
                <button onClick={() => setFilterHabitId('all')}
                  className={cn('w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-bold transition-all duration-200', filterHabitId === 'all' ? 'text-white' : 'text-[var(--foreground)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/[0.06]')}
                  style={filterHabitId === 'all' ? { background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.8))' } : undefined}>
                  {isAr ? 'كل العادات' : 'All Habits'}
                  {filterHabitId === 'all' && <CheckCircle2 className="h-3.5 w-3.5 ms-auto" />}
                </button>
                {allHabits.map(h => {
                  const hc = resolveHabitColor(h.color);
                  return (
                    <button key={h.id} onClick={() => setFilterHabitId(h.id)}
                      className={cn('w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-bold transition-all duration-200', filterHabitId === h.id ? 'text-white' : 'text-[var(--foreground)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/[0.06]')}
                      style={filterHabitId === h.id ? { background: `linear-gradient(135deg, ${hc}, ${hc}cc)` } : undefined}>
                      <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: filterHabitId === h.id ? 'white' : hc }} />
                      <span className="truncate">{isAr ? h.nameAr : h.nameEn}</span>
                      {h.archived && <span className="text-[10px] opacity-50 shrink-0">({isAr ? 'مؤرشفة' : 'archived'})</span>}
                      {filterHabitId === h.id && <CheckCircle2 className="h-3.5 w-3.5 ms-auto shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Days range */}
        <div className="flex items-center gap-1 rounded-xl border p-1" style={{ borderColor: 'rgba(var(--color-primary-rgb) / 0.12)' }}>
          {[7, 30, 90, 365].map(d => (
            <button key={d} onClick={() => setDaysBack(d)}
              className={cn('px-3.5 py-1.5 rounded-lg text-xs font-black transition-all duration-300 cursor-pointer',
                daysBack === d ? 'text-white shadow-sm' : 'text-[var(--foreground)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/[0.06]')}
              style={daysBack === d ? { background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.8))' } : undefined}>
              {d === 365 ? (isAr ? 'سنة' : '1Y') : d === 90 ? '3M' : `${d}D`}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: isAr ? 'إنجازات' : 'Completions', value: totalCompletions, icon: CheckCircle2 },
          { label: isAr ? 'أيام نشطة' : 'Active Days', value: dayData.length, icon: CalendarIcon },
          { label: isAr ? 'جلسات' : 'Sessions', value: totalSessions, icon: Timer },
        ].map((s, i) => (
          <motion.div key={i} whileHover={{ scale: 1.02, y: -3 }}
            className="rounded-2xl p-5 text-center border transition-all duration-300 cursor-default hover:shadow-[0_8px_30px_rgba(var(--color-primary-rgb)/0.12)]"
            style={{ background: 'rgba(var(--color-primary-rgb) / 0.03)', borderColor: 'rgba(var(--color-primary-rgb) / 0.12)' }}>
            <div className="h-10 w-10 rounded-xl mx-auto mb-2.5 flex items-center justify-center" style={{ background: 'rgba(var(--color-primary-rgb) / 0.08)', border: '1px solid rgba(var(--color-primary-rgb) / 0.1)' }}>
              <s.icon className="h-5 w-5" style={{ color: 'var(--color-primary)' }} />
            </div>
            <p className="text-3xl font-black tracking-tight" style={{ color: 'var(--color-primary)' }}>{s.value}</p>
            <p className="text-xs font-bold text-[var(--foreground)]/60 mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        {dayData.map(({ date, logs, sessions }, dayIdx) => {
          const isToday = date === today;
          const isYesterday = date === yesterday;
          const dayLabel = getDateLabel(date);
          const completedCount = logs.filter(l => l.log.completed).length;
          const totalCount = logs.length;

          return (
            <motion.div key={date}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: dayIdx * 0.03, duration: 0.3 }}
              className="rounded-2xl overflow-hidden transition-all duration-300"
              style={{ border: `1.5px solid ${isToday ? 'rgba(var(--color-primary-rgb) / 0.25)' : 'rgba(var(--color-primary-rgb) / 0.08)'}` }}>

              {/* Date header */}
              <div className="flex items-center justify-between px-4 sm:px-5 py-3.5"
                style={{ background: isToday ? 'rgba(var(--color-primary-rgb) / 0.06)' : 'rgba(var(--color-primary-rgb) / 0.02)' }}>
                <div className="flex items-center gap-3">
                  {/* Date number badge */}
                  <div className="h-12 w-12 rounded-xl flex flex-col items-center justify-center shrink-0"
                    style={isToday
                      ? { background: 'linear-gradient(135deg, var(--color-primary), rgba(var(--color-primary-rgb) / 0.8))', boxShadow: '0 4px 14px rgba(var(--color-primary-rgb) / 0.3)' }
                      : { background: 'rgba(var(--color-primary-rgb) / 0.06)', border: '1px solid rgba(var(--color-primary-rgb) / 0.1)' }}>
                    <span className={cn('text-lg font-black leading-none', isToday ? 'text-white' : '')} style={!isToday ? { color: 'var(--color-primary)' } : undefined}>
                      {date.split('-')[2]}
                    </span>
                    <span className={cn('text-[9px] font-bold leading-none mt-0.5', isToday ? 'text-white/70' : 'text-[var(--foreground)]/40')}>
                      {date.split('-')[1]}/{date.split('-')[0].slice(2)}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black">{dayLabel}</p>
                      {isToday && <span className="text-[9px] font-black px-2 py-0.5 rounded-full text-white" style={{ background: 'var(--color-primary)' }}>{isAr ? 'اليوم' : 'TODAY'}</span>}
                      {isYesterday && !isToday && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(var(--color-primary-rgb) / 0.1)', color: 'var(--color-primary)' }}>{isAr ? 'أمس' : 'Yesterday'}</span>}
                    </div>
                    <p className="text-[11px] font-semibold text-[var(--foreground)]/40 mt-0.5" dir="ltr">{fmtDate(date)}</p>
                  </div>
                </div>
                {/* Right side stats */}
                <div className="flex items-center gap-2">
                  {sessions.length > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg" style={{ background: 'rgba(var(--color-primary-rgb) / 0.06)', color: 'var(--color-primary)' }}>
                      <Timer className="h-3 w-3" /> {sessions.length}
                    </span>
                  )}
                  <span className={cn('flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-lg',
                    completedCount === totalCount && completedCount > 0 ? 'bg-emerald-500/10 text-emerald-600' : 'text-[var(--foreground)]/50')}
                    style={completedCount > 0 && completedCount < totalCount ? { background: 'rgba(var(--color-primary-rgb) / 0.08)', color: 'var(--color-primary)' } : undefined}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {completedCount}/{totalCount}
                  </span>
                </div>
              </div>

              {/* Logs */}
              <div>
                {logs.map(({ habit, log }, logIdx) => {
                  const hc = resolveHabitColor(habit.color);
                  const isCompleted = log.completed;
                  return (
                    <Link key={log.id} href={`/app/habits/${habit.id}`}
                      className="flex items-center gap-3.5 px-4 sm:px-5 py-3 transition-all duration-200 group"
                      style={{ borderTop: logIdx > 0 || sessions.length > 0 ? '1px solid rgba(var(--color-primary-rgb) / 0.04)' : undefined }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = `${hc}06`; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                      {/* Color accent + status */}
                      <div className="relative shrink-0">
                        <div className="h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-300"
                          style={{ background: isCompleted ? `${hc}15` : 'rgba(var(--color-primary-rgb) / 0.04)', border: `1.5px solid ${isCompleted ? `${hc}30` : 'rgba(var(--color-primary-rgb) / 0.08)'}` }}>
                          {isCompleted
                            ? <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                            : <Circle className="h-4.5 w-4.5 text-[var(--foreground)]/20" />}
                        </div>
                        {/* Color dot */}
                        <div className="absolute -top-0.5 -end-0.5 h-3 w-3 rounded-full border-2" style={{ background: hc, borderColor: 'var(--color-background)' }} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm font-bold transition-colors duration-200 group-hover:text-[var(--color-primary)]', !isCompleted && 'text-[var(--foreground)]/60')}>{isAr ? habit.nameAr : habit.nameEn}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {log.time && (
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-[var(--foreground)]/40" dir="ltr">
                              <Clock className="h-3 w-3" />{log.time}
                            </span>
                          )}
                          {log.duration && log.duration > 0 && (
                            <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: `${hc}10`, color: hc }}>
                              {log.duration}m
                            </span>
                          )}
                          {log.value !== undefined && log.value > 0 && (
                            <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: `${hc}10`, color: hc }}>
                              {log.value} {habit.targetUnit || ''}
                            </span>
                          )}
                          {log.status && log.status !== 'completed' && log.status !== 'pending' && (
                            <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-md',
                              log.status === 'partial' ? 'bg-amber-500/10 text-amber-600' :
                              log.status === 'skipped' ? 'bg-blue-500/10 text-blue-500' :
                              log.status === 'missed' ? 'bg-red-500/10 text-red-500' : '')}>
                              {log.status}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Arrow */}
                      <ArrowRight className={cn('h-4 w-4 shrink-0 text-[var(--foreground)]/15 group-hover:text-[var(--color-primary)] transition-all duration-300 group-hover:translate-x-0.5', isAr && 'rotate-180 group-hover:-translate-x-0.5')} />
                    </Link>
                  );
                })}

                {/* Timer sessions */}
                {sessions.map((session, si) => {
                  const habit = allHabits.find(h => h.id === session.habitId);
                  if (!habit) return null;
                  const hc = resolveHabitColor(habit.color);
                  return (
                    <Link key={session.id} href={`/app/habits/${habit.id}`}
                      className="block px-4 sm:px-5 py-3 transition-all duration-200 group"
                      style={{ borderTop: logs.length > 0 || si > 0 ? '1px solid rgba(var(--color-primary-rgb) / 0.04)' : undefined }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = `${hc}06`; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                      <div className="flex items-center gap-3.5">
                        <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: `${hc}12`, border: `1.5px solid ${hc}25` }}>
                          <Timer className="h-4 w-4" style={{ color: hc }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold transition-colors duration-200 group-hover:text-[var(--color-primary)]">{isAr ? habit.nameAr : habit.nameEn}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] font-black" style={{ color: hc }}>{formatDur(session.duration)}</span>
                            {session.completed
                              ? <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5"><CheckCircle2 className="h-3 w-3" /> {isAr ? 'مكتمل' : 'Done'}</span>
                              : <span className="text-[10px] font-bold text-red-400 flex items-center gap-0.5"><X className="h-3 w-3" /> {isAr ? 'ملغى' : 'Cancelled'}</span>}
                          </div>
                        </div>
                        <ArrowRight className={cn('h-4 w-4 shrink-0 text-[var(--foreground)]/15 group-hover:text-[var(--color-primary)] transition-all duration-300 group-hover:translate-x-0.5', isAr && 'rotate-180 group-hover:-translate-x-0.5')} />
                      </div>
                      {/* Session events */}
                      {session.events && session.events.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap mt-2 ms-[3.25rem]">
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
                              {evt.action} <span dir="ltr">{formatTime(evt.at)}</span>
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
          <div className="text-center py-20">
            <div className="h-16 w-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(var(--color-primary-rgb) / 0.06)' }}>
              <CalendarIcon className="h-8 w-8" style={{ color: 'rgba(var(--color-primary-rgb) / 0.25)' }} />
            </div>
            <p className="text-base font-black text-[var(--foreground)]/60">{isAr ? 'لا توجد سجلات بعد' : 'No history yet'}</p>
            <p className="text-sm text-[var(--foreground)]/40 mt-1.5">{isAr ? 'ابدأ بإنجاز عاداتك وسيظهر كل شيء هنا' : 'Complete your habits and everything appears here'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
