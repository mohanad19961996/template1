// ============================================================
// HABITS APP - COMPLETE DATA MODELS
// ============================================================

// ── Enums & Constants ──────────────────────────────────────

export type HabitFrequency = 'daily' | 'weekly' | 'monthly' | 'custom';
export type HabitType = 'positive' | 'avoidance';
export type Priority = 'low' | 'medium' | 'high';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type MoodLevel = 1 | 2 | 3 | 4 | 5;
export type TimerMode = 'stopwatch' | 'countdown' | 'pomodoro';
export type TimerState = 'idle' | 'running' | 'paused' | 'completed';
export type HormoneType = 'dopamine' | 'serotonin' | 'oxytocin' | 'endorphins';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type Urgency = 'low' | 'normal' | 'high';
export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const HABIT_CATEGORIES = [
  'health', 'fitness', 'learning', 'productivity', 'mindfulness',
  'social', 'creativity', 'finance', 'nutrition', 'sleep', 'other'
] as const;
export type HabitCategory = typeof HABIT_CATEGORIES[number];

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
  priority: Priority;
  difficulty: Difficulty;
  color: string;
  icon: string;
  type: HabitType;
  reminderEnabled: boolean;
  reminderTime?: string;
  reminderDays?: WeekDay[];
  targetPerDay?: number;
  createdAt: string;
  archived: boolean;
  order: number;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;       // YYYY-MM-DD
  time: string;       // HH:mm
  duration?: number;   // minutes
  note: string;
  moodBefore?: MoodLevel;
  moodAfter?: MoodLevel;
  reminderUsed: boolean;
  perceivedDifficulty: Difficulty;
  completed: boolean;
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

export interface TimerSession {
  id: string;
  type: 'independent' | 'skill-linked';
  mode: TimerMode;
  skillId?: string;
  labelEn: string;
  labelAr: string;
  startedAt: string;
  endedAt?: string;
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
  urgency: Urgency;
  sound: string;
  enabled: boolean;
  createdAt: string;
}

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
  hormoneLogs: HormoneLog[];
  nutritionLogs: NutritionLog[];
  hydrationLogs: HydrationLog[];
  goals: Goal[];
  moodEntries: MoodEntry[];
  settings: UserSettings;
  activeTimer: ActiveTimer | null;
}

export interface ActiveTimer {
  sessionId: string;
  state: TimerState;
  elapsed: number;          // seconds
  targetDuration?: number;  // seconds
  mode: TimerMode;
  pomodoroPhase?: 'work' | 'short-break' | 'long-break';
  pomodoroRound?: number;
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

export function todayString(): DateString {
  return new Date().toISOString().split('T')[0];
}

export function nowTimeString(): TimeString {
  return new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
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
  return new Date(date).getDay() as WeekDay;
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
  hormoneLogs: [],
  nutritionLogs: [],
  hydrationLogs: [],
  goals: [],
  moodEntries: [],
  settings: DEFAULT_SETTINGS,
  activeTimer: null,
};

// ── Color Palette for Items ────────────────────────────────

export const ITEM_COLORS = [
  '#E11D48', '#F97316', '#EAB308', '#22C55E', '#06B6D4',
  '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F43F5E',
  '#6366F1', '#A855F7', '#0EA5E9', '#10B981', '#D946EF',
];
