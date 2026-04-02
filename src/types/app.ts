// ============================================================
// HABITS APP - COMPLETE DATA MODELS
// ============================================================

// ── Enums & Constants ──────────────────────────────────────

export type HabitFrequency = 'daily' | 'weekly' | 'monthly' | 'custom';
export type HabitType = 'positive' | 'avoidance';
export type HabitTrackingType = 'boolean' | 'count' | 'timer' | 'checklist' | 'duration';
export type HabitLogStatus = 'completed' | 'partial' | 'skipped' | 'missed' | 'pending';
export type Priority = 'low' | 'medium' | 'high';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type MoodLevel = 1 | 2 | 3 | 4 | 5;
export type TimerMode = 'stopwatch' | 'countdown' | 'pomodoro';
export type TimerState = 'idle' | 'running' | 'paused' | 'completed';
export type HormoneType = 'dopamine' | 'serotonin' | 'oxytocin' | 'endorphins';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type Urgency = 'low' | 'normal' | 'high';
export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type CustomScheduleType = 'weekdays' | 'monthdays' | 'yeardays';
export type AlarmType = 'habit' | 'skill' | 'independent';
export type AlarmSound = 'classic' | 'digital' | 'gentle' | 'urgent' | 'nature' | 'bell' | 'siren' | 'melody' | 'chime' | 'rooster';
export type AlarmStatus = 'idle' | 'ringing' | 'snoozed';

export const DEFAULT_HABIT_CATEGORIES = [
  'health', 'fitness', 'learning', 'productivity', 'mindfulness',
  'social', 'creativity', 'finance', 'nutrition', 'sleep', 'other'
] as const;
export type HabitCategory = string;

export const SKILL_CATEGORIES = [
  'programming', 'languages', 'design', 'writing', 'music',
  'fitness', 'cooking', 'communication', 'leadership', 'analysis',
  'reading', 'memory', 'other'
] as const;
export type SkillCategory = typeof SKILL_CATEGORIES[number];

export const HABIT_ICONS = [
  'Activity', 'Heart', 'Brain', 'BookOpen', 'Dumbbell', 'Moon',
  'Sun', 'Coffee', 'Droplets', 'Flame', 'Target', 'Zap',
  'Star', 'Clock', 'PenTool', 'Music', 'Camera', 'Code',
  'Headphones', 'Smile', 'TreePine', 'Wind', 'Eye', 'Shield'
] as const;

export const HORMONE_ACTIVITIES: Record<HormoneType, string[]> = {
  dopamine: [
    'completed_task', 'exercise', 'learned_something', 'healthy_meal',
    'creative_work', 'cold_shower', 'meditation', 'deep_work',
    'achieved_goal', 'music_listening', 'quality_sleep', 'sunlight'
  ],
  serotonin: [
    'sunlight_exposure', 'exercise', 'meditation', 'gratitude_practice',
    'healthy_meal', 'nature_walk', 'quality_sleep', 'deep_breathing',
    'journaling', 'stretching', 'positive_thinking', 'routine_maintained'
  ],
  oxytocin: [
    'social_connection', 'helping_others', 'quality_time_family',
    'deep_conversation', 'pet_interaction', 'group_activity',
    'acts_of_kindness', 'hugging', 'team_collaboration', 'volunteering',
    'shared_meal', 'laughter_with_others'
  ],
  endorphins: [
    'vigorous_exercise', 'laughter', 'dancing', 'spicy_food',
    'dark_chocolate', 'stretching', 'walking', 'swimming',
    'yoga', 'sports', 'running', 'cycling'
  ]
};

// ── Core Models ────────────────────────────────────────────

