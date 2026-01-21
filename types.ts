
export enum View {
  DASHBOARD = 'DASHBOARD',
  HISTORY = 'HISTORY',
  WORKOUT = 'WORKOUT',
  PROGRESS = 'PROGRESS',
  NUTRITION = 'NUTRITION',
  TUTORIALS = 'TUTORIALS',
  SETTINGS = 'SETTINGS'
}

export interface ExerciseSetLog {
  setNumber: number;
  weight: number;
  reps: number;
  completed: boolean;
}

export interface ExerciseLog {
  exerciseName: string;
  sets: ExerciseSetLog[];
}

export interface WorkoutRecord {
  id: string;
  date: string;
  type: string;
  duration: number; // in minutes
  calories: number;
  completed: boolean;
  details?: ExerciseLog[]; // New field for detailed logs
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight?: number; // Added weight field
  completed: boolean;
  section?: 'warmup' | 'main' | 'core'; // New: Workout Section
}

export interface DailyPlan {
  id: string;
  title: string;
  focus: string;
  duration: number;
  exercises: Exercise[];
}

export interface ScheduledWorkout {
  date: string; // YYYY-MM-DD
  planId: string;
  completed: boolean;
}

export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  title: string;
  type: 'ACTIVITY' | 'MEAL' | 'WORKOUT' | 'OTHER';
  description?: string;
}

export interface MacroData {
  name: string;
  value: number;
  fill: string;
}

export interface WeightData {
  date: string;
  weight: number;
}

export interface StrengthData {
  exercise: string;
  weight: number;
}

export interface NutritionLog {
  id: string;
  date: string; // YYYY-MM-DD
  time: string;
  item: string;
  calories: number;
  macros: {
    p: number; // protein
    c: number; // carbs
    f: number; // fat
  }
}

export interface UserProfile {
  name: string;
  height: number; // cm
  weight: number; // kg
  age: number;
  gender: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'lose_weight' | 'maintain' | 'gain_muscle';
  avatar?: string; // Base64 image string
  
  // AI Configuration
  aiProvider?: 'google' | 'openai'; // google (Gemini) or openai (Standard/DeepSeek)
  openaiApiKey?: string;
  openaiBaseUrl?: string; // e.g., https://api.deepseek.com or https://api.openai.com/v1
  openaiModel?: string; // e.g., deepseek-chat or gpt-4o-mini
}

export type EquipmentType = '固定器械' | '啞鈴' | '徒手';
export type BodyPart = '胸部' | '背部' | '肩膀' | '手臂' | '腿部' | '核心' | '有氧';
export type AnimationCategory = 'leg' | 'push' | 'pull' | 'core' | 'cardio';

export interface Tutorial {
  id: string;
  name: string;
  bodyPart: BodyPart;
  subCategory?: string; // New field for detailed classification (e.g. Upper Chest, Triceps)
  equipment: EquipmentType;
  difficulty: '初學者' | '中級' | '進階';
  description: string;
  tips: string[];
  animationType: AnimationCategory;
  image?: string; // Static image URL or path
}
