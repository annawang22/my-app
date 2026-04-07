import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import SafeAsyncStorage from './asyncStorageWrapper';

const isSecureAvailable = Platform.OS !== 'web';

/**
 * Stores small secrets in the OS keychain (iOS) / Keystore (Android).
 * On web, falls back to AsyncStorage with a namespaced key (browser storage is not hardware-backed).
 */
export const credentialStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (isSecureAvailable) {
        return await SecureStore.getItemAsync(key);
      }
      return await SafeAsyncStorage.getItem(`secure_${key}`);
    } catch {
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    if (isSecureAvailable) {
      await SecureStore.setItemAsync(key, value);
    } else {
      await SafeAsyncStorage.setItem(`secure_${key}`, value);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (isSecureAvailable) {
        await SecureStore.deleteItemAsync(key);
      } else {
        await SafeAsyncStorage.removeItem(`secure_${key}`);
      }
    } catch {
      // ignore
    }
  },
};
