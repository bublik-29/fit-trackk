
export interface ExerciseSet {
  weight: number;
  reps: number;
}

export interface WorkoutEntry {
  completed: boolean;
  blockNumber: 1 | 2 | 3;
  exerciseA: ExerciseSet[]; // Always 3 sets
  exerciseB: ExerciseSet[]; // Always 3 sets
  date: string; // ISO string
  duration?: number; // In seconds
}

export interface ProgressData {
  [dateKey: string]: WorkoutEntry;
}

export interface BlockStats {
  exerciseA: ExerciseSet[];
  exerciseB: ExerciseSet[];
}

export interface MonthSummary {
  totalWorkouts: number;
  personalBests: {
    [exerciseKey: string]: ExerciseSet;
  };
}

export type Language = 'en' | 'ru' | 'pl';
