import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Goal, workoutStorage } from '@/utils/workoutStorage';

export default function GoalsScreen() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  // Exercise form state
  const [exerciseName, setExerciseName] = useState('');
  const [exerciseSets, setExerciseSets] = useState('');
  const [exerciseReps, setExerciseReps] = useState('');
  const [exerciseWeight, setExerciseWeight] = useState('');
  const [exerciseDuration, setExerciseDuration] = useState('');

  const goalCardBg = useThemeColor({ light: '#f4f5f6', dark: '#25282c' }, 'background');
  const exerciseRowBg = useThemeColor({ light: '#ffffff', dark: '#2e3134' }, 'background');
  const cardBorderColor = useThemeColor({ light: '#d0d4d8', dark: '#3a3e42' }, 'icon');
  const modalSurface = useThemeColor({ light: '#ffffff', dark: '#2c2f33' }, 'background');
  const inputBg = useThemeColor({ light: '#f4f5f6', dark: '#363a3e' }, 'background');
  const inputTextColor = useThemeColor({}, 'text');
  const cancelButtonBg = useThemeColor({ light: '#e2e5e9', dark: '#3a3f44' }, 'background');
  const cancelButtonBorder = useThemeColor({ light: '#5c6370', dark: '#9aa3ad' }, 'icon');
  const cancelLabelColor = useThemeColor({}, 'text');

  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const headerTitleSize = windowWidth < 380 ? 26 : 30;
  const goalNameInputRef = useRef<TextInput>(null);
  const exerciseNameInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (showAddGoalModal) {
      const t = setTimeout(() => goalNameInputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [showAddGoalModal]);

  useEffect(() => {
    if (showAddExerciseModal) {
      const t = setTimeout(() => exerciseNameInputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [showAddExerciseModal]);

  const loadGoals = useCallback(async () => {
    try {
      const loadedGoals = await workoutStorage.getGoals();
      setGoals(loadedGoals);
    } catch (error) {
      console.error('Failed to load goals', error);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadGoals();
    }, [loadGoals])
  );

  const handleAddGoal = async () => {
    const name = newGoalName.trim();
    if (!name) {
      Alert.alert('Error', 'Goal name is required');
      return;
    }

    try {
      const created = await workoutStorage.addGoal(name);
      setNewGoalName('');
      setShowAddGoalModal(false);
      const loaded = await workoutStorage.getGoals();
      setGoals((prev) => {
        if (loaded.length > 0) return loaded;
        if (prev.some((g) => g.id === created.id)) return prev;
        return [...prev, created];
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to add goal');
    }
  };

  const handleAddExercise = async () => {
    const name = exerciseName.trim();
    if (!name || !exerciseSets || !exerciseReps) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    const setsNum = Number.parseInt(exerciseSets.trim(), 10);
    const repsNum = Number.parseInt(exerciseReps.trim(), 10);
    if (!Number.isFinite(setsNum) || setsNum < 1 || !Number.isFinite(repsNum) || repsNum < 1) {
      Alert.alert('Error', 'Enter valid whole numbers for sets and reps (at least 1)');
      return;
    }

    if (!selectedGoalId) {
      Alert.alert('Error', 'No goal selected');
      return;
    }

    const goalIdForUpdate = selectedGoalId;

    try {
      const created = await workoutStorage.addExercise(
        goalIdForUpdate,
        name,
        setsNum,
        repsNum,
        exerciseWeight.trim() || undefined,
        exerciseDuration.trim() || undefined,
        goals
      );

      setGoals((prev) =>
        prev.map((g) =>
          String(g.id) === String(goalIdForUpdate)
            ? { ...g, exercises: [...(Array.isArray(g.exercises) ? g.exercises : []), created] }
            : g
        )
      );

      setExerciseName('');
      setExerciseSets('');
      setExerciseReps('');
      setExerciseWeight('');
      setExerciseDuration('');
      setShowAddExerciseModal(false);
      setSelectedGoalId(null);

      const loadedAfter = await workoutStorage.getGoals();
      setGoals((prev) => (loadedAfter.length > 0 ? loadedAfter : prev));
    } catch (error) {
      Alert.alert('Error', 'Failed to add exercise');
    }
  };

  const handleDeleteGoal = (goalId: string) => {
    Alert.alert('Delete Goal', 'Are you sure you want to delete this goal?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            await workoutStorage.deleteGoal(goalId);
            await loadGoals();
          } catch (err) {
            Alert.alert('Error', 'Failed to delete goal');
          }
        },
      },
    ]);
  };

  const handleDeleteExercise = (goalId: string, exerciseId: string) => {
    Alert.alert('Delete Exercise', 'Are you sure you want to delete this exercise?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            await workoutStorage.deleteExercise(goalId, exerciseId);
            await loadGoals();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete exercise');
          }
        },
      },
    ]);
  };

  const modalOpen = showAddGoalModal || showAddExerciseModal;

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <ThemedText type="title" style={{ fontSize: headerTitleSize, lineHeight: headerTitleSize + 4 }}>
          My Goals
        </ThemedText>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {goals.length === 0 ? (
          <ThemedView style={styles.emptyState}>
            <ThemedText style={styles.emptyText}>No goals yet</ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Create your first workout goal to get started
            </ThemedText>
          </ThemedView>
        ) : (
          <View style={styles.goalsList}>
            {goals.map((goal) => (
              <View
                key={goal.id}
                style={[
                  styles.goalCard,
                  { backgroundColor: goalCardBg, borderColor: cardBorderColor },
                ]}>
                <View style={styles.goalHeader}>
                  <ThemedText type="subtitle">{goal.name}</ThemedText>
                  <TouchableOpacity
                    onPress={() => {
                      handleDeleteGoal(goal.id);
                    }}>
                    <Text style={styles.deleteButton}>✕</Text>
                  </TouchableOpacity>
                </View>

                {(Array.isArray(goal.exercises) ? goal.exercises : []).length === 0 ? (
                  <ThemedText style={styles.noExercistes}>
                    No exercises yet. Tap + to add one
                  </ThemedText>
                ) : (
                  <View style={styles.exercisesList}>
                    {(Array.isArray(goal.exercises) ? goal.exercises : []).map((exercise) => (
                      <View
                        key={exercise.id}
                        style={[styles.exerciseItem, { backgroundColor: exerciseRowBg }]}>
                        <View style={styles.exerciseInfo}>
                          <ThemedText style={styles.exerciseName}>
                            {exercise.name}
                          </ThemedText>
                          <ThemedText style={styles.exerciseDetails}>
                            {exercise.sets} sets × {exercise.reps} reps
                            {exercise.weight ? ` • ${exercise.weight}` : ''}
                            {exercise.duration ? ` • ${exercise.duration}` : ''}
                          </ThemedText>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleDeleteExercise(goal.id, exercise.id)}>
                          <Text style={styles.deleteButton}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                <TouchableOpacity
                  style={styles.addExerciseButton}
                  onPress={() => {
                    setSelectedGoalId(goal.id);
                    setShowAddExerciseModal(true);
                  }}>
                  <Text style={styles.addButtonText}>+ Add Exercise</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View
        style={[styles.floatingButtonWrap, { bottom: insets.bottom + 72 }]}
        pointerEvents={modalOpen ? 'none' : 'auto'}>
        <TouchableOpacity style={styles.floatingButton} onPress={() => setShowAddGoalModal(true)}>
          <Text style={styles.floatingButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Add Goal Modal */}
      <Modal
        visible={showAddGoalModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          Keyboard.dismiss();
          setShowAddGoalModal(false);
        }}>
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}>
          <View style={[styles.modalOverlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <Pressable
              style={StyleSheet.absoluteFillObject}
              accessibilityRole="button"
              accessibilityLabel="Dismiss"
              onPress={() => {
                Keyboard.dismiss();
                setShowAddGoalModal(false);
              }}
            />
            <ScrollView
              style={styles.modalScrollView}
              bounces={false}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScroll}>
              <View style={[styles.modalContent, { backgroundColor: modalSurface }]}>
                  <ThemedText type="subtitle" style={styles.modalTitle}>
                    Create New Goal
                  </ThemedText>

                  <TextInput
                    ref={goalNameInputRef}
                    style={[
                      styles.input,
                      { backgroundColor: inputBg, color: inputTextColor, borderColor: cardBorderColor },
                    ]}
                    placeholder="Goal name (e.g., Build Glutes)"
                    placeholderTextColor="#999"
                    value={newGoalName}
                    onChangeText={setNewGoalName}
                    editable
                    returnKeyType="done"
                    blurOnSubmit
                    onSubmitEditing={handleAddGoal}
                    autoCorrect
                    autoCapitalize="sentences"
                  />

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[
                        styles.button,
                        {
                          backgroundColor: cancelButtonBg,
                          borderColor: cancelButtonBorder,
                          borderWidth: 2,
                        },
                      ]}
                      onPress={() => {
                        setNewGoalName('');
                        Keyboard.dismiss();
                        setShowAddGoalModal(false);
                      }}>
                      <Text style={[styles.cancelButtonText, { color: cancelLabelColor }]}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.button, styles.createButton]}
                      onPress={handleAddGoal}>
                      <Text style={styles.buttonText}>Create</Text>
                    </TouchableOpacity>
                  </View>
                </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Exercise Modal */}
      <Modal
        visible={showAddExerciseModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          Keyboard.dismiss();
          setShowAddExerciseModal(false);
        }}>
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}>
          <View style={[styles.modalOverlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <Pressable
              style={StyleSheet.absoluteFillObject}
              onPress={() => {
                Keyboard.dismiss();
                setShowAddExerciseModal(false);
              }}
            />
            <ScrollView
              style={styles.modalScrollView}
              bounces={false}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScroll}>
                <View style={[styles.modalContent, { backgroundColor: modalSurface }]}>
                  <ThemedText type="subtitle" style={styles.modalTitle}>
                    Add Exercise
                  </ThemedText>

                  <TextInput
                    ref={exerciseNameInputRef}
                    style={[
                      styles.input,
                      { backgroundColor: inputBg, color: inputTextColor, borderColor: cardBorderColor },
                    ]}
                    placeholder="Exercise name"
                    placeholderTextColor="#999"
                    value={exerciseName}
                    onChangeText={setExerciseName}
                    editable
                    returnKeyType="next"
                    autoCorrect
                  />

                  <View style={styles.twoColumnRow}>
                <TextInput
                  style={[
                    styles.input,
                    styles.halfWidth,
                    { backgroundColor: inputBg, color: inputTextColor, borderColor: cardBorderColor },
                  ]}
                  placeholder="Sets"
                  placeholderTextColor="#999"
                  value={exerciseSets}
                  onChangeText={setExerciseSets}
                  keyboardType="number-pad"
                />
                <TextInput
                  style={[
                    styles.input,
                    styles.halfWidth,
                    { backgroundColor: inputBg, color: inputTextColor, borderColor: cardBorderColor },
                  ]}
                  placeholder="Reps"
                  placeholderTextColor="#999"
                  value={exerciseReps}
                  onChangeText={setExerciseReps}
                  keyboardType="number-pad"
                />
                  </View>

                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: inputBg, color: inputTextColor, borderColor: cardBorderColor },
                    ]}
                    placeholder="Weight (optional, e.g., 55 pounds)"
                    placeholderTextColor="#999"
                    value={exerciseWeight}
                    onChangeText={setExerciseWeight}
                  />

                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: inputBg, color: inputTextColor, borderColor: cardBorderColor },
                    ]}
                    placeholder="Duration (optional, e.g., 30 minutes)"
                    placeholderTextColor="#999"
                    value={exerciseDuration}
                    onChangeText={setExerciseDuration}
                  />

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[
                        styles.button,
                        {
                          backgroundColor: cancelButtonBg,
                          borderColor: cancelButtonBorder,
                          borderWidth: 2,
                        },
                      ]}
                      onPress={() => {
                        setExerciseName('');
                        setExerciseSets('');
                        setExerciseReps('');
                        setExerciseWeight('');
                        setExerciseDuration('');
                        Keyboard.dismiss();
                        setShowAddExerciseModal(false);
                        setSelectedGoalId(null);
                      }}>
                      <Text style={[styles.cancelButtonText, { color: cancelLabelColor }]}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.button, styles.createButton]}
                      onPress={handleAddExercise}>
                      <Text style={styles.buttonText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  content: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
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
  goalsList: {
    gap: 16,
    paddingBottom: 100,
  },
  goalCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  deleteButton: {
    fontSize: 20,
    color: '#999',
    padding: 4,
  },
  noExercistes: {
    fontSize: 13,
    opacity: 0.6,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  exercisesList: {
    marginBottom: 12,
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  exerciseDetails: {
    fontSize: 12,
    opacity: 0.6,
  },
  addExerciseButton: {
    borderWidth: 1,
    borderColor: '#c1121f',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#c1121f',
    fontWeight: '600',
    fontSize: 13,
  },
  floatingButtonWrap: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#c1121f',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  floatingButtonText: {
    fontSize: 28,
    color: 'white',
    fontWeight: 'bold',
  },
  modalRoot: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollView: {
    width: '100%',
    maxWidth: 440,
    zIndex: 2,
    elevation: 8,
  },
  modalScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalContent: {
    borderRadius: 12,
    padding: 18,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  modalTitle: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 15,
    minHeight: 48,
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  halfWidth: {
    flex: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontWeight: '700',
    fontSize: 15,
  },
  createButton: {
    backgroundColor: '#c1121f',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
});
