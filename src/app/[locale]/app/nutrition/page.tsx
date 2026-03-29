'use client';

import React, { useState, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import { todayString, MealType, MoodLevel } from '@/types/app';
import {
  Apple, Droplets, Plus, X, Coffee, Sun, Moon, Cookie,
  Flame, TrendingUp, CheckCircle2, Minus, Heart,
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } }),
};

const MEAL_LABELS: Record<MealType, { en: string; ar: string; icon: React.ElementType }> = {
  breakfast: { en: 'Breakfast', ar: 'إفطار', icon: Sun },
  lunch: { en: 'Lunch', ar: 'غداء', icon: Coffee },
  dinner: { en: 'Dinner', ar: 'عشاء', icon: Moon },
  snack: { en: 'Snack', ar: 'وجبة خفيفة', icon: Cookie },
};

export default function NutritionPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const store = useAppStore();
  const today = todayString();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    mealType: 'breakfast' as MealType,
    nameEn: '', nameAr: '', descriptionEn: '', descriptionAr: '',
    healthy: true, note: '',
  });

  const todayMeals = useMemo(() => store.getNutritionForDate(today), [store, today]);
  const todayHydration = store.getHydrationForDate(today);
  const glasses = todayHydration?.glasses ?? 0;
  const target = store.settings.hydrationTarget;

  // Week stats
  const weekHealthy = useMemo(() => {
    let count = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const meals = store.nutritionLogs.filter(n => n.date === dateStr);
      if (meals.length > 0 && meals.every(m => m.healthy)) count++;
    }
    return count;
  }, [store.nutritionLogs, today]);

  const handleSave = () => {
    store.logNutrition({ ...form, date: today });
    setShowForm(false);
    setForm({ mealType: 'breakfast', nameEn: '', nameAr: '', descriptionEn: '', descriptionAr: '', healthy: true, note: '' });
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 pb-20 max-w-[1400px] mx-auto">
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{isAr ? 'التغذية' : 'Nutrition'}</h1>
          <p className="text-sm text-[var(--foreground)]/70 mt-1">{isAr ? 'تتبع وجباتك والترطيب' : 'Track meals and hydration'}</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-xl app-btn-primary px-4 py-2.5 text-sm font-medium">
          <Plus className="h-4 w-4" /> {isAr ? 'وجبة جديدة' : 'Log Meal'}
        </button>
      </motion.div>

      {/* Summary Cards */}
      <motion.div initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { labelEn: 'Meals Today', labelAr: 'وجبات اليوم', value: todayMeals.length, icon: Apple, color: 'text-orange-500 bg-orange-500/10' },
          { labelEn: 'Hydration', labelAr: 'الترطيب', value: `${glasses}/${target}`, icon: Droplets, color: 'text-blue-500 bg-blue-500/10' },
          { labelEn: 'Healthy Streak', labelAr: 'أيام صحية', value: `${weekHealthy}/7`, icon: Heart, color: 'text-emerald-500 bg-emerald-500/10' },
          { labelEn: 'Healthy %', labelAr: '% صحي', value: `${todayMeals.length ? Math.round(todayMeals.filter(m => m.healthy).length / todayMeals.length * 100) : 0}%`, icon: TrendingUp, color: 'text-purple-500 bg-purple-500/10' },
        ].map((s, i) => (
          <motion.div key={i} variants={fadeUp} custom={i + 1}
            className="rounded-2xl app-stat-card p-4">
            <div className="flex items-center justify-between mb-2">
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
          {/* Today's Meals */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={5}
            className="rounded-2xl app-card overflow-hidden">
            <div className="p-5 border-b border-[var(--foreground)]/[0.1]">
              <h3 className="text-sm font-semibold">{isAr ? 'وجبات اليوم' : "Today's Meals"}</h3>
            </div>
            {todayMeals.length === 0 ? (
              <div className="p-8 text-center">
                <Apple className="h-8 w-8 text-[var(--foreground)]/15 mx-auto mb-2" />
                <p className="text-xs text-[var(--foreground)]/30">{isAr ? 'لم تسجل وجبات اليوم' : 'No meals logged today'}</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--foreground)]/[0.08]">
                {todayMeals.map(meal => {
                  const info = MEAL_LABELS[meal.mealType];
                  return (
                    <div key={meal.id} className="flex items-center gap-3 px-5 py-3">
                      <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl shrink-0', meal.healthy ? 'bg-emerald-500/10' : 'bg-amber-500/10')}>
                        <info.icon className={cn('h-4 w-4', meal.healthy ? 'text-emerald-500' : 'text-amber-500')} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{isAr ? (meal.nameAr || info.ar) : (meal.nameEn || info.en)}</p>
                        <p className="text-[10px] text-[var(--foreground)]/60">{isAr ? info.ar : info.en}</p>
                      </div>
                      {meal.healthy && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                      <button onClick={() => store.deleteNutritionLog(meal.id)}
                        className="p-1 rounded hover:bg-[var(--foreground)]/[0.05]">
                        <X className="h-3 w-3 text-[var(--foreground)]/40" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>

        {/* Hydration Tracker */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={6}>
          <div className="rounded-2xl app-card p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Droplets className="h-4 w-4 text-blue-500" />
              {isAr ? 'الترطيب' : 'Hydration'}
            </h3>

            <div className="text-center mb-4">
              <div className="relative mx-auto w-32 h-32">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 128 128">
                  <circle cx="64" cy="64" r="56" fill="none" stroke="currentColor" strokeWidth="6" className="text-[var(--foreground)]/[0.06]" />
                  <circle cx="64" cy="64" r="56" fill="none" stroke="#3B82F6" strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={`${Math.min(100, (glasses / target) * 100) * 3.52} 352`} className="transition-all duration-500" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Droplets className="h-5 w-5 text-blue-500 mb-1" />
                  <span className="text-xl font-bold">{glasses}</span>
                  <span className="text-[10px] text-[var(--foreground)]/60">/ {target}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => store.logHydration(today, Math.max(0, glasses - 1), target)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--foreground)]/[0.12] hover:bg-[var(--foreground)]/[0.08]">
                <Minus className="h-4 w-4" />
              </button>
              <button
                onClick={() => store.logHydration(today, glasses + 1, target)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white hover:opacity-90">
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <p className="text-center text-[10px] text-[var(--foreground)]/30 mt-3">
              {glasses >= target
                ? (isAr ? '✓ وصلت لهدفك!' : '✓ Target reached!')
                : (isAr ? `${target - glasses} أكواب متبقية` : `${target - glasses} glasses to go`)}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Add Meal Modal */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              className="fixed inset-0 z-[var(--z-overlay)] bg-black/60" />
            <motion.div
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-x-4 sm:inset-x-0 sm:mx-auto top-[10%] z-[var(--z-modal)] sm:w-[420px] rounded-2xl bg-[var(--color-background)] border border-[var(--foreground)]/[0.12] shadow-2xl"
            >
              <div className="p-5 border-b border-[var(--foreground)]/[0.1] flex items-center justify-between">
                <h2 className="text-lg font-semibold">{isAr ? 'تسجيل وجبة' : 'Log Meal'}</h2>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-[var(--foreground)]/[0.05]"><X className="h-4 w-4" /></button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)]/70 mb-2 block">{isAr ? 'نوع الوجبة' : 'Meal Type'}</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(Object.keys(MEAL_LABELS) as MealType[]).map(t => {
                      const info = MEAL_LABELS[t];
                      return (
                        <button key={t} onClick={() => setForm(f => ({ ...f, mealType: t }))}
                          className={cn('flex flex-col items-center gap-1 rounded-xl py-2.5 text-[10px] font-medium transition-all border',
                            form.mealType === t ? 'border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'border-[var(--foreground)]/[0.12] text-[var(--foreground)]/70')}>
                          <info.icon className="h-4 w-4" />
                          {isAr ? info.ar : info.en}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-[var(--foreground)]/70 mb-1 block">{isAr ? 'الوصف' : 'Description'}</label>
                  <input value={isAr ? form.nameAr : form.nameEn}
                    onChange={e => isAr ? setForm(f => ({ ...f, nameAr: e.target.value })) : setForm(f => ({ ...f, nameEn: e.target.value }))}
                    placeholder={isAr ? 'مثال: سلطة مع دجاج مشوي' : 'e.g., Grilled chicken salad'}
                    className="w-full rounded-xl app-input px-3 py-2.5 text-sm" />
                </div>

                <div className="flex gap-2">
                  {[
                    { value: true, labelEn: '✓ Healthy', labelAr: '✓ صحي', color: 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10' },
                    { value: false, labelEn: '✗ Less Healthy', labelAr: '✗ أقل صحة', color: 'text-amber-500 border-amber-500/30 bg-amber-500/10' },
                  ].map(opt => (
                    <button key={String(opt.value)} onClick={() => setForm(f => ({ ...f, healthy: opt.value }))}
                      className={cn('flex-1 py-2.5 rounded-xl text-xs font-medium transition-all border',
                        form.healthy === opt.value ? opt.color : 'border-[var(--foreground)]/[0.12] text-[var(--foreground)]/70')}>
                      {isAr ? opt.labelAr : opt.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 p-5 border-t border-[var(--foreground)]/[0.1]">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-sm text-[var(--foreground)]/70">{isAr ? 'إلغاء' : 'Cancel'}</button>
                <button onClick={handleSave} className="px-5 py-2 rounded-xl app-btn-primary text-sm font-medium">{isAr ? 'حفظ' : 'Save'}</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