export interface Habit {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  category: HabitCategory;
  frequency: HabitFrequency;
  customDays?: WeekDay[];
  customScheduleType?: CustomScheduleType; // 'weekdays' | 'monthdays' | 'yeardays'
  customMonthDays?: number[];              // 1-31, specific days of the month
  customYearDays?: { month: number; day: number }[]; // specific month/day combos in a year
  priority: Priority;
  difficulty: Difficulty;
  color: string;
  icon: string;
  type: HabitType;
  // ── Tracking type (how completion is measured) ──
  trackingType?: HabitTrackingType; // boolean = yes/no, count = numeric target, timer = time-based, checklist = multi-step, duration = manual minutes (default: boolean)
  targetValue?: number;             // 1 for boolean, 8 for "8 cups", 30 for "30 minutes" (default: 1)
  targetUnit?: string;              // 'times' | 'cups' | 'pages' | 'minutes' | 'steps' | custom (default: times)
  checklistItems?: { id: string; titleEn: string; titleAr: string }[]; // for checklist tracking type
  // ── Schedule ──
  scheduleType?: 'daily' | 'weekly' | 'custom'; // how often (default: daily)
  scheduleDays?: WeekDay[];        // specific days if custom
  weeklyTarget?: number;           // e.g. 3 times per week
  // ── Behavior ──
  allowPartial?: boolean;           // can log partial completion (default: false)
  allowSkip?: boolean;              // can skip with excuse (default: false)
  reminderEnabled: boolean;
  reminderTime?: string;
  reminderDays?: WeekDay[];
  targetPerDay?: number;
  image?: string;
  // Habit loop (Cue → Routine → Reward)
  cueEn?: string;
  cueAr?: string;
  routineEn?: string;
  routineAr?: string;
  rewardEn?: string;
  rewardAr?: string;
  // Context
  placeEn?: string;
  placeAr?: string;
  preferredTime?: string; // HH:mm — when to do this habit
  expectedDuration?: number; // minutes — expected time to complete this habit
  windowStart?: string; // HH:mm — ideal window start (optional)
  windowEnd?: string;   // HH:mm — ideal window end (optional)
  strictWindow?: boolean; // if true, habit can ONLY be done within windowStart-windowEnd, auto-missed otherwise
  maxDailyReps?: number;  // max times this habit can be completed per day (e.g. study 3 sessions/day)
  // Streak challenges (up to 3 tiers)
  streakGoal?: number;     // tier 1 e.g. 7 days
  streakRewardEn?: string;
  streakRewardAr?: string;
  streakGoal2?: number;    // tier 2 e.g. 30 days
  streakRewardEn2?: string;
  streakRewardAr2?: string;
  streakGoal3?: number;    // tier 3 e.g. 90 days
  streakRewardEn3?: string;
  streakRewardAr3?: string;
  // Habit notes (persistent, not daily)
  notes?: string;
  // Card display size
  colSpan?: number; // 1-4 columns this card spans
  rowSpan?: number; // 1-3 rows this card spans
  createdAt: string;
  archived: boolean;
  order: number;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;       // YYYY-MM-DD (dateKey)
  time: string;       // HH:mm
  duration?: number;   // minutes
  note: string;
  moodBefore?: MoodLevel;
  moodAfter?: MoodLevel;
  reminderUsed: boolean;
  perceivedDifficulty: Difficulty;
  completed: boolean;
  // ── New fields for proper tracking ──
  status?: HabitLogStatus;         // completed | partial | skipped | missed | pending (default: based on completed)
  value?: number;                  // actual value achieved (e.g. 6 cups out of 8)
  checklistState?: Record<string, boolean>; // for checklist type: { itemId: true/false }
  source?: 'manual' | 'timer' | 'auto'; // how this log was created (default: manual)
}

export type HabitChangeType = 'created' | 'edited' | 'archived' | 'restored';

export interface HabitHistoryEntry {
  id: string;
  habitId: string;
  changeType: HabitChangeType;
  date: string;       // YYYY-MM-DD
  timestamp: string;   // ISO
  changes: Record<string, { from: unknown; to: unknown }>;  // field-level diff
  snapshot: Partial<Habit>;  // full habit state at this point
}

export interface Skill {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  category: SkillCategory;
  targetLevel: number;    // 1-100
  currentLevel: number;   // 1-100
  totalMinutes: number;
  totalSessions: number;
  milestones: Milestone[];
  color: string;
  icon: string;
  createdAt: string;
  archived: boolean;
}

export interface Milestone {
  id: string;
  titleEn: string;
  titleAr: string;
  targetHours: number;
  completed: boolean;
  completedAt?: string;
}

export interface SkillSession {
  id: string;
  skillId: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;      // minutes
  sessionType: string;
  qualityRating: MoodLevel;
  focusRating: MoodLevel;
  note: string;
  whatLearned: string;
  tags: string[];
  timerUsed: boolean;
}

