'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import { ITEM_COLORS, generateId, GoalMilestone } from '@/types/app';
import {
  Target, Plus, X, CheckCircle2, Circle, Trash2, Edit3,
  Award, Calendar, Flag, TrendingUp, Sparkles,
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } }),
};

export default function GoalsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const store = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [form, setForm] = useState({
    titleEn: '', titleAr: '', descriptionEn: '', descriptionAr: '',
    targetDate: '', color: ITEM_COLORS[3], icon: 'Target',
    linkedSkillIds: [] as string[], linkedHabitIds: [] as string[],
    milestones: [{ id: generateId(), titleEn: '', titleAr: '', completed: false }] as (GoalMilestone & { completedAt?: string })[],
  });

  const resetForm = () => {
    setForm({
      titleEn: '', titleAr: '', descriptionEn: '', descriptionAr: '',
      targetDate: '', color: ITEM_COLORS[3], icon: 'Target',
      linkedSkillIds: [], linkedHabitIds: [],
      milestones: [{ id: generateId(), titleEn: '', titleAr: '', completed: false }],
    });
    setEditingGoal(null);
  };

  const handleSave = () => {
    if (!form.titleEn && !form.titleAr) return;
    const milestones = form.milestones.filter(m => m.titleEn || m.titleAr);
    if (editingGoal) {
      store.updateGoal(editingGoal, { ...form, milestones });
    } else {
      store.addGoal({ ...form, milestones });
    }
    setShowForm(false);
    resetForm();
  };

  const addMilestone = () => {
    setForm(f => ({ ...f, milestones: [...f.milestones, { id: generateId(), titleEn: '', titleAr: '', completed: false }] }));
  };

  const activeGoals = store.goals.filter(g => !g.completed);
  const completedGoals = store.goals.filter(g => g.completed);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 pb-20 max-w-[1400px] mx-auto">
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{isAr ? 'الأهداف والمراحل' : 'Goals & Milestones'}</h1>
          <p className="text-sm text-[var(--foreground)]/70 mt-1">
            {isAr ? `${activeGoals.length} أهداف نشطة · ${completedGoals.length} مكتملة` : `${activeGoals.length} active · ${completedGoals.length} completed`}
          </p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-2 rounded-xl app-btn-primary px-4 py-2.5 text-sm font-medium">
          <Plus className="h-4 w-4" /> {isAr ? 'هدف جديد' : 'New Goal'}
        </button>
      </motion.div>

      {/* Active Goals */}
      <motion.div initial="hidden" animate="visible" className="space-y-4 mb-8">
        {activeGoals.length === 0 && completedGoals.length === 0 && (
          <div className="text-center py-16">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--foreground)]/[0.05]">
              <Target className="h-8 w-8 text-[var(--foreground)]/40" />
            </div>
            <p className="text-sm text-[var(--foreground)]/60 mb-4">{isAr ? 'لا توجد أهداف بعد' : 'No goals yet'}</p>
            <button onClick={() => { resetForm(); setShowForm(true); }}
              className="inline-flex items-center gap-2 rounded-xl app-btn-primary px-5 py-2.5 text-sm font-medium">
              <Plus className="h-4 w-4" /> {isAr ? 'إضافة هدف' : 'Add Goal'}
            </button>
          </div>
        )}

        {activeGoals.map((goal, i) => (
          <motion.div key={goal.id} variants={fadeUp} custom={i + 1}
            className="rounded-2xl app-card overflow-hidden">
            <div className="h-1" style={{ backgroundColor: goal.color }} />
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-semibold">{isAr ? goal.titleAr : goal.titleEn}</h3>
                  {(goal.descriptionEn || goal.descriptionAr) && (
                    <p className="text-xs text-[var(--foreground)]/60 mt-0.5">{isAr ? goal.descriptionAr : goal.descriptionEn}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => {
                    setForm({
                      titleEn: goal.titleEn, titleAr: goal.titleAr,
                      descriptionEn: goal.descriptionEn, descriptionAr: goal.descriptionAr,
                      targetDate: goal.targetDate ?? '', color: goal.color, icon: goal.icon,
                      linkedSkillIds: goal.linkedSkillIds, linkedHabitIds: goal.linkedHabitIds,
                      milestones: goal.milestones,
                    });
                    setEditingGoal(goal.id);
                    setShowForm(true);
                  }} className="p-1.5 rounded-lg hover:bg-[var(--foreground)]/[0.05]">
                    <Edit3 className="h-3.5 w-3.5 text-[var(--foreground)]/60" />
                  </button>
                  <button onClick={() => store.deleteGoal(goal.id)} className="p-1.5 rounded-lg hover:bg-[var(--foreground)]/[0.05]">
                    <Trash2 className="h-3.5 w-3.5 text-red-400" />
                  </button>
                </div>
              </div>

              {/* Progress */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1">
                  <div className="h-2 rounded-full bg-[var(--foreground)]/[0.05] overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${goal.progress}%` }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
                      className="h-full rounded-full" style={{ backgroundColor: goal.color }} />
                  </div>
                </div>
                <span className="text-sm font-bold" style={{ color: goal.color }}>{goal.progress}%</span>
              </div>

              {/* Milestones */}
              <div className="space-y-2">
                {goal.milestones.map(m => (
                  <button key={m.id} onClick={() => store.toggleGoalMilestone(goal.id, m.id)}
                    className="w-full flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-[var(--foreground)]/[0.03] transition-all text-start">
                    {m.completed
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      : <Circle className="h-4 w-4 text-[var(--foreground)]/40 shrink-0" />}
                    <span className={cn('text-xs', m.completed && 'line-through text-[var(--foreground)]/60')}>
                      {isAr ? m.titleAr : m.titleEn}
                    </span>
                  </button>
                ))}
              </div>

              {goal.targetDate && (
                <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-[var(--foreground)]/[0.15]">
                  <Calendar className="h-3 w-3 text-[var(--foreground)]/30" />
                  <span className="text-[10px] text-[var(--foreground)]/30">
                    {isAr ? 'الموعد المستهدف:' : 'Target:'} {new Date(goal.targetDate).toLocaleDateString(isAr ? 'ar-SA-u-nu-latn' : 'en-US')}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[var(--foreground)]/60 mb-3 flex items-center gap-2">
            <Award className="h-4 w-4" /> {isAr ? 'أهداف مكتملة' : 'Completed Goals'} ({completedGoals.length})
          </h2>
          <div className="space-y-2">
            {completedGoals.map(goal => (
              <div key={goal.id} className="flex items-center gap-3 rounded-xl app-card px-4 py-3 opacity-60">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                <span className="text-sm line-through">{isAr ? goal.titleAr : goal.titleEn}</span>
                <span className="text-[10px] text-[var(--foreground)]/30 ms-auto">
                  {goal.completedAt && new Date(goal.completedAt).toLocaleDateString(isAr ? 'ar-SA-u-nu-latn' : 'en-US')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setShowForm(false); resetForm(); }}
              className="fixed inset-0 z-[var(--z-overlay)] bg-black/60" />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 40, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-x-4 sm:inset-x-0 sm:mx-auto top-[5%] sm:top-[10%] z-[var(--z-modal)] sm:w-[520px] max-h-[85vh] overflow-y-auto rounded-2xl bg-[var(--color-background)] border border-[var(--foreground)]/[0.18] shadow-2xl"
            >
              <div className="sticky top-0 z-10 bg-[var(--color-background)] flex items-center justify-between p-5 border-b border-[var(--foreground)]/[0.1]">
                <h2 className="text-lg font-semibold">{editingGoal ? (isAr ? 'تعديل الهدف' : 'Edit Goal') : (isAr ? 'هدف جديد' : 'New Goal')}</h2>
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
                  <label className="text-xs font-medium text-[var(--foreground)]/70 mb-1 block">{isAr ? 'تاريخ الهدف' : 'Target Date'}</label>
                  <input type="date" value={form.targetDate} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))}
                    className="w-full rounded-xl app-input px-3 py-2.5 text-sm" />
                </div>

                <div>
                  <label className="text-xs font-medium text-[var(--foreground)]/70 mb-2 block">{isAr ? 'اللون' : 'Color'}</label>
                  <div className="flex gap-2 flex-wrap">
                    {ITEM_COLORS.map(c => (
                      <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                        className={cn('h-7 w-7 rounded-full transition-all', form.color === c ? 'ring-2 ring-offset-2 ring-[var(--foreground)]/20 scale-110' : 'hover:scale-110')}
                        style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>

                {/* Milestones */}
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)]/70 mb-2 block">{isAr ? 'المراحل' : 'Milestones'}</label>
                  <div className="space-y-2">
                    {form.milestones.map((m, idx) => (
                      <div key={m.id} className="flex gap-2">
                        <input value={isAr ? m.titleAr : m.titleEn}
                          onChange={e => {
                            const updated = [...form.milestones];
                            if (isAr) updated[idx] = { ...updated[idx], titleAr: e.target.value };
                            else updated[idx] = { ...updated[idx], titleEn: e.target.value };
                            setForm(f => ({ ...f, milestones: updated }));
                          }}
                          placeholder={isAr ? `مرحلة ${idx + 1}` : `Milestone ${idx + 1}`}
                          className="flex-1 rounded-xl app-input px-3 py-2 text-sm" />
                        {form.milestones.length > 1 && (
                          <button onClick={() => setForm(f => ({ ...f, milestones: f.milestones.filter((_, i) => i !== idx) }))}
                            className="p-2 rounded-lg hover:bg-[var(--foreground)]/[0.05]">
                            <X className="h-3.5 w-3.5 text-[var(--foreground)]/30" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button onClick={addMilestone}
                    className="mt-2 flex items-center gap-1.5 text-xs text-[var(--color-primary)] hover:underline">
                    <Plus className="h-3 w-3" /> {isAr ? 'إضافة مرحلة' : 'Add Milestone'}
                  </button>
                </div>
              </div>

              <div className="sticky bottom-0 bg-[var(--color-background)] flex justify-end gap-3 p-5 border-t border-[var(--foreground)]/[0.1]">
                <button onClick={() => { setShowForm(false); resetForm(); }}
                  className="px-4 py-2 rounded-xl text-sm text-[var(--foreground)]/70">{isAr ? 'إلغاء' : 'Cancel'}</button>
                <button onClick={handleSave}
                  className="px-5 py-2 rounded-xl app-btn-primary text-sm font-medium">
                  {editingGoal ? (isAr ? 'تحديث' : 'Update') : (isAr ? 'إنشاء' : 'Create')}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
