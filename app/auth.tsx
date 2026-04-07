import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { auth } from '@/utils/auth';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export interface AuthScreenProps {
  onAuthSuccess: () => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const result = await auth.login(username, password);
      if (result.success) {
        onAuthSuccess();
      } else {
        Alert.alert('Login Failed', result.error || 'Invalid credentials');
      }
    } catch (err) {
      Alert.alert('Error', 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!username.trim() || !password.trim() || !name.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const result = await auth.createAccount(username, password, name);
      if (result.success) {
        Alert.alert('Success', 'Account created! You are now logged in.');
        onAuthSuccess();
      } else {
        Alert.alert('Account Creation Failed', result.error || 'Failed to create account');
      }
    } catch (err) {
      Alert.alert('Error', 'An error occurred while creating account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <ThemedText type="title" style={styles.title}>
            Workout Tracker
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {isLogin ? 'Welcome Back' : 'Get Started'}
          </ThemedText>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#999"
            value={username}
            onChangeText={setUsername}
            editable={!isLoading}
            autoCapitalize="none"
          />

          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
              editable={!isLoading}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!isLoading}
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={isLogin ? handleLogin : handleCreateAccount}
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>{isLogin ? 'Log In' : 'Create Account'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setIsLogin(!isLogin);
              setUsername('');
              setPassword('');
              setName('');
            }}
            disabled={isLoading}>
            <ThemedText style={styles.toggleText}>
              {isLogin ? "Don't have an account? Create one" : 'Already have an account? Log in'}
            </ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.demoContainer}>
          <ThemedText style={styles.demoLabel}>Demo Credentials:</ThemedText>
          <ThemedText style={styles.demoText}>Username: demo</ThemedText>
          <ThemedText style={styles.demoText}>Password: demo123</ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  formContainer: {
    gap: 16,
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    color: '#333',
  },
  button: {
    backgroundColor: '#c1121f',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleText: {
    textAlign: 'center',
    color: '#c1121f',
    fontSize: 14,
    marginTop: 8,
  },
  demoContainer: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 20,
    marginTop: 20,
  },
  demoLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    opacity: 0.6,
  },
  demoText: {
    fontSize: 12,
    opacity: 0.5,
    marginBottom: 4,
  },
});