export interface TimerEvent {
  action: 'start' | 'pause' | 'resume' | 'finish' | 'cancel';
  at: string; // ISO timestamp
}

export interface TimerSession {
  id: string;
  type: 'independent' | 'skill-linked' | 'habit-linked';
  mode: TimerMode;
  skillId?: string;
  habitId?: string;
  labelEn: string;
  labelAr: string;
  startedAt: string;
  endedAt?: string;
  pausedAt?: string;        // when last paused
  resumedAt?: string;       // when last resumed
  totalPausedTime?: number; // total seconds spent paused
  events?: TimerEvent[];    // full timeline of start/pause/resume/finish
  duration: number;         // seconds elapsed
  targetDuration?: number;  // seconds target
  pomodoroConfig?: PomodoroConfig;
  pomodoroRound?: number;
  productivityRating?: MoodLevel;
  distractionCount: number;
  note: string;
  completed: boolean;
}

export interface PomodoroConfig {
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  roundsBeforeLongBreak: number;
}

export interface Reminder {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  type: 'habit' | 'skill' | 'general';
  linkedId?: string;
  time: string;
  days: WeekDay[];
  recurring: boolean;
  scheduleMode?: 'weekdays' | 'monthdays' | 'yeardays'; // custom schedule mode
  monthDays?: number[];              // 1-31, specific days of the month
  yearDays?: { month: number; day: number }[]; // specific month/day combos in a year
  urgency: Urgency;
  sound: string;
  enabled: boolean;
  createdAt: string;
}

// ── Task ──────────────────────────────────────────────────

export type TaskStatus = 'todo' | 'in-progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category?: string;
  dueDate?: string;        // YYYY-MM-DD
  dueTime?: string;        // HH:mm
  completedAt?: string;     // ISO timestamp
  estimatedMinutes?: number;
  actualMinutes?: number;
  subtasks?: { id: string; title: string; completed: boolean }[];
  tags?: string[];
  linkedHabitId?: string;
  linkedSkillId?: string;
  notes?: string;
  color?: string;
  createdAt: string;
  updatedAt?: string;
  order: number;
}

// ── Alarm ─────────────────────────────────────────────────

export interface Alarm {
  id: string;
  labelEn: string;
  labelAr: string;
  type: AlarmType;
  linkedId?: string;           // habitId or skillId when linked
  time: string;                // HH:mm — alarm trigger time
  days: WeekDay[];             // which days to ring (empty = one-time)
  scheduleMode?: 'weekdays' | 'monthdays' | 'yeardays'; // custom schedule mode
  monthDays?: number[];              // 1-31, specific days of the month
  yearDays?: { month: number; day: number }[]; // specific month/day combos in a year
  oneTimeDate?: string;        // YYYY-MM-DD for one-time alarms
  sound: AlarmSound;
  volume: number;              // 0-100
  snoozeEnabled: boolean;
  snoozeDuration: number;      // minutes (5, 10, 15, 20, 30)
  maxSnoozes: number;          // max snooze count (1-10)
  snoozeCount: number;         // current snooze count
  vibrate: boolean;
  gradualVolume: boolean;      // start quiet, get louder over 30s
  enabled: boolean;
  status: AlarmStatus;         // idle | ringing | snoozed
  lastTriggered?: string;      // ISO timestamp — prevent double-fire
  color: string;
  icon: string;
  createdAt: string;
}

export const ALARM_SOUNDS: { id: AlarmSound; labelEn: string; labelAr: string }[] = [
  { id: 'classic', labelEn: 'Classic', labelAr: 'كلاسيكي' },
  { id: 'digital', labelEn: 'Digital', labelAr: 'رقمي' },
  { id: 'gentle', labelEn: 'Gentle', labelAr: 'هادئ' },
  { id: 'urgent', labelEn: 'Urgent', labelAr: 'عاجل' },
  { id: 'nature', labelEn: 'Nature', labelAr: 'طبيعة' },
  { id: 'bell', labelEn: 'Bell', labelAr: 'جرس' },
  { id: 'siren', labelEn: 'Siren', labelAr: 'صفارة' },
  { id: 'melody', labelEn: 'Melody', labelAr: 'لحن' },
  { id: 'chime', labelEn: 'Chime', labelAr: 'رنين' },
  { id: 'rooster', labelEn: 'Rooster', labelAr: 'ديك' },
];

