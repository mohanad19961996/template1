'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Link } from '@/i18n/navigation';
import {
  ArrowLeft, BookOpen, CheckCircle2, Timer, Hash, Target, Clock, Flame,
  Trophy, Calendar, Eye, BarChart3, Lightbulb, Repeat, Gift, MapPin,
  Hourglass, Star, Play, Pause, Square, ChevronDown, ChevronRight,
  Zap, Award, SlidersHorizontal, LayoutGrid, List, Columns3,
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.5 } }),
} as const;

type Section = {
  id: string;
  iconEn: React.ReactNode;
  titleEn: string;
  titleAr: string;
  contentEn: React.ReactNode;
  contentAr: React.ReactNode;
};

function GuideSection({ section, index, isAr, open, onToggle }: { section: Section; index: number; isAr: boolean; open: boolean; onToggle: () => void }) {
  return (
    <motion.div
      variants={fadeUp}
      custom={index + 2}
      initial="hidden"
      animate="visible"
      className="rounded-2xl border border-[var(--foreground)]/[0.15] overflow-hidden transition-shadow hover:shadow-lg"
      style={{ background: 'linear-gradient(180deg, rgba(var(--color-primary-rgb) / 0.02), transparent)' }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-6 py-5 text-start cursor-pointer transition-all hover:bg-[var(--foreground)]/[0.02]"
      >
        <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(var(--color-primary-rgb) / 0.1)' }}>
          {section.iconEn}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold">{isAr ? section.titleAr : section.titleEn}</h3>
        </div>
        <motion.div animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronRight className="h-5 w-5 text-[var(--foreground)]/30" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 text-sm text-[var(--foreground)]/70 leading-relaxed space-y-4"
              style={{ borderTop: '1px solid rgba(var(--color-primary-rgb) / 0.06)' }}>
              <div className="pt-4">
                {isAr ? section.contentAr : section.contentEn}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Tip({ children, isAr }: { children: React.ReactNode; isAr: boolean }) {
  return (
    <div className="flex gap-3 p-4 rounded-xl border border-amber-500/15 bg-amber-500/5">
      <Lightbulb className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
      <div className="text-sm">{children}</div>
    </div>
  );
}

function KeyBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/15">
      {children}
    </span>
  );
}

export default function HabitsGuidePage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['overview']));

  const toggle = (id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const sections: Section[] = [
    {
      id: 'overview',
      iconEn: <BookOpen className="h-5 w-5 text-[var(--color-primary)]" />,
      titleEn: 'How the Habits System Works',
      titleAr: 'كيف يعمل نظام العادات',
      contentEn: (
        <div className="space-y-4">
          <p>The habits system is designed around the <strong>Habit Loop</strong> framework: <strong>Cue → Routine → Reward</strong>. Each habit you create can be customized with triggers, routines, and rewards to build strong neural pathways.</p>
          <p>There are <strong>3 types of habit tracking</strong>:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl p-4 border border-emerald-500/15 bg-emerald-500/5">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 mb-2" />
              <p className="font-bold text-sm">Boolean (Yes/No)</p>
              <p className="text-xs text-[var(--foreground)]/50 mt-1">Simple daily check-in. Did you do it or not? Available after 9 PM to evaluate your full day.</p>
            </div>
            <div className="rounded-xl p-4 border border-blue-500/15 bg-blue-500/5">
              <Timer className="h-5 w-5 text-blue-500 mb-2" />
              <p className="font-bold text-sm">Timer-Based</p>
              <p className="text-xs text-[var(--foreground)]/50 mt-1">Habits with a duration goal. Start the timer, do the work, and the habit auto-completes when time is up.</p>
            </div>
            <div className="rounded-xl p-4 border border-violet-500/15 bg-violet-500/5">
              <Hash className="h-5 w-5 text-violet-500 mb-2" />
              <p className="font-bold text-sm">Count-Based</p>
              <p className="text-xs text-[var(--foreground)]/50 mt-1">Track numeric targets like "8 cups of water" or "50 pushups". Increment throughout the day.</p>
            </div>
          </div>
          <Tip isAr={false}>
            <strong>Pro tip:</strong> Start with 2-3 habits max. Adding too many at once leads to burnout and abandonment. Master a few, then add more.
          </Tip>
        </div>
      ),
      contentAr: (
        <div className="space-y-4">
          <p>نظام العادات مبني على إطار <strong>حلقة العادة</strong>: <strong>الإشارة ← الروتين ← المكافأة</strong>. كل عادة تنشئها يمكن تخصيصها بمحفزات وروتين ومكافآت لبناء مسارات عصبية قوية.</p>
          <p>هناك <strong>3 أنواع لتتبع العادات</strong>:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl p-4 border border-emerald-500/15 bg-emerald-500/5">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 mb-2" />
              <p className="font-bold text-sm">نعم/لا (تسجيل يومي)</p>
              <p className="text-xs text-[var(--foreground)]/50 mt-1">تسجيل يومي بسيط. هل أنجزتها أم لا؟ متاح بعد الساعة ٩ مساءً لتقييم يومك بالكامل.</p>
            </div>
            <div className="rounded-xl p-4 border border-blue-500/15 bg-blue-500/5">
              <Timer className="h-5 w-5 text-blue-500 mb-2" />
              <p className="font-bold text-sm">مؤقت زمني</p>
              <p className="text-xs text-[var(--foreground)]/50 mt-1">عادات بهدف زمني. شغّل المؤقت، أنجز العمل، وتُكتمل العادة تلقائيًا عند انتهاء الوقت.</p>
            </div>
            <div className="rounded-xl p-4 border border-violet-500/15 bg-violet-500/5">
              <Hash className="h-5 w-5 text-violet-500 mb-2" />
              <p className="font-bold text-sm">تتبع عددي</p>
              <p className="text-xs text-[var(--foreground)]/50 mt-1">تتبع أهداف رقمية مثل "٨ أكواب ماء" أو "٥٠ تمرين ضغط". زِد العدد خلال اليوم.</p>
            </div>
          </div>
          <Tip isAr={true}>
            <strong>نصيحة:</strong> ابدأ بـ ٢-٣ عادات كحد أقصى. إضافة الكثير دفعة واحدة يؤدي للإرهاق والتخلي. أتقن القليل ثم أضف المزيد.
          </Tip>
        </div>
      ),
    },
    {
      id: 'card',
      iconEn: <LayoutGrid className="h-5 w-5 text-[var(--color-primary)]" />,
      titleEn: 'Understanding the Habit Card',
      titleAr: 'فهم بطاقة العادة',
      contentEn: (
        <div className="space-y-4">
          <p>Each habit card is a complete dashboard for one habit. Here's what every section means:</p>
          <div className="space-y-3">
            <div className="flex gap-3 items-start">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-[var(--foreground)]/[0.05]"><span className="text-sm font-black">1</span></div>
              <div><p className="font-bold">Header</p><p className="text-xs text-[var(--foreground)]/50">Habit name, color dot, order number, and action menu (edit, archive, delete).</p></div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-[var(--foreground)]/[0.05]"><span className="text-sm font-black">2</span></div>
              <div><p className="font-bold">Status Banner</p><p className="text-xs text-[var(--foreground)]/50">Shows your current state — streak count, available time window, or motivational message.</p></div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-blue-500/10"><Timer className="h-4 w-4 text-blue-500" /></div>
              <div><p className="font-bold">Timer / Check-in Panel</p><p className="text-xs text-[var(--foreground)]/50"><strong>Timer habits:</strong> Full timer with start/pause/stop controls, progress bar, and countdown. <strong>Boolean habits:</strong> Shows "Daily Check-in" panel — available after 9 PM. <strong>Count habits:</strong> Shows timer area disabled.</p></div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-emerald-500/10"><CheckCircle2 className="h-4 w-4 text-emerald-500" /></div>
              <div><p className="font-bold">Mark Done Button</p><p className="text-xs text-[var(--foreground)]/50"><strong>Boolean:</strong> "Yes, I did it" — only available after 9 PM. <strong>Timer:</strong> Disabled until timer completes. <strong>Count:</strong> Auto-completes when target is reached.</p></div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-violet-500/10"><Hash className="h-4 w-4 text-violet-500" /></div>
              <div><p className="font-bold">Count Controls (+/-)</p><p className="text-xs text-[var(--foreground)]/50">Increment/decrement buttons with progress bar. Only active for count-type habits.</p></div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-amber-500/10"><Trophy className="h-4 w-4 text-amber-500" /></div>
              <div><p className="font-bold">Streak Challenges</p><p className="text-xs text-[var(--foreground)]/50">Up to 3 streak milestones with rewards. Each day is shown as a dot — colored when completed, gray when remaining. Progress percentage is displayed.</p></div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-sky-500/10"><Calendar className="h-4 w-4 text-sky-500" /></div>
              <div><p className="font-bold">This Week</p><p className="text-xs text-[var(--foreground)]/50">Mon-Sun dots showing this week's performance. <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" /> Done, <span className="inline-block h-2 w-2 rounded-full bg-amber-500" /> Late, <span className="inline-block h-2 w-2 rounded-full bg-red-400/60" /> Missed. Click to open full calendar.</p></div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-orange-500/10"><BarChart3 className="h-4 w-4 text-orange-500" /></div>
              <div><p className="font-bold">Stats Row</p><p className="text-xs text-[var(--foreground)]/50">Current streak, best streak, completion rate, and total time/count.</p></div>
            </div>
          </div>
        </div>
      ),
      contentAr: (
        <div className="space-y-4">
          <p>كل بطاقة عادة هي لوحة تحكم كاملة لعادة واحدة. إليك ما يعنيه كل قسم:</p>
          <div className="space-y-3">
            <div className="flex gap-3 items-start">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-[var(--foreground)]/[0.05]"><span className="text-sm font-black">١</span></div>
              <div><p className="font-bold">الرأس</p><p className="text-xs text-[var(--foreground)]/50">اسم العادة، النقطة الملونة، رقم الترتيب، وقائمة الإجراءات (تعديل، أرشفة، حذف).</p></div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-[var(--foreground)]/[0.05]"><span className="text-sm font-black">٢</span></div>
              <div><p className="font-bold">شريط الحالة</p><p className="text-xs text-[var(--foreground)]/50">يعرض حالتك الحالية — عدد أيام السلسلة، نافذة الوقت المتاحة، أو رسالة تحفيزية.</p></div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-blue-500/10"><Timer className="h-4 w-4 text-blue-500" /></div>
              <div><p className="font-bold">لوحة المؤقت / التسجيل</p><p className="text-xs text-[var(--foreground)]/50"><strong>عادات المؤقت:</strong> مؤقت كامل مع أزرار تشغيل/إيقاف/إنهاء. <strong>عادات نعم/لا:</strong> لوحة "تسجيل يومي" — متاحة بعد ٩ مساءً. <strong>عادات العدد:</strong> منطقة المؤقت معطلة.</p></div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-emerald-500/10"><CheckCircle2 className="h-4 w-4 text-emerald-500" /></div>
              <div><p className="font-bold">زر الإكمال</p><p className="text-xs text-[var(--foreground)]/50"><strong>نعم/لا:</strong> "نعم، أنجزتها" — متاح فقط بعد ٩ مساءً. <strong>مؤقت:</strong> معطل حتى ينتهي المؤقت. <strong>عدد:</strong> يكتمل تلقائيًا عند بلوغ الهدف.</p></div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-violet-500/10"><Hash className="h-4 w-4 text-violet-500" /></div>
              <div><p className="font-bold">أزرار العدد (+/-)</p><p className="text-xs text-[var(--foreground)]/50">أزرار زيادة/نقصان مع شريط تقدم. نشطة فقط لعادات النوع العددي.</p></div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-amber-500/10"><Trophy className="h-4 w-4 text-amber-500" /></div>
              <div><p className="font-bold">تحديات السلسلة</p><p className="text-xs text-[var(--foreground)]/50">حتى ٣ مراحل للسلسلة مع مكافآت. كل يوم يُعرض كنقطة — ملونة عند الإكمال، رمادية عند المتبقي. النسبة المئوية معروضة.</p></div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-sky-500/10"><Calendar className="h-4 w-4 text-sky-500" /></div>
              <div><p className="font-bold">هذا الأسبوع</p><p className="text-xs text-[var(--foreground)]/50">نقاط الإثنين-الأحد تعرض أداء الأسبوع. <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" /> مكتمل، <span className="inline-block h-2 w-2 rounded-full bg-amber-500" /> متأخر، <span className="inline-block h-2 w-2 rounded-full bg-red-400/60" /> فائت. اضغط لفتح التقويم الكامل.</p></div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-orange-500/10"><BarChart3 className="h-4 w-4 text-orange-500" /></div>
              <div><p className="font-bold">صف الإحصائيات</p><p className="text-xs text-[var(--foreground)]/50">السلسلة الحالية، أفضل سلسلة، معدل الإكمال، وإجمالي الوقت/العدد.</p></div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'timewindow',
      iconEn: <Clock className="h-5 w-5 text-[var(--color-primary)]" />,
      titleEn: 'Time Windows & Strict Mode',
      titleAr: 'نوافذ الوقت والوضع الصارم',
      contentEn: (
        <div className="space-y-4">
          <p>Time windows define <strong>when</strong> a habit should be done. There are two modes:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl p-4 border border-blue-500/15 bg-blue-500/5">
              <p className="font-bold text-sm mb-2">Flexible Window</p>
              <p className="text-xs text-[var(--foreground)]/50">Sets an ideal time range. You can still complete the habit outside the window, but it shows as <span className="text-amber-500 font-bold">orange (late)</span> in the calendar instead of <span className="text-emerald-500 font-bold">green</span>.</p>
            </div>
            <div className="rounded-xl p-4 border border-red-500/15 bg-red-500/5">
              <p className="font-bold text-sm mb-2">Strict Window</p>
              <p className="text-xs text-[var(--foreground)]/50">Locks the habit — you can <strong>only</strong> complete it within the time window. Before the window: "Not yet". After the window: "Window passed" and it's marked as missed.</p>
            </div>
          </div>
          <Tip isAr={false}>
            <strong>Use strict mode for:</strong> Morning routines, prayer times, medication schedules — anything where timing is critical. Use flexible mode for habits where you just want to track the ideal time.
          </Tip>
          <div className="rounded-xl p-4 border border-[var(--foreground)]/[0.15] bg-[var(--foreground)]/[0.02]">
            <p className="font-bold text-sm mb-2">Calendar Color Legend</p>
            <div className="flex flex-wrap gap-4 mt-2">
              <span className="flex items-center gap-2"><span className="h-4 w-4 rounded bg-emerald-500" /><span className="text-xs">Done in window</span></span>
              <span className="flex items-center gap-2"><span className="h-4 w-4 rounded bg-amber-500" /><span className="text-xs">Done late (outside window)</span></span>
              <span className="flex items-center gap-2"><span className="h-4 w-4 rounded bg-red-500/70" /><span className="text-xs">Missed</span></span>
            </div>
          </div>
        </div>
      ),
      contentAr: (
        <div className="space-y-4">
          <p>نوافذ الوقت تحدد <strong>متى</strong> يجب إنجاز العادة. هناك وضعان:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl p-4 border border-blue-500/15 bg-blue-500/5">
              <p className="font-bold text-sm mb-2">نافذة مرنة</p>
              <p className="text-xs text-[var(--foreground)]/50">تحدد نطاقًا زمنيًا مثاليًا. يمكنك إكمال العادة خارج النافذة، لكنها تظهر <span className="text-amber-500 font-bold">برتقالية (متأخرة)</span> في التقويم بدلاً من <span className="text-emerald-500 font-bold">خضراء</span>.</p>
            </div>
            <div className="rounded-xl p-4 border border-red-500/15 bg-red-500/5">
              <p className="font-bold text-sm mb-2">نافذة صارمة</p>
              <p className="text-xs text-[var(--foreground)]/50">تقفل العادة — يمكنك <strong>فقط</strong> إكمالها ضمن نافذة الوقت. قبل النافذة: "لم يحن الوقت بعد". بعد النافذة: "فات الوقت" وتُسجل كفائتة.</p>
            </div>
          </div>
          <Tip isAr={true}>
            <strong>استخدم الوضع الصارم لـ:</strong> الروتين الصباحي، مواعيد الصلاة، الأدوية — أي شيء التوقيت فيه حرج. استخدم الوضع المرن للعادات التي تريد تتبع الوقت المثالي فقط.
          </Tip>
          <div className="rounded-xl p-4 border border-[var(--foreground)]/[0.15] bg-[var(--foreground)]/[0.02]">
            <p className="font-bold text-sm mb-2">دليل ألوان التقويم</p>
            <div className="flex flex-wrap gap-4 mt-2">
              <span className="flex items-center gap-2"><span className="h-4 w-4 rounded bg-emerald-500" /><span className="text-xs">مكتمل في الوقت</span></span>
              <span className="flex items-center gap-2"><span className="h-4 w-4 rounded bg-amber-500" /><span className="text-xs">مكتمل متأخر</span></span>
              <span className="flex items-center gap-2"><span className="h-4 w-4 rounded bg-red-500/70" /><span className="text-xs">فائت</span></span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'habitloop',
      iconEn: <Repeat className="h-5 w-5 text-[var(--color-primary)]" />,
      titleEn: 'Habit Loop: Cue → Routine → Reward',
      titleAr: 'حلقة العادة: الإشارة ← الروتين ← المكافأة',
      contentEn: (
        <div className="space-y-4">
          <p>Every habit has an optional <strong>Habit Loop</strong> based on neuroscience research. Fill these in to make your habits stick:</p>
          <div className="flex items-stretch gap-3">
            <div className="flex-1 rounded-xl p-4 border border-amber-500/15 bg-amber-500/5 text-center">
              <Lightbulb className="h-6 w-6 text-amber-500 mx-auto mb-2" />
              <p className="font-bold text-sm">Cue</p>
              <p className="text-xs text-[var(--foreground)]/50 mt-1">What triggers the habit? "After morning prayer" or "When I see my gym bag"</p>
            </div>
            <div className="flex items-center"><ChevronRight className="h-4 w-4 text-[var(--foreground)]/20" /></div>
            <div className="flex-1 rounded-xl p-4 border border-blue-500/15 bg-blue-500/5 text-center">
              <Repeat className="h-6 w-6 text-blue-500 mx-auto mb-2" />
              <p className="font-bold text-sm">Routine</p>
              <p className="text-xs text-[var(--foreground)]/50 mt-1">The actual behavior. "30 minutes of reading" or "Run 5km"</p>
            </div>
            <div className="flex items-center"><ChevronRight className="h-4 w-4 text-[var(--foreground)]/20" /></div>
            <div className="flex-1 rounded-xl p-4 border border-emerald-500/15 bg-emerald-500/5 text-center">
              <Gift className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-sm">Reward</p>
              <p className="text-xs text-[var(--foreground)]/50 mt-1">What you get. "A cup of coffee" or "10 min of social media"</p>
            </div>
          </div>
          <Tip isAr={false}>
            <strong>Stack habits:</strong> Use the completion of one habit as the cue for the next. "After I finish my workout → I drink my protein shake → I earn 15 min of free time."
          </Tip>
        </div>
      ),
      contentAr: (
        <div className="space-y-4">
          <p>كل عادة تحتوي على <strong>حلقة العادة</strong> الاختيارية المبنية على أبحاث علم الأعصاب. املأها لتثبيت عاداتك:</p>
          <div className="flex items-stretch gap-3">
            <div className="flex-1 rounded-xl p-4 border border-amber-500/15 bg-amber-500/5 text-center">
              <Lightbulb className="h-6 w-6 text-amber-500 mx-auto mb-2" />
              <p className="font-bold text-sm">الإشارة</p>
              <p className="text-xs text-[var(--foreground)]/50 mt-1">ما الذي يحفز العادة؟ "بعد صلاة الفجر" أو "عندما أرى حقيبة الرياضة"</p>
            </div>
            <div className="flex items-center"><ChevronRight className="h-4 w-4 text-[var(--foreground)]/20 rotate-180" /></div>
            <div className="flex-1 rounded-xl p-4 border border-blue-500/15 bg-blue-500/5 text-center">
              <Repeat className="h-6 w-6 text-blue-500 mx-auto mb-2" />
              <p className="font-bold text-sm">الروتين</p>
              <p className="text-xs text-[var(--foreground)]/50 mt-1">السلوك الفعلي. "٣٠ دقيقة قراءة" أو "جري ٥ كيلو"</p>
            </div>
            <div className="flex items-center"><ChevronRight className="h-4 w-4 text-[var(--foreground)]/20 rotate-180" /></div>
            <div className="flex-1 rounded-xl p-4 border border-emerald-500/15 bg-emerald-500/5 text-center">
              <Gift className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-sm">المكافأة</p>
              <p className="text-xs text-[var(--foreground)]/50 mt-1">ما تحصل عليه. "كوب قهوة" أو "١٠ دقائق تصفح"</p>
            </div>
          </div>
          <Tip isAr={true}>
            <strong>سلسل العادات:</strong> استخدم إكمال عادة كإشارة للتالية. "بعد التمرين ← أشرب البروتين ← أحصل على ١٥ دقيقة وقت حر."
          </Tip>
        </div>
      ),
    },
    {
      id: 'streaks',
      iconEn: <Flame className="h-5 w-5 text-[var(--color-primary)]" />,
      titleEn: 'Streaks & Challenges',
      titleAr: 'السلاسل والتحديات',
      contentEn: (
        <div className="space-y-4">
          <p>Streaks are your most powerful motivator. The system tracks:</p>
          <ul className="space-y-2 list-none">
            <li className="flex gap-2"><Flame className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" /><span><strong>Current Streak:</strong> Consecutive days you've completed the habit.</span></li>
            <li className="flex gap-2"><Star className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" /><span><strong>Best Streak:</strong> Your all-time record. Try to beat it!</span></li>
            <li className="flex gap-2"><Trophy className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" /><span><strong>Streak Challenges:</strong> Set up to 3 milestone goals (e.g., 7, 30, 90 days) with custom rewards.</span></li>
          </ul>
          <p>Each challenge shows a <strong>dot for every day</strong> — filled dots are completed days, gray dots are remaining. The percentage shows your progress toward that goal.</p>
          <Tip isAr={false}>
            <strong>Never break the chain!</strong> Missing one day resets your streak. If you're struggling, lower the bar — a 5-minute walk still counts as exercise. The goal is consistency, not perfection.
          </Tip>
        </div>
      ),
      contentAr: (
        <div className="space-y-4">
          <p>السلاسل هي أقوى محفز لديك. النظام يتتبع:</p>
          <ul className="space-y-2 list-none">
            <li className="flex gap-2"><Flame className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" /><span><strong>السلسلة الحالية:</strong> الأيام المتتالية التي أكملت فيها العادة.</span></li>
            <li className="flex gap-2"><Star className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" /><span><strong>أفضل سلسلة:</strong> رقمك القياسي. حاول تجاوزه!</span></li>
            <li className="flex gap-2"><Trophy className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" /><span><strong>تحديات السلسلة:</strong> حدد حتى ٣ أهداف (مثل ٧، ٣٠، ٩٠ يوم) مع مكافآت مخصصة.</span></li>
          </ul>
          <p>كل تحدٍ يعرض <strong>نقطة لكل يوم</strong> — النقاط الملونة هي الأيام المكتملة، الرمادية هي المتبقية. النسبة المئوية تعرض تقدمك نحو الهدف.</p>
          <Tip isAr={true}>
            <strong>لا تكسر السلسلة!</strong> تفويت يوم واحد يعيد السلسلة للصفر. إذا كنت تكافح، قلل المعيار — مشي ٥ دقائق يُحسب كرياضة. الهدف هو الاستمرارية، ليس الكمال.
          </Tip>
        </div>
      ),
    },
    {
      id: 'views',
      iconEn: <Eye className="h-5 w-5 text-[var(--color-primary)]" />,
      titleEn: 'View Modes & Organization',
      titleAr: 'أوضاع العرض والتنظيم',
      contentEn: (
        <div className="space-y-4">
          <p>Choose the view that fits your workflow:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: <LayoutGrid className="h-4 w-4" />, name: 'Cards', desc: 'Full detail cards with timer, stats, and weekly view. Best for daily use.' },
              { icon: <Columns3 className="h-4 w-4" />, name: 'Grid', desc: 'Compact cards in a dense grid. Good for quick overview.' },
              { icon: <List className="h-4 w-4" />, name: 'List', desc: 'Minimal rows with quick actions. Fast for checking off habits.' },
              { icon: <BarChart3 className="h-4 w-4" />, name: 'Board', desc: 'Kanban-style board grouped by category. Great for visualization.' },
            ].map(v => (
              <div key={v.name} className="flex gap-3 p-3 rounded-xl border border-[var(--foreground)]/[0.15]">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-[var(--color-primary)]/10 text-[var(--color-primary)]">{v.icon}</div>
                <div><p className="font-bold text-sm">{v.name}</p><p className="text-xs text-[var(--foreground)]/50">{v.desc}</p></div>
              </div>
            ))}
          </div>
          <p className="text-xs text-[var(--foreground)]/40">You can also use the <KeyBadge>Compliance Table</KeyBadge> button to see all habits across dates in a spreadsheet-style view, and the <KeyBadge>History</KeyBadge> button to see your completion log.</p>
        </div>
      ),
      contentAr: (
        <div className="space-y-4">
          <p>اختر العرض الذي يناسب طريقة عملك:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: <LayoutGrid className="h-4 w-4" />, name: 'البطاقات', desc: 'بطاقات تفصيلية مع مؤقت وإحصائيات وعرض أسبوعي. الأفضل للاستخدام اليومي.' },
              { icon: <Columns3 className="h-4 w-4" />, name: 'الشبكة', desc: 'بطاقات مدمجة في شبكة كثيفة. جيدة للنظرة السريعة.' },
              { icon: <List className="h-4 w-4" />, name: 'القائمة', desc: 'صفوف بسيطة مع إجراءات سريعة. سريعة لتسجيل العادات.' },
              { icon: <BarChart3 className="h-4 w-4" />, name: 'اللوحة', desc: 'لوحة كانبان مجمعة حسب الفئة. رائعة للتصور البصري.' },
            ].map(v => (
              <div key={v.name} className="flex gap-3 p-3 rounded-xl border border-[var(--foreground)]/[0.15]">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-[var(--color-primary)]/10 text-[var(--color-primary)]">{v.icon}</div>
                <div><p className="font-bold text-sm">{v.name}</p><p className="text-xs text-[var(--foreground)]/50">{v.desc}</p></div>
              </div>
            ))}
          </div>
          <p className="text-xs text-[var(--foreground)]/40">يمكنك أيضًا استخدام زر <KeyBadge>جدول الالتزام</KeyBadge> لرؤية جميع العادات عبر التواريخ، وزر <KeyBadge>السجل</KeyBadge> لرؤية سجل الإكمال.</p>
        </div>
      ),
    },
    {
      id: 'detail',
      iconEn: <Eye className="h-5 w-5 text-[var(--color-primary)]" />,
      titleEn: 'Detail Modal & Full Calendar',
      titleAr: 'نافذة التفاصيل والتقويم الكامل',
      contentEn: (
        <div className="space-y-4">
          <p>Click <KeyBadge>Details</KeyBadge> on any habit card to open the detail modal. It includes:</p>
          <ul className="space-y-1.5 list-none text-sm">
            <li className="flex gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-1" /> This week's performance dots with day labels</li>
            <li className="flex gap-2"><Play className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-1" /> Full timer controls — start, pause, stop directly from the modal</li>
            <li className="flex gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-1" /> Mark done button with completion time logged</li>
            <li className="flex gap-2"><BarChart3 className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-1" /> Stats: streak, total completions, success rate</li>
            <li className="flex gap-2"><Calendar className="h-3.5 w-3.5 text-sky-500 shrink-0 mt-1" /> Monthly calendar with color-coded days</li>
            <li className="flex gap-2"><Clock className="h-3.5 w-3.5 text-violet-500 shrink-0 mt-1" /> Repetitions and time spent breakdowns (week/month/year)</li>
            <li className="flex gap-2"><BarChart3 className="h-3.5 w-3.5 text-[var(--color-primary)] shrink-0 mt-1" /> Performance by day of week chart</li>
          </ul>
          <p>Click <strong>"All Days"</strong> on the weekly dots section of the card to jump directly to the full calendar view.</p>
        </div>
      ),
      contentAr: (
        <div className="space-y-4">
          <p>اضغط <KeyBadge>تفاصيل</KeyBadge> على أي بطاقة عادة لفتح نافذة التفاصيل. تتضمن:</p>
          <ul className="space-y-1.5 list-none text-sm">
            <li className="flex gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-1" /> نقاط أداء الأسبوع مع أسماء الأيام</li>
            <li className="flex gap-2"><Play className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-1" /> أزرار المؤقت الكاملة — تشغيل، إيقاف، إنهاء مباشرة من النافذة</li>
            <li className="flex gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-1" /> زر الإكمال مع تسجيل وقت الإنجاز</li>
            <li className="flex gap-2"><BarChart3 className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-1" /> إحصائيات: السلسلة، مجمل الإكمالات، معدل النجاح</li>
            <li className="flex gap-2"><Calendar className="h-3.5 w-3.5 text-sky-500 shrink-0 mt-1" /> تقويم شهري بألوان مرمزة</li>
            <li className="flex gap-2"><Clock className="h-3.5 w-3.5 text-violet-500 shrink-0 mt-1" /> تفاصيل التكرارات والوقت المصروف (أسبوع/شهر/سنة)</li>
            <li className="flex gap-2"><BarChart3 className="h-3.5 w-3.5 text-[var(--color-primary)] shrink-0 mt-1" /> مخطط الأداء حسب أيام الأسبوع</li>
          </ul>
          <p>اضغط <strong>"كل الأيام"</strong> على قسم نقاط الأسبوع في البطاقة للانتقال مباشرة للتقويم الكامل.</p>
        </div>
      ),
    },
    {
      id: 'tips',
      iconEn: <Zap className="h-5 w-5 text-[var(--color-primary)]" />,
      titleEn: 'Best Practices & Pro Tips',
      titleAr: 'أفضل الممارسات ونصائح متقدمة',
      contentEn: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: '1', title: 'Start Small', desc: 'Begin with 2-3 habits. Add more only after you consistently hit 80%+ completion for 2 weeks.' },
              { icon: '2', title: 'Use Time Windows', desc: 'Anchor habits to specific times. "After breakfast" is better than "sometime today".' },
              { icon: '3', title: 'Fill the Habit Loop', desc: 'Cue + Routine + Reward makes habits automatic. Don\'t skip the reward.' },
              { icon: '4', title: 'Set Streak Goals', desc: 'The fear of breaking a streak is powerful. Set 7/30/90 day milestones with real rewards.' },
              { icon: '5', title: 'Review Weekly', desc: 'Check the compliance table every Sunday. Identify weak spots and adjust.' },
              { icon: '6', title: 'Never Zero', desc: 'Bad day? Do the minimum. 1 pushup > 0 pushups. The streak matters more than the intensity.' },
            ].map(t => (
              <div key={t.icon} className="flex gap-3 p-3 rounded-xl border border-[var(--foreground)]/[0.15]">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-black text-sm">{t.icon}</div>
                <div><p className="font-bold text-sm">{t.title}</p><p className="text-xs text-[var(--foreground)]/50">{t.desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      ),
      contentAr: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: '١', title: 'ابدأ صغيرًا', desc: 'ابدأ بـ ٢-٣ عادات. أضف المزيد فقط بعد تحقيق ٨٠%+ إكمال لمدة أسبوعين.' },
              { icon: '٢', title: 'استخدم نوافذ الوقت', desc: 'اربط العادات بأوقات محددة. "بعد الإفطار" أفضل من "في وقت ما اليوم".' },
              { icon: '٣', title: 'املأ حلقة العادة', desc: 'إشارة + روتين + مكافأة تجعل العادات تلقائية. لا تتخطَّ المكافأة.' },
              { icon: '٤', title: 'حدد أهداف السلسلة', desc: 'الخوف من كسر السلسلة قوي. حدد مراحل ٧/٣٠/٩٠ يوم مع مكافآت حقيقية.' },
              { icon: '٥', title: 'راجع أسبوعيًا', desc: 'تحقق من جدول الالتزام كل أحد. حدد نقاط الضعف وعدّل.' },
              { icon: '٦', title: 'أبدًا صفر', desc: 'يوم سيء؟ أنجز الحد الأدنى. تمرين ضغط واحد > صفر. السلسلة أهم من الشدة.' },
            ].map(t => (
              <div key={t.icon} className="flex gap-3 p-3 rounded-xl border border-[var(--foreground)]/[0.15]">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-black text-sm">{t.icon}</div>
                <div><p className="font-bold text-sm">{t.title}</p><p className="text-xs text-[var(--foreground)]/50">{t.desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden mb-8"
      >
        <div className="absolute inset-0 opacity-[0.03]" style={{ background: 'radial-gradient(ellipse at top, var(--color-primary), transparent 70%)' }} />
        <div className="relative px-6 pt-8 pb-6">
          {/* Back link */}
          <Link href="/app/habits"
            className="inline-flex items-center gap-2 text-sm font-bold text-[var(--foreground)]/50 hover:text-[var(--color-primary)] transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" />
            {isAr ? 'العودة للعادات' : 'Back to Habits'}
          </Link>

          <div className="flex items-center gap-5">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 3 }}
              className="h-16 w-16 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, rgba(var(--color-primary-rgb) / 0.2), rgba(var(--color-primary-rgb) / 0.08))', border: '2px solid rgba(var(--color-primary-rgb) / 0.2)' }}
            >
              <BookOpen className="h-7 w-7 text-[var(--color-primary)]" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">{isAr ? 'دليل العادات' : 'Habits Guide'}</h1>
              <p className="text-sm text-[var(--foreground)]/50 mt-1">{isAr ? 'تعلم كيف تستخدم نظام العادات بأفضل طريقة' : 'Learn how to use the habits system effectively'}</p>
            </div>
          </div>

          {/* Quick stats about the guide */}
          <div className="flex flex-wrap gap-2 mt-5">
            {[
              { label: isAr ? 'أقسام' : 'Sections', value: sections.length },
              { label: isAr ? 'أنواع العادات' : 'Habit Types', value: 3 },
              { label: isAr ? 'نصائح' : 'Tips', value: '6+' },
            ].map((s, i) => (
              <span key={i} className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-[var(--color-primary)]/8 text-[var(--color-primary)] border border-[var(--color-primary)]/15">
                {s.value} {s.label}
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Sections */}
      <div className="px-6 space-y-3 max-w-4xl mx-auto">
        {sections.map((section, i) => (
          <GuideSection
            key={section.id}
            section={section}
            index={i}
            isAr={isAr}
            open={openSections.has(section.id)}
            onToggle={() => toggle(section.id)}
          />
        ))}

        {/* Expand/Collapse all */}
        <motion.div
          variants={fadeUp}
          custom={sections.length + 3}
          initial="hidden"
          animate="visible"
          className="flex justify-center pt-4"
        >
          <button
            onClick={() => {
              if (openSections.size === sections.length) setOpenSections(new Set());
              else setOpenSections(new Set(sections.map(s => s.id)));
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:shadow-md cursor-pointer"
            style={{ background: 'rgba(var(--color-primary-rgb) / 0.08)', color: 'var(--color-primary)', border: '1px solid rgba(var(--color-primary-rgb) / 0.15)' }}
          >
            <ChevronDown className={cn('h-4 w-4 transition-transform', openSections.size === sections.length && 'rotate-180')} />
            {openSections.size === sections.length
              ? (isAr ? 'طي الكل' : 'Collapse All')
              : (isAr ? 'توسيع الكل' : 'Expand All')}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
