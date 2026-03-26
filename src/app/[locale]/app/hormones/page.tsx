'use client';

import React, { useState, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import { HormoneType, HORMONE_ACTIVITIES, todayString, MoodLevel, generateId } from '@/types/app';
import {
  Brain, Heart, Sun, Zap, Smile, Activity, Plus, X,
  CheckCircle2, TrendingUp, Star, Calendar, Dumbbell,
  Users, Music, Coffee, TreePine, Droplets,
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } }),
};

const HORMONE_INFO: Record<HormoneType, {
  nameEn: string; nameAr: string;
  descEn: string; descAr: string;
  roleEn: string; roleAr: string;
  icon: React.ElementType; color: string; gradient: string;
  tipsEn: string[]; tipsAr: string[];
}> = {
  dopamine: {
    nameEn: 'Dopamine', nameAr: 'الدوبامين',
    descEn: 'Often associated with motivation, reward, and the pleasure of anticipation. Plays a key role in how we experience satisfaction from achievements.',
    descAr: 'يرتبط غالبًا بالتحفيز والمكافأة ومتعة التوقع. يلعب دورًا رئيسيًا في كيفية شعورنا بالرضا من الإنجازات.',
    roleEn: 'Motivation & Reward', roleAr: 'التحفيز والمكافأة',
    icon: Zap, color: '#F59E0B', gradient: 'from-amber-500 to-orange-500',
    tipsEn: ['Complete meaningful tasks', 'Set and achieve small goals', 'Exercise regularly', 'Get quality sleep', 'Celebrate progress', 'Listen to music you enjoy'],
    tipsAr: ['أكمل مهام ذات معنى', 'ضع وحقق أهدافًا صغيرة', 'مارس الرياضة بانتظام', 'احصل على نوم جيد', 'احتفل بالتقدم', 'استمع لموسيقى تستمتع بها'],
  },
  serotonin: {
    nameEn: 'Serotonin', nameAr: 'السيروتونين',
    descEn: 'Often linked to mood stability, well-being, and feelings of calm. Sunlight exposure and regular exercise may support healthy levels.',
    descAr: 'يرتبط غالبًا باستقرار المزاج والرفاهية والشعور بالهدوء. التعرض لأشعة الشمس والتمارين المنتظمة قد تدعم مستوياته.',
    roleEn: 'Mood & Well-being', roleAr: 'المزاج والرفاهية',
    icon: Sun, color: '#3B82F6', gradient: 'from-blue-500 to-cyan-500',
    tipsEn: ['Get morning sunlight', 'Practice gratitude', 'Exercise outdoors', 'Maintain regular routines', 'Eat balanced meals', 'Practice mindfulness'],
    tipsAr: ['تعرض لشمس الصباح', 'مارس الامتنان', 'تمرن في الهواء الطلق', 'حافظ على روتين منتظم', 'تناول وجبات متوازنة', 'مارس الوعي الذهني'],
  },
  oxytocin: {
    nameEn: 'Oxytocin', nameAr: 'الأوكسيتوسين',
    descEn: 'Sometimes called the "bonding" chemical. Associated with social connection, trust, and feelings of closeness with others.',
    descAr: 'يُسمى أحيانًا هرمون "الترابط". يرتبط بالتواصل الاجتماعي والثقة والشعور بالقرب من الآخرين.',
    roleEn: 'Connection & Trust', roleAr: 'الترابط والثقة',
    icon: Heart, color: '#EC4899', gradient: 'from-pink-500 to-rose-500',
    tipsEn: ['Spend quality time with loved ones', 'Help others', 'Deep conversations', 'Group activities', 'Pet interaction', 'Acts of kindness'],
    tipsAr: ['اقضِ وقتًا مع أحبائك', 'ساعد الآخرين', 'محادثات عميقة', 'أنشطة جماعية', 'التفاعل مع الحيوانات', 'أعمال اللطف'],
  },
  endorphins: {
    nameEn: 'Endorphins', nameAr: 'الإندورفين',
    descEn: 'Natural chemicals that may help with pain relief and create feelings of well-being. Often released during vigorous physical activity.',
    descAr: 'مواد كيميائية طبيعية قد تساعد في تخفيف الألم وخلق شعور بالراحة. غالبًا ما تُفرز أثناء النشاط البدني القوي.',
    roleEn: 'Relief & Euphoria', roleAr: 'الراحة والنشوة',
    icon: Dumbbell, color: '#10B981', gradient: 'from-emerald-500 to-green-500',
    tipsEn: ['Vigorous exercise', 'Laughter', 'Dancing', 'Stretching or yoga', 'Enjoy dark chocolate', 'Regular walking'],
    tipsAr: ['تمارين مكثفة', 'الضحك', 'الرقص', 'التمدد أو اليوغا', 'تناول الشوكولاتة الداكنة', 'المشي المنتظم'],
  },
};