export const ALARM_ICONS = [
  'AlarmClock', 'Bell', 'BellRing', 'Clock', 'Sun', 'Moon',
  'Coffee', 'Dumbbell', 'BookOpen', 'Brain', 'Heart', 'Star',
] as const;

export interface HormoneLog {
  id: string;
  date: string;
  type: HormoneType;
  activities: string[];
  rating: MoodLevel;
  note: string;
}

export interface NutritionLog {
  id: string;
  date: string;
  mealType: MealType;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  healthy: boolean;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  note: string;
}

export interface HydrationLog {
  id: string;
  date: string;
  glasses: number;
  target: number;
}

export interface Goal {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  linkedSkillIds: string[];
  linkedHabitIds: string[];
  targetDate?: string;
  milestones: GoalMilestone[];
  progress: number;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
  color: string;
  icon: string;
}

export interface GoalMilestone {
  id: string;
  titleEn: string;
  titleAr: string;
  completed: boolean;
  completedAt?: string;
}

export interface MoodEntry {
  id: string;
  date: string;
  time: string;
  mood: MoodLevel;
  energy: MoodLevel;
  note: string;
  tags: string[];
}

export interface WellnessScore {
  date: string;
  habits: number;       // 0-100
  skills: number;       // 0-100
  hormones: number;     // 0-100
  nutrition: number;    // 0-100
  mood: number;         // 0-100
  overall: number;      // 0-100
}

// ── User Settings ──────────────────────────────────────────

export interface UserSettings {
  displayName: string;
  language: 'ar' | 'en';
  theme: 'light' | 'dark' | 'system';
  weekStartDay: WeekDay;
  timezone: string;
  dailyReminderEnabled: boolean;
  dailyReminderTime: string;
  soundEnabled: boolean;
  hydrationTarget: number;
  sleepTarget: number;
  focusTarget: number;       // minutes per day
}

// ── App State ──────────────────────────────────────────────

export interface AppState {
  habits: Habit[];
  habitLogs: HabitLog[];
  skills: Skill[];
  skillSessions: SkillSession[];
  timerSessions: TimerSession[];
  reminders: Reminder[];
  alarms: Alarm[];
  hormoneLogs: HormoneLog[];
  nutritionLogs: NutritionLog[];
  hydrationLogs: HydrationLog[];
  tasks: Task[];
  goals: Goal[];
  moodEntries: MoodEntry[];
  customCategories: string[];
  categoryOrder: string[];
  deletedCategories: string[];
  settings: UserSettings;
  activeTimer: ActiveTimer | null;
}

export interface ActiveTimer {
  sessionId: string;
  state: TimerState;
  mode: TimerMode;
  // ── Absolute timestamps (source of truth) ──
  startedAt: string;         // ISO — when the current running segment began
  endsAt?: string;           // ISO — absolute end time (countdown/pomodoro only, set when running)
  pausedAt?: string;         // ISO — when timer was paused
  remainingMs?: number;      // ms remaining at pause (countdown/pomodoro)
  elapsedMs?: number;        // ms elapsed at pause (stopwatch) or total elapsed for completed
  targetDuration?: number;   // seconds — total target for countdown/pomodoro
  // ── Pomodoro ──
  pomodoroPhase?: 'work' | 'short-break' | 'long-break';
  pomodoroRound?: number;
}

/** Compute elapsed seconds from an ActiveTimer's absolute timestamps */
export function computeTimerElapsed(t: ActiveTimer | null, now?: number): number {
  if (!t) return 0;
  const ts = now ?? Date.now();
  if (t.state === 'completed') {
    return t.targetDuration ?? Math.floor((t.elapsedMs ?? 0) / 1000);
  }
  if (t.state === 'paused') {
    if (t.mode === 'stopwatch') return Math.floor((t.elapsedMs ?? 0) / 1000);
    // countdown/pomodoro: elapsed = target - remaining
    return t.targetDuration ? Math.max(0, t.targetDuration - Math.floor((t.remainingMs ?? 0) / 1000)) : 0;
  }
  if (t.state === 'running') {
    if (t.mode === 'stopwatch') {
      return Math.floor((ts - new Date(t.startedAt).getTime()) / 1000);
    }
    // countdown/pomodoro: elapsed = target - (endsAt - now)
    if (t.endsAt && t.targetDuration) {
      const remainMs = Math.max(0, new Date(t.endsAt).getTime() - ts);
      return Math.max(0, t.targetDuration - Math.floor(remainMs / 1000));
    }
    return 0;
  }
  return 0;
}

