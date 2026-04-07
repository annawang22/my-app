import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  Text,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { workoutStorage, Goal } from '@/utils/workoutStorage';

export default function GoalsScreen() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  // Exercise form state
  const [exerciseName, setExerciseName] = useState('');
  const [exerciseSets, setExerciseSets] = useState('3');
  const [exerciseReps, setExerciseReps] = useState('10');
  const [exerciseWeight, setExerciseWeight] = useState('');
  const [exerciseDuration, setExerciseDuration] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      loadGoals();
    }, [])
  );

  const loadGoals = async () => {
    try {
      const loadedGoals = await workoutStorage.getGoals();
      setGoals(loadedGoals);
    } catch (error) {
      console.error('Failed to load goals', error);
    }
  };

  const handleAddGoal = async () => {
    if (!newGoalName.trim()) {
      Alert.alert('Error', 'Goal name is required');
      return;
    }

    try {
      await workoutStorage.addGoal(newGoalName);
      setNewGoalName('');
      setShowAddGoalModal(false);
      await loadGoals();
    } catch (err) {
      Alert.alert('Error', 'Failed to add goal');
    }
  };

  const handleAddExercise = async () => {
    if (!exerciseName.trim() || !exerciseSets || !exerciseReps) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    if (!selectedGoalId) {
      Alert.alert('Error', 'No goal selected');
      return;
    }

    try {
      await workoutStorage.addExercise(
        selectedGoalId,
        exerciseName,
        parseInt(exerciseSets),
        parseInt(exerciseReps),
        exerciseWeight || undefined,
        exerciseDuration || undefined
      );

      // Reset form
      setExerciseName('');
      setExerciseSets('3');
      setExerciseReps('10');
      setExerciseWeight('');
      setExerciseDuration('');
      setShowAddExerciseModal(false);
      setSelectedGoalId(null);

      await loadGoals();
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

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">My Goals</ThemedText>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
              <View key={goal.id} style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <ThemedText type="subtitle">{goal.name}</ThemedText>
                  <TouchableOpacity
                    onPress={() => {
                      handleDeleteGoal(goal.id);
                    }}>
                    <Text style={styles.deleteButton}>✕</Text>
                  </TouchableOpacity>
                </View>

                {goal.exercises.length === 0 ? (
                  <ThemedText style={styles.noExercistes}>
                    No exercises yet. Tap + to add one
                  </ThemedText>
                ) : (
                  <View style={styles.exercisesList}>
                    {goal.exercises.map((exercise) => (
                      <View key={exercise.id} style={styles.exerciseItem}>
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

      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setShowAddGoalModal(true)}>
        <Text style={styles.floatingButtonText}>+</Text>
      </TouchableOpacity>

      {/* Add Goal Modal */}
      <Modal
        visible={showAddGoalModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddGoalModal(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.modalContent}>
              <ThemedText type="subtitle" style={styles.modalTitle}>
                Create New Goal
              </ThemedText>

              <TextInput
                style={styles.input}
                placeholder="Goal name (e.g., Build Glutes)"
                placeholderTextColor="#999"
                value={newGoalName}
                onChangeText={setNewGoalName}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    setNewGoalName('');
                    setShowAddGoalModal(false);
                  }}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.createButton]}
                  onPress={handleAddGoal}>
                  <Text style={styles.buttonText}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Add Exercise Modal */}
      <Modal
        visible={showAddExerciseModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddExerciseModal(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.modalContent}>
              <ThemedText type="subtitle" style={styles.modalTitle}>
                Add Exercise
              </ThemedText>

              <TextInput
                style={styles.input}
                placeholder="Exercise name"
                placeholderTextColor="#999"
                value={exerciseName}
                onChangeText={setExerciseName}
              />

              <View style={styles.twoColumnRow}>
                <TextInput
                  style={[styles.input, styles.halfWidth]}
                  placeholder="Sets"
                  placeholderTextColor="#999"
                  value={exerciseSets}
                  onChangeText={setExerciseSets}
                  keyboardType="number-pad"
                />
                <TextInput
                  style={[styles.input, styles.halfWidth]}
                  placeholder="Reps"
                  placeholderTextColor="#999"
                  value={exerciseReps}
                  onChangeText={setExerciseReps}
                  keyboardType="number-pad"
                />
              </View>

              <TextInput
                style={styles.input}
                placeholder="Weight (optional, e.g., 55 pounds)"
                placeholderTextColor="#999"
                value={exerciseWeight}
                onChangeText={setExerciseWeight}
              />

              <TextInput
                style={styles.input}
                placeholder="Duration (optional, e.g., 30 minutes)"
                placeholderTextColor="#999"
                value={exerciseDuration}
                onChangeText={setExerciseDuration}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    setExerciseName('');
                    setExerciseSets('3');
                    setExerciseReps('10');
                    setExerciseWeight('');
                    setExerciseDuration('');
                    setShowAddExerciseModal(false);
                    setSelectedGoalId(null);
                  }}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.createButton]}
                  onPress={handleAddExercise}>
                  <Text style={styles.buttonText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
  goalsList: {
    gap: 16,
    paddingBottom: 100,
  },
  goalCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#f9f9f9',
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
    gap: 8,
    marginBottom: 12,
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 6,
    padding: 12,
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
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '85%',
  },
  modalTitle: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
    color: '#333',
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
  cancelButton: {
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#c1121f',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
});
