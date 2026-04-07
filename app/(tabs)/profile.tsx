import { useFocusEffect } from '@react-navigation/native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuthSession } from '@/contexts/auth-session';
import { auth, User } from '@/utils/auth';
import { workoutStorage } from '@/utils/workoutStorage';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const titleSize = width < 380 ? 26 : 30;
  const { signOut } = useAuthSession();
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
            await signOut();
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
    <ThemedView style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <ThemedText type="title" style={{ fontSize: titleSize, lineHeight: titleSize + 4 }}>
          Profile
        </ThemedText>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <ThemedText style={styles.avatarText}>
              {user?.name.charAt(0).toUpperCase()}
            </ThemedText>
          </View>
          <View style={styles.userInfo}>
            <ThemedText type="subtitle" style={styles.displayName}>
              {user?.name}
            </ThemedText>
            <ThemedText style={styles.userHandle}>@{user?.username}</ThemedText>
            <ThemedText style={styles.statsLine}>
              {totalWorkouts} exercises tracked · {completedToday} completed
              {totalWorkouts > 0
                ? ` · ${((completedToday / totalWorkouts) * 100).toFixed(0)}% done`
                : ''}
            </ThemedText>
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
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    fontSize: 18,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 28,
    paddingBottom: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.35)',
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
    justifyContent: 'center',
    minHeight: 60,
  },
  displayName: {
    fontSize: 20,
    marginBottom: 2,
  },
  userHandle: {
    fontSize: 14,
    opacity: 0.55,
    marginBottom: 10,
  },
  statsLine: {
    fontSize: 13,
    opacity: 0.65,
    lineHeight: 18,
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
