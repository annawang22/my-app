import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { workoutStorage, Exercise, Goal } from '@/utils/workoutStorage';

export default function HomeScreen() {
  const [date, setDate] = useState<string>('');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [completedCount, setCompletedCount] = useState(0);

  useFocusEffect(
    React.useCallback(() => {
      loadExercises();
    }, [])
  );

  useEffect(() => {
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    setDate(today);
  }, []);

  const loadExercises = async () => {
    try {
      const loadedGoals = await workoutStorage.getGoals();
      setGoals(loadedGoals);

      // Gather all exercises from all goals
      const exercises: Exercise[] = [];
      loadedGoals.forEach((goal) => {
        exercises.push(...goal.exercises);
      });

      // Sort: incomplete first, then completed
      exercises.sort((a, b) => {
        if (a.isCompleted === b.isCompleted) return 0;
        return a.isCompleted ? 1 : -1;
      });

      setAllExercises(exercises);
      setCompletedCount(exercises.filter((e) => e.isCompleted).length);
    } catch (error) {
      console.error('Failed to load exercises', error);
    }
  };

  const handleCompleteExercise = async (goalId: string, exerciseId: string) => {
    try {
      await workoutStorage.markExerciseComplete(goalId, exerciseId);
      await loadExercises();
    } catch (error) {
      console.error('Failed to complete exercise', error);
    }
  };

  const getGoalForExercise = (exerciseId: string): Goal | undefined => {
    return goals.find((goal) => goal.exercises.some((ex) => ex.id === exerciseId));
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.dateText}>
          {date}
        </ThemedText>
        <ThemedText style={styles.progressText}>
          {completedCount} of {allExercises.length} completed
        </ThemedText>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {allExercises.length === 0 ? (
          <ThemedView style={styles.emptyState}>
            <ThemedText style={styles.emptyText}>No workouts yet</ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Go to Goals tab to add your first workout
            </ThemedText>
          </ThemedView>
        ) : (
          <View style={styles.exerciseList}>
            {allExercises.map((exercise) => {
              const goal = getGoalForExercise(exercise.id);
              return (
                <View
                  key={exercise.id}
                  style={[
                    styles.exerciseItem,
                    exercise.isCompleted && styles.exerciseItemCompleted,
                  ]}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => {
                      if (goal) {
                        handleCompleteExercise(goal.id, exercise.id);
                      }
                    }}>
                    <View
                      style={[
                        styles.checkboxInner,
                        exercise.isCompleted && styles.checkboxInnerChecked,
                      ]}>
                      {exercise.isCompleted && (
                        <ThemedText style={styles.checkmark}>✓</ThemedText>
                      )}
                    </View>
                  </TouchableOpacity>

                  <View style={styles.exerciseDetails}>
                    <ThemedText
                      style={[
                        styles.exerciseName,
                        exercise.isCompleted && styles.exerciseNameCompleted,
                      ]}>
                      {exercise.name}
                    </ThemedText>
                    <ThemedText style={styles.exerciseMetadata}>
                      {exercise.sets} sets × {exercise.reps} reps
                      {exercise.weight ? ` • ${exercise.weight}` : ''}
                      {exercise.duration ? ` • ${exercise.duration}` : ''}
                    </ThemedText>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dateText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    opacity: 0.6,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
  },
  exerciseList: {
    gap: 12,
    paddingBottom: 30,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#c1121f',
  },
  exerciseItemCompleted: {
    backgroundColor: '#f0f0f0',
    borderLeftColor: '#999',
  },
  checkbox: {
    marginRight: 16,
  },
  checkboxInner: {
    width: 28,
    height: 28,
    borderWidth: 2,
    borderColor: '#c1121f',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInnerChecked: {
    backgroundColor: '#c1121f',
    borderColor: '#c1121f',
  },
  checkmark: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  exerciseDetails: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  exerciseNameCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  exerciseMetadata: {
    fontSize: 13,
    opacity: 0.6,
  },
});

