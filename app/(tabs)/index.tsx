import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Exercise, Goal, workoutStorage } from '@/utils/workoutStorage';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const palette = useMemo(
    () => ({
      tint: Colors[colorScheme].tint,
      textMuted: isDark ? '#9BA1A6' : '#5A6570',
      card: isDark ? '#1E2329' : '#F1F4F8',
      cardDone: isDark ? '#181C22' : '#E8EBF0',
      border: isDark ? '#2E3540' : '#D4DCE6',
      borderStrong: isDark ? '#3D4654' : '#B8C4D4',
      progressTrack: isDark ? '#2A3038' : '#DEE6EF',
      shadow: isDark ? '#000' : '#1a1a2e',
    }),
    [colorScheme, isDark]
  );

  const dateFontSize = width < 380 ? 26 : 30;
  const [weekdayLabel, setWeekdayLabel] = useState('');
  const [dateRest, setDateRest] = useState('');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [completedCount, setCompletedCount] = useState(0);

  useFocusEffect(
    React.useCallback(() => {
      loadExercises();
    }, [])
  );

  useEffect(() => {
    const now = new Date();
    setWeekdayLabel(
      now.toLocaleDateString('en-US', {
        weekday: 'long',
      })
    );
    setDateRest(
      now.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    );
  }, []);

  const loadExercises = async () => {
    try {
      const loadedGoals = await workoutStorage.getGoals();
      setGoals(loadedGoals);

      const exercises: Exercise[] = [];
      loadedGoals.forEach((goal) => {
        exercises.push(...goal.exercises);
      });

      exercises.sort((a, b) => {
        if (a.isCompleted !== b.isCompleted) {
          return a.isCompleted ? 1 : -1;
        }
        if (!a.isCompleted) return 0;
        const ta = a.completedDate ? new Date(a.completedDate).getTime() : 0;
        const tb = b.completedDate ? new Date(b.completedDate).getTime() : 0;
        return ta - tb;
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

  const total = allExercises.length;
  const progressPct = total === 0 ? 0 : Math.round((completedCount / total) * 100);

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { borderBottomColor: palette.border }]}>
          <ThemedText style={[styles.kicker, { color: palette.textMuted }]}>Today</ThemedText>
          <ThemedText
            type="title"
            style={[styles.weekday, { fontSize: dateFontSize, lineHeight: dateFontSize + 6 }]}>
            {weekdayLabel}
          </ThemedText>
          <ThemedText style={[styles.dateLine, { color: palette.textMuted }]}>{dateRest}</ThemedText>

          <View
            style={[
              styles.progressCard,
              {
                backgroundColor: palette.card,
                borderColor: palette.border,
                ...Platform.select({
                  ios: {
                    shadowColor: palette.shadow,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDark ? 0.35 : 0.12,
                    shadowRadius: 8,
                  },
                  android: { elevation: 3 },
                }),
              },
            ]}>
            <View style={styles.progressHeader}>
              <ThemedText style={styles.progressTitle}>Daily progress</ThemedText>
              <ThemedText style={[styles.progressFraction, { color: palette.tint }]}>
                {completedCount}/{total}
              </ThemedText>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: palette.progressTrack }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progressPct}%`,
                    backgroundColor: palette.tint,
                  },
                ]}
              />
            </View>
            <ThemedText style={[styles.progressCaption, { color: palette.textMuted }]}>
              {total === 0
                ? 'Add exercises under Goals to see them here'
                : `${completedCount} of ${total} exercise${total === 1 ? '' : 's'} completed (${progressPct}%)`}
            </ThemedText>
          </View>
        </View>

        {allExercises.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View
              style={[
                styles.emptyIconCircle,
                { backgroundColor: palette.card, borderColor: palette.border },
              ]}>
              <MaterialIcons name="fitness-center" size={40} color={palette.tint} />
            </View>
            <ThemedText type="defaultSemiBold" style={styles.emptyTitle}>
              No exercises for today
            </ThemedText>
            <ThemedText style={[styles.emptyBody, { color: palette.textMuted }]}>
              Open the Goals tab, pick a goal, and add exercises. They will show up here in one place.
            </ThemedText>
          </View>
        ) : (
          <View style={styles.listSection}>
            <ThemedText style={[styles.sectionLabel, { color: palette.textMuted }]}>
              Your exercises
            </ThemedText>
            <View style={styles.exerciseList}>
              {allExercises.map((exercise) => {
                const goal = getGoalForExercise(exercise.id);
                return (
                  <View
                    key={exercise.id}
                    style={[
                      styles.exerciseItem,
                      {
                        backgroundColor: exercise.isCompleted ? palette.cardDone : palette.card,
                        borderColor: exercise.isCompleted ? palette.border : palette.borderStrong,
                      },
                      Platform.select({
                        ios: {
                          shadowColor: palette.shadow,
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: isDark ? 0.25 : 0.08,
                          shadowRadius: 4,
                        },
                        android: { elevation: exercise.isCompleted ? 0 : 2 },
                      }),
                    ]}>
                    <TouchableOpacity
                      style={styles.checkboxHit}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: exercise.isCompleted }}
                      onPress={() => {
                        if (goal) {
                          handleCompleteExercise(goal.id, exercise.id);
                        }
                      }}>
                      <View
                        style={[
                          styles.checkboxInner,
                          {
                            borderColor: exercise.isCompleted ? palette.tint : palette.borderStrong,
                            backgroundColor: 'transparent',
                          },
                        ]}>
                        {exercise.isCompleted && (
                          <MaterialIcons name="check" size={26} color={palette.tint} />
                        )}
                      </View>
                    </TouchableOpacity>

                    <View style={styles.exerciseDetails}>
                      <ThemedText
                        type="defaultSemiBold"
                        style={[
                          styles.exerciseName,
                          exercise.isCompleted && styles.exerciseNameCompleted,
                        ]}>
                        {exercise.name}
                      </ThemedText>
                      {goal ? (
                        <View style={styles.goalChip}>
                          <MaterialIcons name="flag" size={14} color={palette.textMuted} />
                          <ThemedText style={[styles.goalChipText, { color: palette.textMuted }]}>
                            {goal.name}
                          </ThemedText>
                        </View>
                      ) : null}
                      <ThemedText style={[styles.exerciseMetadata, { color: palette.textMuted }]}>
                        {exercise.sets} sets × {exercise.reps} reps
                        {exercise.weight ? ` · ${exercise.weight}` : ''}
                        {exercise.duration ? ` · ${exercise.duration}` : ''}
                      </ThemedText>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  kicker: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  weekday: {
    fontWeight: '700',
    marginBottom: 4,
  },
  dateLine: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 18,
  },
  progressCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  progressFraction: {
    fontSize: 20,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressCaption: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyWrap: {
    paddingHorizontal: 24,
    paddingTop: 36,
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
  },
  emptyBody: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
  },
  listSection: {
    paddingHorizontal: 20,
    paddingTop: 22,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  exerciseList: {
    gap: 14,
    paddingBottom: 8,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  checkboxHit: {
    marginRight: 14,
    paddingVertical: 4,
    paddingRight: 2,
  },
  checkboxInner: {
    width: 34,
    height: 34,
    borderWidth: 2,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseDetails: {
    flex: 1,
    minWidth: 0,
  },
  exerciseName: {
    fontSize: 17,
    marginBottom: 6,
  },
  exerciseNameCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.55,
  },
  goalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  goalChipText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  exerciseMetadata: {
    fontSize: 14,
    lineHeight: 20,
  },
});
