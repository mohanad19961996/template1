'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import { WeekDay } from '@/types/app';
import {
  Settings, User, Globe, Palette, Bell, Clock, Shield,
  Download, Upload, Trash2, Save, Monitor, Moon, Sun,
  CheckCircle2, Droplets, Target,
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } }),
};

export default function SettingsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const store = useAppStore();
  const s = store.settings;
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  const showSaved = () => { setSavedMsg(true); setTimeout(() => setSavedMsg(false), 2000); };

  const handleExport = () => {
    const data = store.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habits-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (store.importData(importText)) {
      setShowImport(false);
      setImportText('');
      showSaved();
    }
  };

  const Section = ({ titleEn, titleAr, icon: Icon, children }: {
    titleEn: string; titleAr: string; icon: React.ElementType; children: React.ReactNode;
  }) => (
    <div className="rounded-2xl border border-[var(--foreground)]/[0.1] bg-[var(--foreground)]/[0.04] overflow-hidden">
      <div className="flex items-center gap-3 p-5 border-b border-[var(--foreground)]/[0.1]">
        <Icon className="h-4 w-4 text-[var(--color-primary)]" />
        <h2 className="text-sm font-semibold">{isAr ? titleAr : titleEn}</h2>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );

  const Field = ({ labelEn, labelAr, children }: { labelEn: string; labelAr: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-[var(--foreground)]/80">{isAr ? labelAr : labelEn}</span>
      {children}
    </div>
  );

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 pb-20 max-w-[800px] mx-auto">
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{isAr ? 'الإعدادات' : 'Settings'}</h1>
        <p className="text-sm text-[var(--foreground)]/70 mt-1">{isAr ? 'تخصيص تجربتك' : 'Customize your experience'}</p>
      </motion.div>

      {savedMsg && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 text-sm text-emerald-600">
          <CheckCircle2 className="h-4 w-4" /> {isAr ? 'تم الحفظ' : 'Saved!'}
        </motion.div>
      )}

      <motion.div initial="hidden" animate="visible" className="space-y-6">
        {/* Profile */}
        <motion.div variants={fadeUp} custom={1}>
          <Section titleEn="Profile" titleAr="الملف الشخصي" icon={User}>
            <Field labelEn="Display Name" labelAr="اسم العرض">
              <input value={s.displayName}
                onChange={e => { store.updateSettings({ displayName: e.target.value }); }}
                placeholder={isAr ? 'اسمك' : 'Your name'}
                className="w-48 rounded-lg border border-[var(--foreground)]/[0.12] bg-transparent px-3 py-1.5 text-xs text-end focus:outline-none focus:border-[var(--color-primary)]/40" />
            </Field>
          </Section>
        </motion.div>

        {/* Preferences */}
        <motion.div variants={fadeUp} custom={2}>
          <Section titleEn="Preferences" titleAr="التفضيلات" icon={Settings}>
            <Field labelEn="Week Starts On" labelAr="بداية الأسبوع">
              <select value={s.weekStartDay}
                onChange={e => store.updateSettings({ weekStartDay: Number(e.target.value) as WeekDay })}
                className="rounded-lg border border-[var(--foreground)]/[0.12] bg-transparent px-3 py-1.5 text-xs focus:outline-none focus:border-[var(--color-primary)]/40">
                {[
                  { en: 'Sunday', ar: 'الأحد', val: 0 },
                  { en: 'Monday', ar: 'الإثنين', val: 1 },
                  { en: 'Saturday', ar: 'السبت', val: 6 },
                ].map(d => (
                  <option key={d.val} value={d.val}>{isAr ? d.ar : d.en}</option>
                ))}
              </select>
            </Field>

            <Field labelEn="Hydration Target (glasses)" labelAr="هدف الترطيب (أكواب)">
              <input type="number" min={1} max={20} value={s.hydrationTarget}
                onChange={e => store.updateSettings({ hydrationTarget: Number(e.target.value) })}
                className="w-20 rounded-lg border border-[var(--foreground)]/[0.12] bg-transparent px-3 py-1.5 text-xs text-center focus:outline-none focus:border-[var(--color-primary)]/40" />
            </Field>

            <Field labelEn="Daily Focus Target (min)" labelAr="هدف التركيز اليومي (دقيقة)">
              <input type="number" min={15} max={720} step={15} value={s.focusTarget}
                onChange={e => store.updateSettings({ focusTarget: Number(e.target.value) })}
                className="w-20 rounded-lg border border-[var(--foreground)]/[0.12] bg-transparent px-3 py-1.5 text-xs text-center focus:outline-none focus:border-[var(--color-primary)]/40" />
            </Field>

            <Field labelEn="Sleep Target (hours)" labelAr="هدف النوم (ساعات)">
              <input type="number" min={4} max={12} step={0.5} value={s.sleepTarget}
                onChange={e => store.updateSettings({ sleepTarget: Number(e.target.value) })}
                className="w-20 rounded-lg border border-[var(--foreground)]/[0.12] bg-transparent px-3 py-1.5 text-xs text-center focus:outline-none focus:border-[var(--color-primary)]/40" />
            </Field>

            <Field labelEn="Sound Effects" labelAr="المؤثرات الصوتية">
              <button
                onClick={() => store.updateSettings({ soundEnabled: !s.soundEnabled })}
                className={cn('relative h-6 w-11 rounded-full transition-colors duration-200',
                  s.soundEnabled ? 'bg-[var(--color-primary)]' : 'bg-[var(--foreground)]/[0.15]')}>
                <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
                  s.soundEnabled ? 'translate-x-5' : 'translate-x-0.5')} />
              </button>
            </Field>
          </Section>
        </motion.div>

        {/* Data Management */}
        <motion.div variants={fadeUp} custom={3}>
          <Section titleEn="Data Management" titleAr="إدارة البيانات" icon={Shield}>
            <div className="flex gap-3">
              <button onClick={handleExport}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-[var(--foreground)]/[0.12] py-2.5 text-xs font-medium hover:bg-[var(--foreground)]/[0.08] transition-colors">
                <Download className="h-3.5 w-3.5" /> {isAr ? 'تصدير البيانات' : 'Export Data'}
              </button>
              <button onClick={() => setShowImport(true)}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-[var(--foreground)]/[0.12] py-2.5 text-xs font-medium hover:bg-[var(--foreground)]/[0.08] transition-colors">
                <Upload className="h-3.5 w-3.5" /> {isAr ? 'استيراد البيانات' : 'Import Data'}
              </button>
            </div>

            {showImport && (
              <div className="space-y-2">
                <textarea
                  value={importText}
                  onChange={e => setImportText(e.target.value)}
                  placeholder={isAr ? 'الصق بيانات JSON هنا...' : 'Paste JSON data here...'}
                  rows={4}
                  className="w-full rounded-xl border border-[var(--foreground)]/[0.12] bg-transparent px-3 py-2 text-xs font-mono focus:outline-none focus:border-[var(--color-primary)]/40 resize-none"
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowImport(false)} className="px-3 py-1.5 rounded-lg text-xs text-[var(--foreground)]/70">{isAr ? 'إلغاء' : 'Cancel'}</button>
                  <button onClick={handleImport} className="px-3 py-1.5 rounded-lg bg-[var(--color-primary)] text-xs text-white font-medium">{isAr ? 'استيراد' : 'Import'}</button>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-[var(--foreground)]/[0.1]">
              {!showConfirmReset ? (
                <button onClick={() => setShowConfirmReset(true)}
                  className="flex items-center gap-2 text-xs text-red-500 hover:text-red-600">
                  <Trash2 className="h-3.5 w-3.5" /> {isAr ? 'حذف جميع البيانات' : 'Delete All Data'}
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-red-500">{isAr ? 'هل أنت متأكد؟' : 'Are you sure?'}</span>
                  <button onClick={() => { store.resetData(); setShowConfirmReset(false); showSaved(); }}
                    className="px-3 py-1 rounded-lg bg-red-500 text-xs text-white font-medium">{isAr ? 'نعم، حذف' : 'Yes, Delete'}</button>
                  <button onClick={() => setShowConfirmReset(false)}
                    className="px-3 py-1 rounded-lg text-xs text-[var(--foreground)]/70">{isAr ? 'إلغاء' : 'Cancel'}</button>
                </div>
              )}
            </div>
          </Section>
        </motion.div>

        {/* Stats */}
        <motion.div variants={fadeUp} custom={4}>
          <div className="rounded-2xl border border-[var(--foreground)]/[0.1] bg-[var(--foreground)]/[0.04] p-5">
            <h3 className="text-xs font-semibold text-[var(--foreground)]/60 mb-3 uppercase tracking-wider">{isAr ? 'إحصائيات البيانات' : 'Data Stats'}</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { labelEn: 'Habits', labelAr: 'عادات', value: store.habits.length },
                { labelEn: 'Skills', labelAr: 'مهارات', value: store.skills.length },
                { labelEn: 'Habit Logs', labelAr: 'سجلات عادات', value: store.habitLogs.length },
                { labelEn: 'Skill Sessions', labelAr: 'جلسات مهارات', value: store.skillSessions.length },
                { labelEn: 'Goals', labelAr: 'أهداف', value: store.goals.length },
                { labelEn: 'Reminders', labelAr: 'تذكيرات', value: store.reminders.length },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-lg font-bold">{stat.value}</p>
                  <p className="text-[10px] text-[var(--foreground)]/60">{isAr ? stat.labelAr : stat.labelEn}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
