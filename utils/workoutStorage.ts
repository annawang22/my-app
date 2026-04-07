import { auth } from './auth';
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

const LEGACY_GOALS_KEY = 'user_goals';
const SESSIONS_KEY = 'user_workout_sessions';

async function getGoalsKey(): Promise<string> {
  const username = await auth.getLoggedInUsername();
  if (username) {
    return `user_goals_${username}`;
  }
  return LEGACY_GOALS_KEY;
}

/**
 * Reads goals from the canonical key for the current session.
 * When logged in, also merges orphan writes under `user_goals` (legacy) so goals/exercises
 * are not lost if a write used the legacy key while reads used `user_goals_<username>`.
 */
function parseGoalsJson(raw: string | null): Goal[] {
  if (raw == null || raw === '') return [];
  try {
    return normalizeGoalsFromJson(JSON.parse(raw));
  } catch {
    return [];
  }
}

async function readGoalsRaw(): Promise<string | null> {
  const key = await getGoalsKey();
  const primaryStr = await SafeAsyncStorage.getItem(key);
  const primary = parseGoalsJson(primaryStr);

  if (key === LEGACY_GOALS_KEY) {
    return primaryStr;
  }

  let legacyGoals: Goal[] = [];
  const legacyStr = await SafeAsyncStorage.getItem(LEGACY_GOALS_KEY);
  if (legacyStr) {
    legacyGoals = parseGoalsJson(legacyStr);
  }

  if (legacyGoals.length === 0) {
    return primaryStr;
  }

  const merged = mergeGoalLists(primary, legacyGoals);
  const mergedStr = JSON.stringify(merged);
  await SafeAsyncStorage.setItem(key, mergedStr);
  await SafeAsyncStorage.removeItem(LEGACY_GOALS_KEY);
  return mergedStr;
}

async function writeGoalsRaw(goals: Goal[]): Promise<void> {
  const key = await getGoalsKey();
  await SafeAsyncStorage.setItem(key, JSON.stringify(goals));
}

function normalizeExercise(raw: unknown): Exercise {
  const e = raw as Record<string, unknown>;
  return {
    id: String(e?.id ?? `${Date.now()}-e`),
    name: String(e?.name ?? ''),
    weight: typeof e?.weight === 'string' ? e.weight : undefined,
    duration: typeof e?.duration === 'string' ? e.duration : undefined,
    sets: typeof e?.sets === 'number' && Number.isFinite(e.sets) ? e.sets : Number(e?.sets) || 0,
    reps: typeof e?.reps === 'number' && Number.isFinite(e.reps) ? e.reps : Number(e?.reps) || 0,
    isCompleted: Boolean(e?.isCompleted),
    completedDate: typeof e?.completedDate === 'string' ? e.completedDate : undefined,
  };
}

function normalizeGoalsFromJson(parsed: unknown): Goal[] {
  if (!Array.isArray(parsed)) return [];
  return parsed.map((item) => {
    const g = item as Record<string, unknown>;
    const exercisesRaw = g?.exercises;
    const exercises = Array.isArray(exercisesRaw)
      ? exercisesRaw.map(normalizeExercise)
      : [];
    return {
      id: String(g?.id ?? ''),
      name: String(g?.name ?? ''),
      exercises,
      createdAt: typeof g?.createdAt === 'string' ? g.createdAt : new Date().toISOString(),
    };
  });
}

function goalById(goals: Goal[], goalId: string): Goal | undefined {
  return goals.find((g) => String(g.id) === String(goalId));
}

/**
 * Merges two goal lists (e.g. per-user key + legacy `user_goals`).
 * Second array wins on duplicate goal ids for name/createdAt; exercises are unioned by id.
 */
function mergeGoalLists(primary: Goal[], secondary: Goal[]): Goal[] {
  const byId = new Map<string, Goal>();

  const add = (g: Goal) => {
    const id = String(g.id);
    const list = Array.isArray(g.exercises) ? g.exercises : [];
    const cur = byId.get(id);
    if (!cur) {
      byId.set(id, { ...g, exercises: [...list] });
      return;
    }
    const exMap = new Map<string, Exercise>();
    for (const e of cur.exercises) exMap.set(String(e.id), e);
    for (const e of list) exMap.set(String(e.id), e);
    byId.set(id, { ...cur, ...g, exercises: Array.from(exMap.values()) });
  };

  for (const g of secondary) add(g);
  for (const g of primary) add(g);
  return Array.from(byId.values());
}

/** When storage is empty/out-of-sync but the UI still has the goal (e.g. read/write backend mismatch). */
function mergeClientGoalIntoStored(stored: Goal[], clientGoals: Goal[], goalId: string): Goal[] {
  const id = String(goalId);
  const fromClient = clientGoals.find((g) => String(g.id) === id);
  if (!fromClient) return stored;
  const rest = stored.filter((g) => String(g.id) !== id);
  const rawEx = Array.isArray(fromClient.exercises) ? fromClient.exercises : [];
  const exercises: Exercise[] = rawEx.map((e) => ({
    id: String(e.id),
    name: e.name,
    weight: e.weight,
    duration: e.duration,
    sets: typeof e.sets === 'number' ? e.sets : Number(e.sets) || 0,
    reps: typeof e.reps === 'number' ? e.reps : Number(e.reps) || 0,
    isCompleted: Boolean(e.isCompleted),
    completedDate: e.completedDate,
  }));
  const merged: Goal = {
    id,
    name: fromClient.name,
    exercises,
    createdAt: fromClient.createdAt || new Date().toISOString(),
  };
  return [...rest, merged];
}