const ACTIVITY_LABELS: Record<string, { en: string; ar: string; icon: React.ElementType }> = {
  completed_task: { en: 'Completed a task', ar: 'أكملت مهمة', icon: CheckCircle2 },
  exercise: { en: 'Exercise', ar: 'تمرين', icon: Dumbbell },
  learned_something: { en: 'Learned something', ar: 'تعلمت شيئًا', icon: Brain },
  healthy_meal: { en: 'Healthy meal', ar: 'وجبة صحية', icon: Coffee },
  creative_work: { en: 'Creative work', ar: 'عمل إبداعي', icon: Star },
  cold_shower: { en: 'Cold shower', ar: 'دش بارد', icon: Droplets },
  meditation: { en: 'Meditation', ar: 'تأمل', icon: Brain },
  deep_work: { en: 'Deep work', ar: 'عمل عميق', icon: Zap },
  achieved_goal: { en: 'Achieved a goal', ar: 'حققت هدفًا', icon: Activity },
  music_listening: { en: 'Music listening', ar: 'استماع للموسيقى', icon: Music },
  quality_sleep: { en: 'Quality sleep', ar: 'نوم جيد', icon: Sun },
  sunlight: { en: 'Sunlight exposure', ar: 'التعرض للشمس', icon: Sun },
  sunlight_exposure: { en: 'Sunlight', ar: 'شمس', icon: Sun },
  gratitude_practice: { en: 'Gratitude', ar: 'امتنان', icon: Heart },
  nature_walk: { en: 'Nature walk', ar: 'مشي في الطبيعة', icon: TreePine },
  deep_breathing: { en: 'Deep breathing', ar: 'تنفس عميق', icon: Activity },
  journaling: { en: 'Journaling', ar: 'كتابة يوميات', icon: Star },
  stretching: { en: 'Stretching', ar: 'تمدد', icon: Activity },
  positive_thinking: { en: 'Positive thinking', ar: 'تفكير إيجابي', icon: Smile },
  routine_maintained: { en: 'Routine maintained', ar: 'حافظت على الروتين', icon: CheckCircle2 },
  social_connection: { en: 'Social connection', ar: 'تواصل اجتماعي', icon: Users },
  helping_others: { en: 'Helping others', ar: 'مساعدة الآخرين', icon: Heart },
  quality_time_family: { en: 'Family time', ar: 'وقت عائلي', icon: Users },
  deep_conversation: { en: 'Deep conversation', ar: 'محادثة عميقة', icon: Users },
  pet_interaction: { en: 'Pet interaction', ar: 'تفاعل مع حيوان', icon: Heart },
  group_activity: { en: 'Group activity', ar: 'نشاط جماعي', icon: Users },
  acts_of_kindness: { en: 'Acts of kindness', ar: 'أعمال لطف', icon: Heart },
  hugging: { en: 'Hugging', ar: 'عناق', icon: Heart },
  team_collaboration: { en: 'Team collaboration', ar: 'تعاون جماعي', icon: Users },
  volunteering: { en: 'Volunteering', ar: 'تطوع', icon: Heart },
  shared_meal: { en: 'Shared meal', ar: 'وجبة مشتركة', icon: Coffee },
  laughter_with_others: { en: 'Laughter with others', ar: 'ضحك مع الآخرين', icon: Smile },
  vigorous_exercise: { en: 'Vigorous exercise', ar: 'تمرين مكثف', icon: Dumbbell },
  laughter: { en: 'Laughter', ar: 'ضحك', icon: Smile },
  dancing: { en: 'Dancing', ar: 'رقص', icon: Activity },
  spicy_food: { en: 'Spicy food', ar: 'طعام حار', icon: Coffee },
  dark_chocolate: { en: 'Dark chocolate', ar: 'شوكولاتة داكنة', icon: Coffee },
  walking: { en: 'Walking', ar: 'مشي', icon: Activity },
  swimming: { en: 'Swimming', ar: 'سباحة', icon: Droplets },
  yoga: { en: 'Yoga', ar: 'يوغا', icon: Activity },
  sports: { en: 'Sports', ar: 'رياضة', icon: Dumbbell },
  running: { en: 'Running', ar: 'جري', icon: Activity },
  cycling: { en: 'Cycling', ar: 'ركوب دراجة', icon: Activity },
};

