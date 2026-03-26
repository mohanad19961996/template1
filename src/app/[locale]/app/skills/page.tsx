'use client';

import React, { useState, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import {
  Skill, SkillSession, SKILL_CATEGORIES, SkillCategory,
  todayString, generateId, ITEM_COLORS, formatDuration, MoodLevel,
} from '@/types/app';
import {
  Plus, GraduationCap, Clock, Star, TrendingUp, BarChart3,
  Search, X, Trash2, Edit3, Eye, Play, Target, Award,
  BookOpen, ChevronDown, Timer, Flame, Calendar,
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } }),
};

const CATEGORY_LABELS: Record<string, { en: string; ar: string }> = {
  programming: { en: 'Programming', ar: 'البرمجة' },
  languages: { en: 'Languages', ar: 'اللغات' },
  design: { en: 'Design', ar: 'التصميم' },
  writing: { en: 'Writing', ar: 'الكتابة' },
  music: { en: 'Music', ar: 'الموسيقى' },
  fitness: { en: 'Fitness', ar: 'اللياقة' },
  cooking: { en: 'Cooking', ar: 'الطبخ' },
  communication: { en: 'Communication', ar: 'التواصل' },
  leadership: { en: 'Leadership', ar: 'القيادة' },
  analysis: { en: 'Analysis', ar: 'التحليل' },
  reading: { en: 'Reading', ar: 'القراءة' },
  memory: { en: 'Memory', ar: 'الذاكرة' },
  other: { en: 'Other', ar: 'أخرى' },
};