/**
 * When the active storage key does not contain the goal (e.g. session key mismatch),
 * find which AsyncStorage key actually holds that goal.
 */
async function digGoalBucket(
  goalId: string
): Promise<{ goals: Goal[]; sourceKey: string } | null> {
  const keysToCheck = new Set<string>();
  keysToCheck.add(LEGACY_GOALS_KEY);
  const u = await auth.getLoggedInUsername();
  if (u) keysToCheck.add(`user_goals_${u}`);
  try {
    const allKeys = await SafeAsyncStorage.getAllKeys();
    for (const k of allKeys) {
      if (k.startsWith('user_goals_')) keysToCheck.add(k);
    }
  } catch {
    // ignore
  }
  for (const storageKey of keysToCheck) {
    const raw = await SafeAsyncStorage.getItem(storageKey);
    if (!raw) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }
    const goals = normalizeGoalsFromJson(parsed);
    if (goalById(goals, goalId)) {
      return { goals, sourceKey: storageKey };
    }
  }
  return null;
}

async function writeGoalsToKeys(goals: Goal[], primarySourceKey: string | null): Promise<void> {
  const payload = JSON.stringify(goals);
  const canonicalKey = await getGoalsKey();
  if (primarySourceKey) {
    await SafeAsyncStorage.setItem(primarySourceKey, payload);
    if (primarySourceKey !== canonicalKey) {
      await SafeAsyncStorage.setItem(canonicalKey, payload);
    }
  } else {
    await SafeAsyncStorage.setItem(canonicalKey, payload);
  }
}

export const workoutStorage = {
  // Goals
  async addGoal(goalName: string): Promise<Goal> {
    try {
      const goalsStr = await readGoalsRaw();
      const goals: Goal[] = parseGoalsJson(goalsStr);

      const newGoal: Goal = {
        id: Date.now().toString(),
        name: goalName,
        exercises: [],
        createdAt: new Date().toISOString(),
      };

      goals.push(newGoal);
      await writeGoalsRaw(goals);

      return newGoal;
    } catch (error) {
      console.error('Failed to add goal', error);
      throw error;
    }
  },

  async getGoals(): Promise<Goal[]> {
    try {
      const goalsStr = await readGoalsRaw();
      return parseGoalsJson(goalsStr);
    } catch (error) {
      console.error('Failed to get goals', error);
      return [];
    }
  },

  async getGoal(goalId: string): Promise<Goal | null> {
    try {
      const goals = await this.getGoals();
      return goalById(goals, goalId) ?? null;
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
    duration?: string,
    clientSnapshot?: Goal[]
  ): Promise<Exercise> {
    try {
      let goals = await this.getGoals();
      let goal = goalById(goals, goalId);
      let sourceKey: string | null = null;

      if (!goal) {
        const dug = await digGoalBucket(goalId);
        if (dug) {
          goals = dug.goals;
          sourceKey = dug.sourceKey;
          goal = goalById(goals, goalId);
        }
      }

      if (!goal && clientSnapshot?.length) {
        goals = mergeClientGoalIntoStored(goals, clientSnapshot, goalId);
        goal = goalById(goals, goalId);
        sourceKey = null;
      }

      if (!goal) throw new Error('Goal not found');

      if (!Array.isArray(goal.exercises)) {
        goal.exercises = [];
      }

      const newExercise: Exercise = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        name,
        sets,
        reps,
        weight,
        duration,
        isCompleted: false,
      };

      goal.exercises.push(newExercise);
      await writeGoalsToKeys(goals, sourceKey);

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
      const goal = goalById(goals, goalId);

      if (!goal) throw new Error('Goal not found');

      const exercise = goal.exercises.find((e) => String(e.id) === String(exerciseId));
      if (!exercise) throw new Error('Exercise not found');

      Object.assign(exercise, updates);
      await writeGoalsRaw(goals);

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
      const goal = goalById(goals, goalId);

      if (!goal) throw new Error('Goal not found');

      const exercise = goal.exercises.find((e) => String(e.id) === String(exerciseId));
      if (!exercise) throw new Error('Exercise not found');

      exercise.isCompleted = true;
      exercise.completedDate = new Date().toISOString();

      await writeGoalsRaw(goals);

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
        const list = Array.isArray(goal.exercises) ? goal.exercises : [];
        list.forEach((exercise) => {
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
      const filtered = goals.filter((g) => String(g.id) !== String(goalId));
      await writeGoalsRaw(filtered);
      return true;
    } catch (error) {
      console.error('Failed to delete goal', error);
      return false;
    }
  },

  async deleteExercise(goalId: string, exerciseId: string): Promise<boolean> {
    try {
      const goals = await this.getGoals();
      const goal = goalById(goals, goalId);

      if (!goal) throw new Error('Goal not found');

      goal.exercises = goal.exercises.filter((e) => String(e.id) !== String(exerciseId));
      await writeGoalsRaw(goals);

      return true;
    } catch (error) {
      console.error('Failed to delete exercise', error);
      return false;
    }
  },
};