export default function HormonesPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const store = useAppStore();
  const today = todayString();
  const [selectedHormone, setSelectedHormone] = useState<HormoneType | null>(null);
  const [showTracker, setShowTracker] = useState(false);
  const [trackerType, setTrackerType] = useState<HormoneType>('dopamine');
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [trackerRating, setTrackerRating] = useState<MoodLevel>(3);
  const [trackerNote, setTrackerNote] = useState('');

  const todayLogs = useMemo(() =>
    store.hormoneLogs.filter(l => l.date === today),
    [store.hormoneLogs, today]
  );

  const weekLogs = useMemo(() => {
    const start = new Date(today);
    start.setDate(start.getDate() - 7);
    return store.hormoneLogs.filter(l => l.date >= start.toISOString().split('T')[0]);
  }, [store.hormoneLogs, today]);

  const handleLog = () => {
    store.logHormone({
      date: today,
      type: trackerType,
      activities: selectedActivities,
      rating: trackerRating,
      note: trackerNote,
    });
    setShowTracker(false);
    setSelectedActivities([]);
    setTrackerRating(3);
    setTrackerNote('');
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 pb-20 max-w-[1400px] mx-auto">
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{isAr ? 'الهرمونات والعافية' : 'Hormones & Wellness'}</h1>
          <p className="text-sm text-[var(--foreground)]/50 mt-1">
            {isAr ? 'فهم ودعم كيمياء جسمك بطرق صحية' : 'Understand and support your body chemistry in healthy ways'}
          </p>
        </div>
        <button onClick={() => setShowTracker(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 shadow-sm">
          <Plus className="h-4 w-4" /> {isAr ? 'تسجيل نشاط' : 'Log Activity'}
        </button>
      </motion.div>

      {/* Disclaimer */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}
        className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 mb-6">
        <p className="text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
          {isAr
            ? '⚠️ هذا القسم تعليمي وتوعوي فقط. المعلومات المقدمة عامة وليست نصيحة طبية. استشر مختصًا صحيًا للحصول على إرشادات شخصية.'
            : '⚠️ This section is educational only. Information provided is general and not medical advice. Consult a health professional for personalized guidance.'}
        </p>
      </motion.div>

      {/* Today's Summary */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}
        className="grid grid-cols-4 gap-3 mb-8">
        {(Object.keys(HORMONE_INFO) as HormoneType[]).map(type => {
          const info = HORMONE_INFO[type];
          const count = todayLogs.filter(l => l.type === type).length;
          const weekCount = weekLogs.filter(l => l.type === type).length;
          return (
            <div key={type}
              className="rounded-xl border border-[var(--foreground)]/[0.06] bg-[var(--foreground)]/[0.02] p-3 text-center cursor-pointer hover:border-[var(--foreground)]/[0.12] transition-all"
              onClick={() => setSelectedHormone(selectedHormone === type ? null : type)}
            >
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${info.color}20` }}>
                <info.icon className="h-5 w-5" style={{ color: info.color }} />
              </div>
              <p className="text-xs font-semibold">{isAr ? info.nameAr : info.nameEn}</p>
              <p className="text-[10px] text-[var(--foreground)]/40 mt-0.5">
                {count} {isAr ? 'اليوم' : 'today'} · {weekCount} {isAr ? 'هذا الأسبوع' : 'this week'}
              </p>
            </div>
          );
        })}
      </motion.div>

      {/* Hormone Cards */}
      <motion.div initial="hidden" animate="visible" className="grid md:grid-cols-2 gap-6">
        {(Object.keys(HORMONE_INFO) as HormoneType[]).map((type, i) => {
          const info = HORMONE_INFO[type];
          const isExpanded = selectedHormone === type;
          return (
            <motion.div key={type} variants={fadeUp} custom={i + 3}
              className={cn('rounded-2xl border overflow-hidden transition-all duration-300',
                isExpanded ? 'border-[var(--foreground)]/[0.12] shadow-lg' : 'border-[var(--foreground)]/[0.06]')}>
              {/* Header gradient */}
              <div className={cn('h-1.5 bg-gradient-to-r', info.gradient)} />
              <div className="p-5">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl shrink-0" style={{ backgroundColor: `${info.color}15` }}>
                    <info.icon className="h-6 w-6" style={{ color: info.color }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold">{isAr ? info.nameAr : info.nameEn}</h3>
                    <p className="text-xs font-medium mt-0.5" style={{ color: info.color }}>{isAr ? info.roleAr : info.roleEn}</p>
                  </div>
                  <button onClick={() => setSelectedHormone(isExpanded ? null : type)}
                    className="text-xs text-[var(--color-primary)] hover:underline">
                    {isExpanded ? (isAr ? 'أقل' : 'Less') : (isAr ? 'المزيد' : 'More')}
                  </button>
                </div>

                <p className="text-xs text-[var(--foreground)]/60 leading-relaxed mb-4">
                  {isAr ? info.descAr : info.descEn}
                </p>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}>
                      <h4 className="text-xs font-semibold mb-2 text-[var(--foreground)]/70">
                        {isAr ? 'طرق الدعم الصحية' : 'Healthy Support Tips'}
                      </h4>
                      <div className="space-y-1.5 mb-4">
                        {(isAr ? info.tipsAr : info.tipsEn).map((tip, j) => (
                          <div key={j} className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: info.color }} />
                            <span className="text-xs text-[var(--foreground)]/50">{tip}</span>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => { setTrackerType(type); setShowTracker(true); }}
                        className="w-full py-2 rounded-xl text-xs font-medium transition-all border"
                        style={{ borderColor: `${info.color}30`, color: info.color, backgroundColor: `${info.color}08` }}
                      >
                        {isAr ? `تسجيل نشاط ${info.nameAr}` : `Log ${info.nameEn} Activity`}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Activity Log Modal */}
      <AnimatePresence>
        {showTracker && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowTracker(false)}
              className="fixed inset-0 z-[var(--z-overlay)] bg-black/40 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-x-4 sm:inset-x-auto sm:start-1/2 sm:-translate-x-1/2 top-[5%] sm:top-[10%] z-[var(--z-modal)] sm:w-[480px] max-h-[85vh] overflow-y-auto rounded-2xl bg-[var(--background)] border border-[var(--foreground)]/[0.08] shadow-2xl"
            >
              <div className="sticky top-0 z-10 bg-[var(--background)] flex items-center justify-between p-5 border-b border-[var(--foreground)]/[0.06]">
                <h2 className="text-lg font-semibold">{isAr ? 'تسجيل نشاط العافية' : 'Log Wellness Activity'}</h2>
                <button onClick={() => setShowTracker(false)} className="p-2 rounded-lg hover:bg-[var(--foreground)]/[0.05]"><X className="h-4 w-4" /></button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)]/50 mb-2 block">{isAr ? 'النوع' : 'Type'}</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(Object.keys(HORMONE_INFO) as HormoneType[]).map(t => {
                      const info = HORMONE_INFO[t];
                      return (
                        <button key={t} onClick={() => { setTrackerType(t); setSelectedActivities([]); }}
                          className={cn('flex flex-col items-center gap-1 rounded-xl py-2.5 text-[10px] font-medium transition-all border',
                            trackerType === t ? 'border-[var(--foreground)]/[0.15] bg-[var(--foreground)]/[0.04]' : 'border-transparent')}>
                          <info.icon className="h-4 w-4" style={{ color: info.color }} />
                          {isAr ? info.nameAr : info.nameEn}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-[var(--foreground)]/50 mb-2 block">{isAr ? 'الأنشطة' : 'Activities'}</label>
                  <div className="flex flex-wrap gap-1.5">
                    {HORMONE_ACTIVITIES[trackerType].map(act => {
                      const label = ACTIVITY_LABELS[act];
                      const selected = selectedActivities.includes(act);
                      return (
                        <button key={act}
                          onClick={() => setSelectedActivities(prev => selected ? prev.filter(a => a !== act) : [...prev, act])}
                          className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all border',
                            selected ? 'border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'border-[var(--foreground)]/[0.08] text-[var(--foreground)]/50')}>
                          {label && <label.icon className="h-3 w-3" />}
                          {label ? (isAr ? label.ar : label.en) : act}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-[var(--foreground)]/50 mb-2 block">{isAr ? 'التقييم' : 'Rating'}</label>
                  <div className="flex gap-2 justify-center">
                    {[1, 2, 3, 4, 5].map(r => (
                      <button key={r} onClick={() => setTrackerRating(r as MoodLevel)}>
                        <Star className={cn('h-6 w-6', r <= trackerRating ? 'text-amber-400 fill-amber-400' : 'text-[var(--foreground)]/10')} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-[var(--foreground)]/50 mb-1 block">{isAr ? 'ملاحظات' : 'Notes'}</label>
                  <textarea value={trackerNote} onChange={e => setTrackerNote(e.target.value)} rows={2}
                    className="w-full rounded-xl border border-[var(--foreground)]/[0.08] bg-transparent px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--color-primary)]/40 resize-none" />
                </div>
              </div>

              <div className="sticky bottom-0 bg-[var(--background)] flex justify-end gap-3 p-5 border-t border-[var(--foreground)]/[0.06]">
                <button onClick={() => setShowTracker(false)} className="px-4 py-2 rounded-xl text-sm text-[var(--foreground)]/50">{isAr ? 'إلغاء' : 'Cancel'}</button>
                <button onClick={handleLog} disabled={selectedActivities.length === 0}
                  className="px-5 py-2 rounded-xl bg-[var(--color-primary)] text-sm font-medium text-white hover:opacity-90 disabled:opacity-40">
                  {isAr ? 'حفظ' : 'Save'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
