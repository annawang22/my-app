import SafeAsyncStorage from './asyncStorageWrapper';

export interface Exercise {
  id: string;
  name: string;
  weight?: string; // e.g., "55 pounds"
  sets: number;
  reps: number;
  duration?: string; // e.g., "30 minutes"
  isCompleted: boolean;
  completedDate?: string; // ISO date string
}

export interface Goal {
  id: string;
  name: string;
  exercises: Exercise[];
  createdAt: string;
}

export interface WorkoutSession {
  id: string;
  goalId: string;
  date: string;
  exercises: Exercise[];
}

const GOALS_KEY = 'user_goals';
const SESSIONS_KEY = 'user_workout_sessions';

export const workoutStorage = {
  // Goals
  async addGoal(goalName: string): Promise<Goal> {
    try {
      const goalsStr = await SafeAsyncStorage.getItem(GOALS_KEY);
      const goals: Goal[] = goalsStr ? JSON.parse(goalsStr) : [];

      const newGoal: Goal = {
        id: Date.now().toString(),
        name: goalName,
        exercises: [],
        createdAt: new Date().toISOString(),
      };

      goals.push(newGoal);
      await SafeAsyncStorage.setItem(GOALS_KEY, JSON.stringify(goals));

      return newGoal;
    } catch (error) {
      console.error('Failed to add goal', error);
      throw error;
    }
  },

  async getGoals(): Promise<Goal[]> {
    try {
      const goalsStr = await SafeAsyncStorage.getItem(GOALS_KEY);
      return goalsStr ? JSON.parse(goalsStr) : [];
    } catch (error) {
      console.error('Failed to get goals', error);
      return [];
    }
  },

  async getGoal(goalId: string): Promise<Goal | null> {
    try {
      const goals = await this.getGoals();
      return goals.find((g) => g.id === goalId) || null;
    } catch (error) {
      console.error('Failed to get goal', error);
      return null;
    }
  },

  // Exercises
  async addExercise(
    goalId: string,
    name: string,
    sets: number,
    reps: number,
    weight?: string,
    duration?: string
  ): Promise<Exercise> {
    try {
      const goals = await this.getGoals();
      const goal = goals.find((g) => g.id === goalId);

      if (!goal) throw new Error('Goal not found');

      const newExercise: Exercise = {
        id: Date.now().toString(),
        name,
        sets,
        reps,
        weight,
        duration,
        isCompleted: false,
      };

      goal.exercises.push(newExercise);
      await SafeAsyncStorage.setItem(GOALS_KEY, JSON.stringify(goals));

      return newExercise;
    } catch (error) {
      console.error('Failed to add exercise', error);
      throw error;
    }
  },

  async updateExercise(
    goalId: string,
    exerciseId: string,
    updates: Partial<Exercise>
  ): Promise<Exercise | null> {
    try {
      const goals = await this.getGoals();
      const goal = goals.find((g) => g.id === goalId);

      if (!goal) throw new Error('Goal not found');

      const exercise = goal.exercises.find((e) => e.id === exerciseId);
      if (!exercise) throw new Error('Exercise not found');

      Object.assign(exercise, updates);
      await SafeAsyncStorage.setItem(GOALS_KEY, JSON.stringify(goals));

      return exercise;
    } catch (error) {
      console.error('Failed to update exercise', error);
      return null;
    }
  },

  async markExerciseComplete(
    goalId: string,
    exerciseId: string
  ): Promise<Exercise | null> {
    try {
      const goals = await this.getGoals();
      const goal = goals.find((g) => g.id === goalId);

      if (!goal) throw new Error('Goal not found');

      const exercise = goal.exercises.find((e) => e.id === exerciseId);
      if (!exercise) throw new Error('Exercise not found');

      exercise.isCompleted = true;
      exercise.completedDate = new Date().toISOString();

      await SafeAsyncStorage.setItem(GOALS_KEY, JSON.stringify(goals));

      return exercise;
    } catch (error) {
      console.error('Failed to mark exercise complete', error);
      return null;
    }
  },

  async getTodayExercises(date: string): Promise<Exercise[]> {
    try {
      const goals = await this.getGoals();
      const allExercises: Exercise[] = [];

      goals.forEach((goal) => {
        goal.exercises.forEach((exercise) => {
          allExercises.push(exercise);
        });
      });

      return allExercises;
    } catch (error) {
      console.error('Failed to get today exercises', error);
      return [];
    }
  },

  async deleteGoal(goalId: string): Promise<boolean> {
    try {
      const goals = await this.getGoals();
      const filtered = goals.filter((g) => g.id !== goalId);
      await SafeAsyncStorage.setItem(GOALS_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Failed to delete goal', error);
      return false;
    }
  },

  async deleteExercise(goalId: string, exerciseId: string): Promise<boolean> {
    try {
      const goals = await this.getGoals();
      const goal = goals.find((g) => g.id === goalId);

      if (!goal) throw new Error('Goal not found');

      goal.exercises = goal.exercises.filter((e) => e.id !== exerciseId);
      await SafeAsyncStorage.setItem(GOALS_KEY, JSON.stringify(goals));

      return true;
    } catch (error) {
      console.error('Failed to delete exercise', error);
      return false;
    }
  },
};
