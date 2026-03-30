'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import { Urgency, WeekDay } from '@/types/app';
import {
  Bell, Plus, X, Trash2, Edit3, Clock, Calendar,
  BellOff, BellRing, AlertCircle, CheckCircle2,
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } }),
};

const DAY_LABELS = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  ar: ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'],
};

const MONTH_LABELS = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
};

const SCHEDULE_MODE_LABELS: Record<string, { en: string; ar: string }> = {
  weekdays: { en: 'Weekdays', ar: 'أيام الأسبوع' },
  monthdays: { en: 'Month Days', ar: 'أيام الشهر' },
  yeardays: { en: 'Year Days', ar: 'أيام السنة' },
};

export default function RemindersPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const store = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    titleEn: '', titleAr: '', descriptionEn: '', descriptionAr: '',
    type: 'general' as 'habit' | 'skill' | 'general',
    linkedId: '', time: '08:00', days: [1, 2, 3, 4, 5] as WeekDay[],
    scheduleMode: 'weekdays' as 'weekdays' | 'monthdays' | 'yeardays',
    monthDays: [] as number[],
    yearDays: [] as { month: number; day: number }[],
    recurring: true, urgency: 'normal' as Urgency,
    sound: 'default', enabled: true,
  });

  const resetForm = () => {
    setForm({
      titleEn: '', titleAr: '', descriptionEn: '', descriptionAr: '',
      type: 'general', linkedId: '', time: '08:00', days: [1, 2, 3, 4, 5],
      scheduleMode: 'weekdays' as 'weekdays' | 'monthdays' | 'yeardays',
      monthDays: [] as number[], yearDays: [] as { month: number; day: number }[],
      recurring: true, urgency: 'normal', sound: 'default', enabled: true,
    });
    setEditingId(null);
  };

  const handleSave = () => {
    if (!form.titleEn && !form.titleAr) return;
    const data = {
      ...form,
      days: form.scheduleMode === 'weekdays' ? form.days : [],
      scheduleMode: form.scheduleMode,
      monthDays: form.scheduleMode === 'monthdays' ? form.monthDays : undefined,
      yearDays: form.scheduleMode === 'yeardays' ? form.yearDays : undefined,
    };
    if (editingId) {
      store.updateReminder(editingId, data);
    } else {
      store.addReminder(data);
    }
    setShowForm(false);
    resetForm();
  };

  const activeReminders = store.reminders.filter(r => r.enabled);
  const disabledReminders = store.reminders.filter(r => !r.enabled);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 pb-20 max-w-[1400px] mx-auto">
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{isAr ? 'التذكيرات' : 'Reminders'}</h1>
          <p className="text-sm text-[var(--foreground)]/70 mt-1">
            {isAr ? `${activeReminders.length} تذكير نشط` : `${activeReminders.length} active reminders`}
          </p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-2 rounded-xl app-btn-primary px-4 py-2.5 text-sm font-medium">
          <Plus className="h-4 w-4" /> {isAr ? 'تذكير جديد' : 'New Reminder'}
        </button>
      </motion.div>

      {store.reminders.length === 0 ? (
        <div className="text-center py-16">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--foreground)]/[0.06]">
            <Bell className="h-8 w-8 text-[var(--foreground)]/40" />
          </div>
          <p className="text-sm text-[var(--foreground)]/60 mb-4">{isAr ? 'لا توجد تذكيرات' : 'No reminders yet'}</p>
          <button onClick={() => { resetForm(); setShowForm(true); }}
            className="inline-flex items-center gap-2 rounded-xl app-btn-primary px-5 py-2.5 text-sm font-medium">
            <Plus className="h-4 w-4" /> {isAr ? 'إضافة تذكير' : 'Add Reminder'}
          </button>
        </div>
      ) : (
        <motion.div initial="hidden" animate="visible" className="space-y-3">
          {activeReminders.map((reminder, i) => (
            <motion.div key={reminder.id} variants={fadeUp} custom={i + 1}
              className="flex items-center gap-4 rounded-2xl app-card px-5 py-4">
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl shrink-0',
                reminder.urgency === 'high' ? 'bg-red-500/10' : reminder.urgency === 'normal' ? 'bg-blue-500/10' : 'bg-gray-500/10')}>
                <BellRing className={cn('h-5 w-5',
                  reminder.urgency === 'high' ? 'text-red-500' : reminder.urgency === 'normal' ? 'text-blue-500' : 'text-gray-500')} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold">{isAr ? reminder.titleAr : reminder.titleEn}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-[var(--foreground)]/60 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {reminder.time}
                  </span>
                  <span className="text-[10px] text-[var(--foreground)]/60">
                    {reminder.scheduleMode === 'monthdays' && reminder.monthDays?.length
                      ? (isAr ? 'أيام الشهر: ' : 'Monthly: ') + reminder.monthDays.join(', ')
                      : reminder.scheduleMode === 'yeardays' && reminder.yearDays?.length
                        ? (isAr ? 'سنوي: ' : 'Yearly: ') + reminder.yearDays.map(yd => `${(isAr ? MONTH_LABELS.ar : MONTH_LABELS.en)[yd.month]} ${yd.day}`).join(', ')
                        : reminder.days.map(d => isAr ? DAY_LABELS.ar[d] : DAY_LABELS.en[d]).join(', ')}
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => store.toggleReminder(reminder.id)} className="p-2 rounded-lg hover:bg-[var(--foreground)]/[0.05]">
                  <BellOff className="h-4 w-4 text-[var(--foreground)]/30" />
                </button>
                <button onClick={() => {
                  setForm({
                    titleEn: reminder.titleEn, titleAr: reminder.titleAr,
                    descriptionEn: reminder.descriptionEn, descriptionAr: reminder.descriptionAr,
                    type: reminder.type, linkedId: reminder.linkedId ?? '',
                    time: reminder.time, days: reminder.days,
                    scheduleMode: reminder.scheduleMode ?? 'weekdays',
                    monthDays: reminder.monthDays ?? [],
                    yearDays: reminder.yearDays ?? [],
                    recurring: reminder.recurring,
                    urgency: reminder.urgency, sound: reminder.sound, enabled: reminder.enabled,
                  });
                  setEditingId(reminder.id);
                  setShowForm(true);
                }} className="p-2 rounded-lg hover:bg-[var(--foreground)]/[0.05]">
                  <Edit3 className="h-4 w-4 text-[var(--foreground)]/30" />
                </button>
                <button onClick={() => store.deleteReminder(reminder.id)} className="p-2 rounded-lg hover:bg-[var(--foreground)]/[0.05]">
                  <Trash2 className="h-4 w-4 text-red-400" />
                </button>
              </div>
            </motion.div>
          ))}

          {disabledReminders.length > 0 && (
            <div className="pt-4">
              <h3 className="text-xs font-medium text-[var(--foreground)]/30 mb-2">{isAr ? 'معطلة' : 'Disabled'}</h3>
              {disabledReminders.map(r => (
                <div key={r.id} className="flex items-center gap-4 rounded-xl px-5 py-3 opacity-40">
                  <BellOff className="h-4 w-4 shrink-0" />
                  <span className="text-sm flex-1">{isAr ? r.titleAr : r.titleEn}</span>
                  <button onClick={() => store.toggleReminder(r.id)} className="text-xs text-[var(--color-primary)]">
                    {isAr ? 'تفعيل' : 'Enable'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setShowForm(false); resetForm(); }}
              className="fixed inset-0 z-[var(--z-overlay)] bg-black/60" />
            <motion.div
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-x-4 sm:inset-x-0 sm:mx-auto top-[10%] z-[var(--z-modal)] sm:w-[460px] max-h-[80vh] overflow-y-auto rounded-2xl bg-[var(--color-background)] border border-[var(--foreground)]/[0.12] shadow-2xl"
            >
              <div className="p-5 border-b border-[var(--foreground)]/[0.1] flex items-center justify-between">
                <h2 className="text-lg font-semibold">{editingId ? (isAr ? 'تعديل التذكير' : 'Edit Reminder') : (isAr ? 'تذكير جديد' : 'New Reminder')}</h2>
                <button onClick={() => { setShowForm(false); resetForm(); }} className="p-2 rounded-lg hover:bg-[var(--foreground)]/[0.05]"><X className="h-4 w-4" /></button>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-[var(--foreground)]/70 mb-1 block">{isAr ? 'العنوان (عربي)' : 'Title (Arabic)'}</label>
                    <input dir="rtl" value={form.titleAr} onChange={e => setForm(f => ({ ...f, titleAr: e.target.value }))}
                      className="w-full rounded-xl app-input px-3 py-2.5 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--foreground)]/70 mb-1 block">{isAr ? 'العنوان (إنجليزي)' : 'Title (English)'}</label>
                    <input dir="ltr" value={form.titleEn} onChange={e => setForm(f => ({ ...f, titleEn: e.target.value }))}
                      className="w-full rounded-xl app-input px-3 py-2.5 text-sm" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-[var(--foreground)]/70 mb-1 block">{isAr ? 'الوقت' : 'Time'}</label>
                  <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                    className="w-full rounded-xl app-input px-3 py-2.5 text-sm" />
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-medium text-[var(--foreground)]/70 mb-1 block">{isAr ? 'الأيام' : 'Days'}</label>
                  {/* Schedule mode tabs */}
                  <div className="flex gap-1.5">
                    {(['weekdays', 'monthdays', 'yeardays'] as const).map(m => (
                      <button key={m}
                        onClick={() => setForm(f => ({ ...f, scheduleMode: m }))}
                        className={cn('flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-all',
                          form.scheduleMode === m
                            ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/30'
                            : 'bg-[var(--foreground)]/[0.06] text-[var(--foreground)]/60')}>
                        {isAr ? SCHEDULE_MODE_LABELS[m].ar : SCHEDULE_MODE_LABELS[m].en}
                      </button>
                    ))}
                  </div>

                  {/* Weekdays */}
                  {form.scheduleMode === 'weekdays' && (
                    <div className="flex gap-1.5">
                      {[0, 1, 2, 3, 4, 5, 6].map(d => (
                        <button key={d}
                          onClick={() => setForm(f => ({
                            ...f,
                            days: f.days.includes(d as WeekDay)
                              ? f.days.filter(x => x !== d)
                              : [...f.days, d as WeekDay]
                          }))}
                          className={cn('flex-1 py-2 rounded-lg text-xs font-medium transition-all',
                            form.days.includes(d as WeekDay)
                              ? 'bg-[var(--color-primary)] text-white'
                              : 'bg-[var(--foreground)]/[0.06] text-[var(--foreground)]/70')}>
                          {isAr ? DAY_LABELS.ar[d] : DAY_LABELS.en[d]}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Month days (1-31) */}
                  {form.scheduleMode === 'monthdays' && (
                    <div>
                      <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                          <button key={d}
                            onClick={() => setForm(f => ({
                              ...f,
                              monthDays: f.monthDays.includes(d)
                                ? f.monthDays.filter(x => x !== d)
                                : [...f.monthDays, d].sort((a, b) => a - b)
                            }))}
                            className={cn('py-1.5 rounded-lg text-xs font-medium transition-all',
                              form.monthDays.includes(d)
                                ? 'bg-[var(--color-primary)] text-white'
                                : 'bg-[var(--foreground)]/[0.06] text-[var(--foreground)]/70')}>
                            {d}
                          </button>
                        ))}
                      </div>
                      {form.monthDays.length > 0 && (
                        <p className="text-[10px] text-[var(--foreground)]/50 mt-1.5">
                          {isAr ? 'المحدد: ' : 'Selected: '}{form.monthDays.join(', ')}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Year days (month + day) */}
                  {form.scheduleMode === 'yeardays' && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-4 gap-1">
                        {(isAr ? MONTH_LABELS.ar : MONTH_LABELS.en).map((label, mi) => {
                          const hasEntries = form.yearDays.some(yd => yd.month === mi);
                          return (
                            <button key={mi}
                              onClick={() => {
                                setForm(f => {
                                  const existing = f.yearDays.filter(yd => yd.month === mi);
                                  if (existing.length > 0) {
                                    return { ...f, yearDays: f.yearDays.filter(yd => yd.month !== mi) };
                                  }
                                  return { ...f, yearDays: [...f.yearDays, { month: mi, day: 1 }].sort((a, b) => a.month - b.month || a.day - b.day) };
                                });
                              }}
                              className={cn('py-1.5 rounded-lg text-[11px] font-medium transition-all',
                                hasEntries
                                  ? 'bg-[var(--color-primary)] text-white'
                                  : 'bg-[var(--foreground)]/[0.06] text-[var(--foreground)]/60')}>
                              {label}
                            </button>
                          );
                        })}
                      </div>
                      {(() => {
                        const selectedMonths = [...new Set(form.yearDays.map(yd => yd.month))].sort((a, b) => a - b);
                        if (selectedMonths.length === 0) return null;
                        return selectedMonths.map(mi => {
                          const daysInMonth = new Date(2024, mi + 1, 0).getDate();
                          const selectedDays = form.yearDays.filter(yd => yd.month === mi).map(yd => yd.day);
                          return (
                            <div key={mi} className="mt-2">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[11px] font-semibold text-[var(--foreground)]/60">
                                  {isAr ? MONTH_LABELS.ar[mi] : MONTH_LABELS.en[mi]}
                                </span>
                                <button
                                  onClick={() => setForm(f => ({
                                    ...f,
                                    yearDays: f.yearDays.filter(yd => yd.month !== mi)
                                  }))}
                                  className="text-[10px] text-red-400 hover:text-red-500 cursor-pointer">
                                  {isAr ? 'إزالة' : 'Remove'}
                                </button>
                              </div>
                              <div className="grid grid-cols-7 gap-1">
                                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
                                  <button key={d}
                                    onClick={() => setForm(f => {
                                      const has = f.yearDays.some(yd => yd.month === mi && yd.day === d);
                                      const updated = has
                                        ? f.yearDays.filter(yd => !(yd.month === mi && yd.day === d))
                                        : [...f.yearDays, { month: mi, day: d }];
                                      return { ...f, yearDays: updated.sort((a, b) => a.month - b.month || a.day - b.day) };
                                    })}
                                    className={cn('py-1.5 rounded-lg text-[11px] font-medium transition-all',
                                      selectedDays.includes(d)
                                        ? 'bg-[var(--color-primary)] text-white'
                                        : 'bg-[var(--foreground)]/[0.06] text-[var(--foreground)]/60')}>
                                    {d}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        });
                      })()}
                      {form.yearDays.length > 0 && (
                        <p className="text-[10px] text-[var(--foreground)]/50 mt-1">
                          {isAr ? 'المحدد: ' : 'Selected: '}
                          {form.yearDays.map(yd =>
                            `${(isAr ? MONTH_LABELS.ar : MONTH_LABELS.en)[yd.month]} ${yd.day}`
                          ).join(', ')}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium text-[var(--foreground)]/70 mb-2 block">{isAr ? 'الأهمية' : 'Urgency'}</label>
                  <div className="flex gap-2">
                    {(['low', 'normal', 'high'] as Urgency[]).map(u => (
                      <button key={u} onClick={() => setForm(f => ({ ...f, urgency: u }))}
                        className={cn('flex-1 py-2 rounded-lg text-xs font-medium transition-all',
                          form.urgency === u
                            ? (u === 'high' ? 'bg-red-500 text-white' : u === 'normal' ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white')
                            : 'bg-[var(--foreground)]/[0.06] text-[var(--foreground)]/70')}>
                        {isAr ? (u === 'high' ? 'عالية' : u === 'normal' ? 'عادية' : 'منخفضة') : u}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 p-5 border-t border-[var(--foreground)]/[0.1]">
                {editingId && (
                  <button onClick={() => { store.deleteReminder(editingId); setShowForm(false); resetForm(); }}
                    className="me-auto text-xs text-red-500 flex items-center gap-1"><Trash2 className="h-3.5 w-3.5" /> {isAr ? 'حذف' : 'Delete'}</button>
                )}
                <button onClick={() => { setShowForm(false); resetForm(); }} className="px-4 py-2 rounded-xl text-sm text-[var(--foreground)]/70">{isAr ? 'إلغاء' : 'Cancel'}</button>
                <button onClick={handleSave} className="px-5 py-2 rounded-xl app-btn-primary text-sm font-medium">
                  {editingId ? (isAr ? 'تحديث' : 'Update') : (isAr ? 'إنشاء' : 'Create')}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
