import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { AuthSessionProvider } from '@/contexts/auth-session';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { auth } from '@/utils/auth';
import AuthScreen from './auth';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize demo account on first run
        try {
          await auth.initializeDemoAccount();
        } catch (demoError) {
          // Log but don't fail - storage might not be available yet
          console.warn('Demo account initialization warning:', demoError);
        }

        // Check if user is logged in
        const loggedIn = await auth.isLoggedIn();
        setIsLoggedIn(loggedIn);
      } catch (error) {
        console.error('Failed to initialize app', error);
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const signOut = useCallback(async () => {
    await auth.logout();
    setIsLoggedIn(false);
  }, []);

  const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  if (isLoading) {
    return (
      <ThemeProvider value={theme}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
        <StatusBar style="auto" />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider value={theme}>
      <AuthSessionProvider signOut={signOut}>
        {!isLoggedIn ? (
          <AuthScreen onAuthSuccess={() => setIsLoggedIn(true)} />
        ) : (
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
        )}
        <StatusBar style="auto" />
      </AuthSessionProvider>
    </ThemeProvider>
  );
}