export default function SkillsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const store = useAppStore();
  const today = todayString();

  const [showForm, setShowForm] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [showSessionForm, setShowSessionForm] = useState<string | null>(null);
  const [detailSkill, setDetailSkill] = useState<Skill | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Skill form
  const [skillForm, setSkillForm] = useState({
    nameEn: '', nameAr: '', descriptionEn: '', descriptionAr: '',
    category: 'programming' as SkillCategory,
    targetLevel: 50, currentLevel: 0,
    color: ITEM_COLORS[5], icon: 'BookOpen',
    milestones: [] as { id: string; titleEn: string; titleAr: string; targetHours: number; completed: boolean }[],
  });

  // Session form
  const [sessionForm, setSessionForm] = useState({
    date: today, startTime: '09:00', endTime: '10:00',
    sessionType: 'practice', qualityRating: 3 as MoodLevel,
    focusRating: 3 as MoodLevel, note: '', whatLearned: '', tags: '',
  });

  const resetSkillForm = () => {
    setSkillForm({
      nameEn: '', nameAr: '', descriptionEn: '', descriptionAr: '',
      category: 'programming', targetLevel: 50, currentLevel: 0,
      color: ITEM_COLORS[5], icon: 'BookOpen', milestones: [],
    });
    setEditingSkill(null);
  };

  const openEditSkill = (skill: Skill) => {
    setSkillForm({
      nameEn: skill.nameEn, nameAr: skill.nameAr,
      descriptionEn: skill.descriptionEn, descriptionAr: skill.descriptionAr,
      category: skill.category, targetLevel: skill.targetLevel,
      currentLevel: skill.currentLevel, color: skill.color,
      icon: skill.icon, milestones: skill.milestones,
    });
    setEditingSkill(skill);
    setShowForm(true);
  };

  const handleSaveSkill = () => {
    if (!skillForm.nameEn && !skillForm.nameAr) return;
    if (editingSkill) {
      store.updateSkill(editingSkill.id, { ...skillForm });
    } else {
      store.addSkill({ ...skillForm });
    }
    setShowForm(false);
    resetSkillForm();
  };

  const handleLogSession = () => {
    if (!showSessionForm) return;
    const start = sessionForm.startTime.split(':').map(Number);
    const end = sessionForm.endTime.split(':').map(Number);
    const duration = Math.max(1, (end[0] * 60 + end[1]) - (start[0] * 60 + start[1]));

    store.logSkillSession({
      skillId: showSessionForm,
      date: sessionForm.date,
      startTime: sessionForm.startTime,
      endTime: sessionForm.endTime,
      duration,
      sessionType: sessionForm.sessionType,
      qualityRating: sessionForm.qualityRating,
      focusRating: sessionForm.focusRating,
      note: sessionForm.note,
      whatLearned: sessionForm.whatLearned,
      tags: sessionForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      timerUsed: false,
    });
    setShowSessionForm(null);
    setSessionForm({
      date: today, startTime: '09:00', endTime: '10:00',
      sessionType: 'practice', qualityRating: 3, focusRating: 3,
      note: '', whatLearned: '', tags: '',
    });
  };

  const filteredSkills = useMemo(() => {
    return store.skills.filter(s => {
      if (s.archived) return false;
      if (filterCategory !== 'all' && s.category !== filterCategory) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return s.nameEn.toLowerCase().includes(q) || s.nameAr.includes(q);
      }
      return true;
    });
  }, [store.skills, filterCategory, searchQuery]);

  const totalHours = useMemo(() =>
    Math.round(store.skills.reduce((a, s) => a + s.totalMinutes, 0) / 60),
    [store.skills]
  );

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 pb-20 max-w-[1400px] mx-auto">
      {/* Header */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{isAr ? 'المهارات' : 'Skills'}</h1>
          <p className="text-sm text-[var(--foreground)]/50 mt-1">
            {isAr ? `${store.skills.filter(s => !s.archived).length} مهارة · ${totalHours} ساعة إجمالية` : `${store.skills.filter(s => !s.archived).length} skills · ${totalHours}h total`}
          </p>
        </div>
        <button
          onClick={() => { resetSkillForm(); setShowForm(true); }}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity shadow-sm"
        >
          <Plus className="h-4 w-4" /> {isAr ? 'مهارة جديدة' : 'New Skill'}
        </button>
      </motion.div>

      {/* Stats Bar */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="grid grid-cols-3 gap-3 mb-6">
        {[
          { labelEn: 'Total Skills', labelAr: 'المهارات', value: store.skills.filter(s => !s.archived).length, icon: GraduationCap, color: 'text-blue-500 bg-blue-500/10' },
          { labelEn: 'Total Hours', labelAr: 'ساعات التدريب', value: `${totalHours}h`, icon: Clock, color: 'text-purple-500 bg-purple-500/10' },
          { labelEn: 'Sessions', labelAr: 'الجلسات', value: store.skillSessions.length, icon: Timer, color: 'text-emerald-500 bg-emerald-500/10' },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border border-[var(--foreground)]/[0.06] bg-[var(--foreground)]/[0.02] p-3 flex items-center gap-3">
            <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg shrink-0', s.color.split(' ')[1])}>
              <s.icon className={cn('h-4 w-4', s.color.split(' ')[0])} />
            </div>
            <div>
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-[10px] text-[var(--foreground)]/40">{isAr ? s.labelAr : s.labelEn}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2} className="flex flex-wrap gap-2 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--foreground)]/30" />
          <input
            type="text" value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'بحث...' : 'Search...'}
            className="w-full rounded-xl border border-[var(--foreground)]/[0.08] bg-transparent ps-9 pe-3 py-2 text-sm placeholder:text-[var(--foreground)]/30 focus:outline-none focus:border-[var(--color-primary)]/40"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-xl border border-[var(--foreground)]/[0.08] bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)]/40"
        >
          <option value="all">{isAr ? 'كل الفئات' : 'All Categories'}</option>
          {SKILL_CATEGORIES.map(c => (
            <option key={c} value={c}>{isAr ? CATEGORY_LABELS[c]?.ar : CATEGORY_LABELS[c]?.en}</option>
          ))}
        </select>
      </motion.div>

      {/* Skills Grid */}
      <motion.div initial="hidden" animate="visible" className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredSkills.map((skill, i) => {
            const stats = store.getSkillStats(skill.id);
            const todaySessions = store.skillSessions.filter(s => s.skillId === skill.id && s.date === today);
            const todayMin = todaySessions.reduce((a, s) => a + s.duration, 0);
            const progress = Math.min(100, skill.targetLevel > 0 ? (skill.currentLevel / skill.targetLevel) * 100 : 0);

            return (
              <motion.div
                key={skill.id} variants={fadeUp} custom={i + 3}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group rounded-2xl border border-[var(--foreground)]/[0.06] bg-[var(--foreground)]/[0.02] overflow-hidden transition-all duration-300 hover:shadow-md hover:border-[var(--foreground)]/[0.12]"
              >
                <div className="h-1 w-full" style={{ backgroundColor: skill.color }} />
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${skill.color}20` }}>
                        <GraduationCap className="h-5 w-5" style={{ color: skill.color }} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold">{isAr ? skill.nameAr : skill.nameEn}</h3>
                        <span className="text-[10px] text-[var(--foreground)]/40">
                          {isAr ? CATEGORY_LABELS[skill.category]?.ar : CATEGORY_LABELS[skill.category]?.en}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditSkill(skill)} className="p-1.5 rounded-lg hover:bg-[var(--foreground)]/[0.05]">
                        <Edit3 className="h-3.5 w-3.5 text-[var(--foreground)]/40" />
                      </button>
                      <button onClick={() => setDetailSkill(skill)} className="p-1.5 rounded-lg hover:bg-[var(--foreground)]/[0.05]">
                        <Eye className="h-3.5 w-3.5 text-[var(--foreground)]/40" />
                      </button>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-[var(--foreground)]/40">
                        {isAr ? 'المستوى' : 'Level'} {skill.currentLevel}/{skill.targetLevel}
                      </span>
                      <span className="text-[10px] font-medium" style={{ color: skill.color }}>
                        {Math.round(progress)}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--foreground)]/[0.06] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] as const }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: skill.color }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-3 text-[10px] text-[var(--foreground)]/40 mb-3">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDuration(skill.totalMinutes)}</span>
                    <span className="flex items-center gap-1"><BarChart3 className="h-3 w-3" /> {skill.totalSessions} {isAr ? 'جلسة' : 'sessions'}</span>
                    {todayMin > 0 && (
                      <span className="flex items-center gap-1 text-emerald-500 font-medium">
                        <Flame className="h-3 w-3" /> {formatDuration(todayMin)} {isAr ? 'اليوم' : 'today'}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-[var(--foreground)]/[0.04]">
                    <button
                      onClick={() => setShowSessionForm(skill.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[var(--foreground)]/[0.04] py-2 text-xs font-medium hover:bg-[var(--foreground)]/[0.08] transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" /> {isAr ? 'جلسة' : 'Session'}
                    </button>
                    <a
                      href={`/${locale}/app/timers?skill=${skill.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[var(--color-primary)]/10 py-2 text-xs font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 transition-colors"
                    >
                      <Play className="h-3.5 w-3.5" /> {isAr ? 'مؤقت' : 'Timer'}
                    </a>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {filteredSkills.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--foreground)]/[0.04]">
            <GraduationCap className="h-8 w-8 text-[var(--foreground)]/20" />
          </div>
          <p className="text-sm text-[var(--foreground)]/40 mb-4">
            {isAr ? 'لا توجد مهارات بعد. أضف مهاراتك!' : 'No skills yet. Add your first skill!'}
          </p>
          <button
            onClick={() => { resetSkillForm(); setShowForm(true); }}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> {isAr ? 'إضافة مهارة' : 'Add Skill'}
          </button>
        </motion.div>
      )}

      {/* Skill Create/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setShowForm(false); resetSkillForm(); }}
              className="fixed inset-0 z-[var(--z-overlay)] bg-black/40 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 40, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-x-4 sm:inset-x-auto sm:start-1/2 sm:-translate-x-1/2 top-[5%] sm:top-[10%] z-[var(--z-modal)] sm:w-[540px] max-h-[85vh] overflow-y-auto rounded-2xl bg-[var(--background)] border border-[var(--foreground)]/[0.08] shadow-2xl"
            >
              <div className="sticky top-0 z-10 bg-[var(--background)] flex items-center justify-between p-5 border-b border-[var(--foreground)]/[0.06]">
                <h2 className="text-lg font-semibold">{editingSkill ? (isAr ? 'تعديل المهارة' : 'Edit Skill') : (isAr ? 'مهارة جديدة' : 'New Skill')}</h2>
                <button onClick={() => { setShowForm(false); resetSkillForm(); }} className="p-2 rounded-lg hover:bg-[var(--foreground)]/[0.05]"><X className="h-4 w-4" /></button>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-[var(--foreground)]/50 mb-1 block">{isAr ? 'الاسم (عربي)' : 'Name (Arabic)'}</label>
                    <input dir="rtl" value={skillForm.nameAr} onChange={e => setSkillForm(f => ({ ...f, nameAr: e.target.value }))}
                      className="w-full rounded-xl border border-[var(--foreground)]/[0.08] bg-transparent px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--color-primary)]/40" placeholder="مثال: البرمجة" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--foreground)]/50 mb-1 block">{isAr ? 'الاسم (إنجليزي)' : 'Name (English)'}</label>
                    <input dir="ltr" value={skillForm.nameEn} onChange={e => setSkillForm(f => ({ ...f, nameEn: e.target.value }))}
                      className="w-full rounded-xl border border-[var(--foreground)]/[0.08] bg-transparent px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--color-primary)]/40" placeholder="e.g., Programming" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-[var(--foreground)]/50 mb-1 block">{isAr ? 'الفئة' : 'Category'}</label>
                  <select value={skillForm.category} onChange={e => setSkillForm(f => ({ ...f, category: e.target.value as SkillCategory }))}
                    className="w-full rounded-xl border border-[var(--foreground)]/[0.08] bg-transparent px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--color-primary)]/40">
                    {SKILL_CATEGORIES.map(c => (<option key={c} value={c}>{isAr ? CATEGORY_LABELS[c]?.ar : CATEGORY_LABELS[c]?.en}</option>))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-[var(--foreground)]/50 mb-1 block">{isAr ? 'المستوى الحالي' : 'Current Level'}</label>
                    <input type="number" min={0} max={100} value={skillForm.currentLevel}
                      onChange={e => setSkillForm(f => ({ ...f, currentLevel: Number(e.target.value) }))}
                      className="w-full rounded-xl border border-[var(--foreground)]/[0.08] bg-transparent px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--color-primary)]/40" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--foreground)]/50 mb-1 block">{isAr ? 'المستوى المستهدف' : 'Target Level'}</label>
                    <input type="number" min={1} max={100} value={skillForm.targetLevel}
                      onChange={e => setSkillForm(f => ({ ...f, targetLevel: Number(e.target.value) }))}
                      className="w-full rounded-xl border border-[var(--foreground)]/[0.08] bg-transparent px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--color-primary)]/40" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-[var(--foreground)]/50 mb-2 block">{isAr ? 'اللون' : 'Color'}</label>
                  <div className="flex gap-2 flex-wrap">
                    {ITEM_COLORS.map(c => (
                      <button key={c} onClick={() => setSkillForm(f => ({ ...f, color: c }))}
                        className={cn('h-7 w-7 rounded-full transition-all', skillForm.color === c ? 'ring-2 ring-offset-2 ring-[var(--foreground)]/20 scale-110' : 'hover:scale-110')}
                        style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-[var(--background)] flex items-center justify-end gap-3 p-5 border-t border-[var(--foreground)]/[0.06]">
                {editingSkill && (
                  <button onClick={() => { store.deleteSkill(editingSkill.id); setShowForm(false); resetSkillForm(); }}
                    className="me-auto text-xs text-red-500 hover:text-red-600 flex items-center gap-1">
                    <Trash2 className="h-3.5 w-3.5" /> {isAr ? 'حذف' : 'Delete'}
                  </button>
                )}
                <button onClick={() => { setShowForm(false); resetSkillForm(); }}
                  className="px-4 py-2 rounded-xl text-sm text-[var(--foreground)]/50 hover:bg-[var(--foreground)]/[0.05]">{isAr ? 'إلغاء' : 'Cancel'}</button>
                <button onClick={handleSaveSkill}
                  className="px-5 py-2 rounded-xl bg-[var(--color-primary)] text-sm font-medium text-white hover:opacity-90">
                  {editingSkill ? (isAr ? 'تحديث' : 'Update') : (isAr ? 'إنشاء' : 'Create')}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Session Log Modal */}
      <AnimatePresence>
        {showSessionForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowSessionForm(null)}
              className="fixed inset-0 z-[var(--z-overlay)] bg-black/40 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 40, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-x-4 sm:inset-x-auto sm:start-1/2 sm:-translate-x-1/2 top-[5%] sm:top-[10%] z-[var(--z-modal)] sm:w-[480px] max-h-[85vh] overflow-y-auto rounded-2xl bg-[var(--background)] border border-[var(--foreground)]/[0.08] shadow-2xl"
            >
              <div className="sticky top-0 z-10 bg-[var(--background)] flex items-center justify-between p-5 border-b border-[var(--foreground)]/[0.06]">
                <h2 className="text-lg font-semibold">{isAr ? 'تسجيل جلسة' : 'Log Session'}</h2>
                <button onClick={() => setShowSessionForm(null)} className="p-2 rounded-lg hover:bg-[var(--foreground)]/[0.05]"><X className="h-4 w-4" /></button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)]/50 mb-1 block">{isAr ? 'التاريخ' : 'Date'}</label>
                  <input type="date" value={sessionForm.date} onChange={e => setSessionForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full rounded-xl border border-[var(--foreground)]/[0.08] bg-transparent px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--color-primary)]/40" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-[var(--foreground)]/50 mb-1 block">{isAr ? 'وقت البدء' : 'Start Time'}</label>
                    <input type="time" value={sessionForm.startTime} onChange={e => setSessionForm(f => ({ ...f, startTime: e.target.value }))}
                      className="w-full rounded-xl border border-[var(--foreground)]/[0.08] bg-transparent px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--color-primary)]/40" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--foreground)]/50 mb-1 block">{isAr ? 'وقت الانتهاء' : 'End Time'}</label>
                    <input type="time" value={sessionForm.endTime} onChange={e => setSessionForm(f => ({ ...f, endTime: e.target.value }))}
                      className="w-full rounded-xl border border-[var(--foreground)]/[0.08] bg-transparent px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--color-primary)]/40" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-[var(--foreground)]/50 mb-1 block">{isAr ? 'نوع الجلسة' : 'Session Type'}</label>
                  <select value={sessionForm.sessionType} onChange={e => setSessionForm(f => ({ ...f, sessionType: e.target.value }))}
                    className="w-full rounded-xl border border-[var(--foreground)]/[0.08] bg-transparent px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--color-primary)]/40">
                    <option value="practice">{isAr ? 'تدريب' : 'Practice'}</option>
                    <option value="study">{isAr ? 'دراسة' : 'Study'}</option>
                    <option value="project">{isAr ? 'مشروع' : 'Project'}</option>
                    <option value="review">{isAr ? 'مراجعة' : 'Review'}</option>
                  </select>
                </div>

                {/* Quality Rating */}
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)]/50 mb-2 block">{isAr ? 'جودة الجلسة' : 'Session Quality'}</label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map(r => (
                      <button key={r} onClick={() => setSessionForm(f => ({ ...f, qualityRating: r as MoodLevel }))}
                        className="flex-1 flex items-center justify-center py-2 rounded-lg transition-all">
                        <Star className={cn('h-5 w-5', r <= sessionForm.qualityRating ? 'text-amber-400 fill-amber-400' : 'text-[var(--foreground)]/10')} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Focus Rating */}
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)]/50 mb-2 block">{isAr ? 'مستوى التركيز' : 'Focus Level'}</label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map(r => (
                      <button key={r} onClick={() => setSessionForm(f => ({ ...f, focusRating: r as MoodLevel }))}
                        className={cn('flex-1 py-2 rounded-lg text-xs font-medium transition-all',
                          r <= sessionForm.focusRating ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--foreground)]/[0.04] text-[var(--foreground)]/50')}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-[var(--foreground)]/50 mb-1 block">{isAr ? 'ما تعلمته' : 'What I learned'}</label>
                  <textarea value={sessionForm.whatLearned} onChange={e => setSessionForm(f => ({ ...f, whatLearned: e.target.value }))}
                    rows={2} className="w-full rounded-xl border border-[var(--foreground)]/[0.08] bg-transparent px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--color-primary)]/40 resize-none" />
                </div>

                <div>
                  <label className="text-xs font-medium text-[var(--foreground)]/50 mb-1 block">{isAr ? 'ملاحظات' : 'Notes'}</label>
                  <textarea value={sessionForm.note} onChange={e => setSessionForm(f => ({ ...f, note: e.target.value }))}
                    rows={2} className="w-full rounded-xl border border-[var(--foreground)]/[0.08] bg-transparent px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--color-primary)]/40 resize-none" />
                </div>
              </div>

              <div className="sticky bottom-0 bg-[var(--background)] flex items-center justify-end gap-3 p-5 border-t border-[var(--foreground)]/[0.06]">
                <button onClick={() => setShowSessionForm(null)} className="px-4 py-2 rounded-xl text-sm text-[var(--foreground)]/50 hover:bg-[var(--foreground)]/[0.05]">{isAr ? 'إلغاء' : 'Cancel'}</button>
                <button onClick={handleLogSession} className="px-5 py-2 rounded-xl bg-[var(--color-primary)] text-sm font-medium text-white hover:opacity-90">{isAr ? 'حفظ' : 'Save'}</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Skill Detail Modal */}
      <AnimatePresence>
        {detailSkill && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDetailSkill(null)}
              className="fixed inset-0 z-[var(--z-overlay)] bg-black/40 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-x-4 sm:inset-x-auto sm:start-1/2 sm:-translate-x-1/2 top-[5%] sm:top-[10%] z-[var(--z-modal)] sm:w-[540px] max-h-[85vh] overflow-y-auto rounded-2xl bg-[var(--background)] border border-[var(--foreground)]/[0.08] shadow-2xl"
            >
              <SkillDetail skill={detailSkill} onClose={() => setDetailSkill(null)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function SkillDetail({ skill, onClose }: { skill: Skill; onClose: () => void }) {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const store = useAppStore();
  const stats = store.getSkillStats(skill.id);
  const sessions = store.getSkillSessions(skill.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);

  return (
    <div>
      <div className="p-5 border-b border-[var(--foreground)]/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${skill.color}20` }}>
              <GraduationCap className="h-5 w-5" style={{ color: skill.color }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{isAr ? skill.nameAr : skill.nameEn}</h2>
              <span className="text-xs text-[var(--foreground)]/40">{isAr ? CATEGORY_LABELS[skill.category]?.ar : CATEGORY_LABELS[skill.category]?.en}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--foreground)]/[0.05]"><X className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { labelEn: 'Hours', labelAr: 'ساعات', value: `${stats.totalHours}h`, icon: Clock, color: 'text-blue-500' },
            { labelEn: 'Sessions', labelAr: 'جلسات', value: stats.totalSessions, icon: BarChart3, color: 'text-purple-500' },
            { labelEn: 'Quality', labelAr: 'الجودة', value: `${stats.averageQuality}/5`, icon: Star, color: 'text-amber-500' },
          ].map((s, i) => (
            <div key={i} className="rounded-xl bg-[var(--foreground)]/[0.03] p-3 text-center">
              <s.icon className={cn('h-4 w-4 mx-auto mb-1', s.color)} />
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-[10px] text-[var(--foreground)]/40">{isAr ? s.labelAr : s.labelEn}</p>
            </div>
          ))}
        </div>

        {/* Weekly hours chart */}
        <div>
          <h3 className="text-xs font-medium text-[var(--foreground)]/50 mb-2">{isAr ? 'الساعات الأسبوعية (12 أسبوع)' : 'Weekly Hours (12 weeks)'}</h3>
          <div className="flex items-end gap-1 h-16">
            {stats.weeklyHours.map((h, i) => {
              const max = Math.max(...stats.weeklyHours, 1);
              const height = (h / max) * 100;
              return (
                <div key={i} className="flex-1 rounded-t-sm transition-all" style={{ height: `${Math.max(height, 2)}%`, backgroundColor: skill.color, opacity: 0.3 + (h / max) * 0.7 }} />
              );
            })}
          </div>
        </div>

        {/* Recent sessions */}
        <div>
          <h3 className="text-xs font-medium text-[var(--foreground)]/50 mb-2">{isAr ? 'آخر الجلسات' : 'Recent Sessions'}</h3>
          {sessions.length === 0 ? (
            <p className="text-xs text-[var(--foreground)]/30 text-center py-4">{isAr ? 'لا توجد جلسات' : 'No sessions yet'}</p>
          ) : (
            <div className="space-y-2">
              {sessions.map(s => (
                <div key={s.id} className="flex items-center justify-between rounded-lg bg-[var(--foreground)]/[0.03] px-3 py-2">
                  <div>
                    <p className="text-xs font-medium">{s.date}</p>
                    <p className="text-[10px] text-[var(--foreground)]/40">{s.startTime} - {s.endTime}</p>
                  </div>
                  <div className="text-end">
                    <p className="text-xs font-semibold">{formatDuration(s.duration)}</p>
                    <div className="flex gap-0.5 justify-end">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={cn('h-2 w-2', i < s.qualityRating ? 'text-amber-400 fill-amber-400' : 'text-[var(--foreground)]/10')} />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const CATEGORY_LABELS_REF = CATEGORY_LABELS;
