import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  Text,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { auth, User } from '@/utils/auth';
import { workoutStorage } from '@/utils/workoutStorage';

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [completedToday, setCompletedToday] = useState(0);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const currentUser = await auth.getCurrentUser();
      setUser(currentUser);

      // Get workout statistics
      const goals = await workoutStorage.getGoals();
      let totalExercises = 0;
      let completedExercises = 0;

      goals.forEach((goal) => {
        goal.exercises.forEach((exercise) => {
          totalExercises++;
          if (exercise.isCompleted) {
            completedExercises++;
          }
        });
      });

      setTotalWorkouts(totalExercises);
      setCompletedToday(completedExercises);
    } catch (err) {
      console.error('Failed to load user data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Logout',
        onPress: async () => {
          try {
            await auth.logout();
            router.replace('/');
          } catch (error) {
            Alert.alert('Error', 'Failed to logout');
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" style={{ marginTop: 100 }} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Profile</ThemedText>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info Section */}
        <View style={styles.section}>
          <View style={styles.userGreeting}>
            <View style={styles.avatar}>
              <ThemedText style={styles.avatarText}>
                {user?.name.charAt(0).toUpperCase()}
              </ThemedText>
            </View>
            <View style={styles.userInfo}>
              <ThemedText type="subtitle" style={styles.welcomeText}>
                Welcome {user?.name}
              </ThemedText>
              <ThemedText style={styles.userHandle}>@{user?.username}</ThemedText>
            </View>
          </View>
        </View>

        {/* Achievements Section */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Achievements
          </ThemedText>

          <View style={styles.achievementsGrid}>
            <View style={styles.achievementCard}>
              <ThemedText style={styles.achievementNumber}>{totalWorkouts}</ThemedText>
              <ThemedText style={styles.achievementLabel}>Total Exercises</ThemedText>
            </View>

            <View style={styles.achievementCard}>
              <ThemedText style={styles.achievementNumber}>{completedToday}</ThemedText>
              <ThemedText style={styles.achievementLabel}>Completed</ThemedText>
            </View>

            <View style={styles.achievementCard}>
              <ThemedText style={styles.achievementNumber}>
                {totalWorkouts > 0 ? ((completedToday / totalWorkouts) * 100).toFixed(0) : 0}%
              </ThemedText>
              <ThemedText style={styles.achievementLabel}>Completion Rate</ThemedText>
            </View>
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Settings
          </ThemedText>

          <View style={styles.settingItem}>
            <View>
              <ThemedText style={styles.settingLabel}>Notifications</ThemedText>
              <ThemedText style={styles.settingDescription}>
                Receive workout reminders
              </ThemedText>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#ccc', true: '#c1121f' }}
              thumbColor="white"
            />
          </View>

          <View style={styles.settingItem}>
            <ThemedText style={styles.settingLabel}>Dark Mode</ThemedText>
            <ThemedText style={styles.settingDescription}>
              Use dark color scheme
            </ThemedText>
          </View>

          <View style={styles.settingItem}>
            <ThemedText style={styles.settingLabel}>App Version</ThemedText>
            <ThemedText style={styles.settingDescription}>1.0.0</ThemedText>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    fontSize: 18,
  },
  userGreeting: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#c1121f',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  userInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    marginBottom: 4,
  },
  userHandle: {
    fontSize: 13,
    opacity: 0.6,
  },
  achievementsGrid: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  achievementCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#c1121f',
    marginBottom: 4,
  },
  achievementLabel: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    opacity: 0.6,
  },
  logoutButton: {
    backgroundColor: '#c1121f',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 30,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