/** Compute remaining seconds for countdown/pomodoro timers */
export function computeTimerRemaining(t: ActiveTimer | null, now?: number): number {
  if (!t || !t.targetDuration) return 0;
  const ts = now ?? Date.now();
  if (t.state === 'completed') return 0;
  if (t.state === 'paused') return Math.max(0, Math.floor((t.remainingMs ?? 0) / 1000));
  if (t.state === 'running' && t.endsAt) {
    return Math.max(0, Math.floor((new Date(t.endsAt).getTime() - ts) / 1000));
  }
  return 0;
}

// ── Utility Types ──────────────────────────────────────────

export type DateString = string; // YYYY-MM-DD
export type TimeString = string; // HH:mm

export interface StreakInfo {
  current: number;
  best: number;
  lastCompletedDate: string | null;
}

export interface HabitStats {
  totalCompletions: number;
  completionRate: number;
  streak: StreakInfo;
  averageMoodBefore: number;
  averageMoodAfter: number;
  bestDay: string;
  worstDay: string;
  completionsByWeekday: number[];
}

export interface SkillStats {
  totalHours: number;
  totalSessions: number;
  averageSessionLength: number;
  averageQuality: number;
  averageFocus: number;
  bestDay: string;
  growthRate: number;
  weeklyHours: number[];
}

// ── ID Generation ──────────────────────────────────────────

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ── Date Helpers ───────────────────────────────────────────

/** Parse "YYYY-MM-DD" as a local date (avoids UTC-midnight ambiguity of new Date("YYYY-MM-DD")) */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Format a local Date as "YYYY-MM-DD" without UTC conversion (unlike toISOString) */
export function formatLocalDate(d: Date): DateString {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Get today's date string, consistent across client & server using Intl timezone */
export function todayString(timezone?: string): DateString {
  const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()) as DateString;
}

export function nowTimeString(timezone?: string): TimeString {
  const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  return new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', timeZone: tz });
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatTimerDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getWeekDay(date: string): WeekDay {
  return parseLocalDate(date).getDay() as WeekDay;
}

// ── Default Values ─────────────────────────────────────────

export const DEFAULT_POMODORO: PomodoroConfig = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  roundsBeforeLongBreak: 4,
};

export const DEFAULT_SETTINGS: UserSettings = {
  displayName: '',
  language: 'ar',
  theme: 'system',
  weekStartDay: 6,  // Saturday for Arabic
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  dailyReminderEnabled: false,
  dailyReminderTime: '08:00',
  soundEnabled: true,
  hydrationTarget: 8,
  sleepTarget: 8,
  focusTarget: 120,
};

export const DEFAULT_APP_STATE: AppState = {
  habits: [],
  habitLogs: [],
  skills: [],
  skillSessions: [],
  timerSessions: [],
  reminders: [],
  alarms: [],
  hormoneLogs: [],
  nutritionLogs: [],
  hydrationLogs: [],
  tasks: [],
  goals: [],
  moodEntries: [],
  customCategories: [],
  categoryOrder: [],
  deletedCategories: [],
  settings: DEFAULT_SETTINGS,
  activeTimer: null,
};

// ── Color Palette for Items ────────────────────────────────

export const ITEM_COLORS = [
  'theme', // special: uses var(--color-primary), auto-adapts to light/dark
  '#E11D48', '#F97316', '#EAB308', '#22C55E', '#06B6D4',
  '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F43F5E',
  '#6366F1', '#A855F7', '#0EA5E9', '#10B981', '#D946EF',
];

// Resolve habit color — returns hex color string
// For 'theme', reads the live --color-primary CSS variable
export function resolveHabitColor(color: string): string {
  if (color !== 'theme') return color;
  if (typeof window === 'undefined') return '#0066FF';
  return getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#0066FF';
}

