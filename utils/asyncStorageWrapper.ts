// Safe AsyncStorage wrapper with fallback for web, in-memory cache, and error handling.
// workoutStorage and auth use this so a missing native module does not throw on every read.

import { Platform } from 'react-native';

let AsyncStorageLib: any;
let isInitialized = false;

let loggedNativeFallback = false;

/** Last-resort store when native throws and localStorage is missing (common on native RN). */
const memoryStore = new Map<string, string>();

const isWebPlatform = (): boolean => Platform.OS === 'web';

const initializeNativeModule = (): void => {
  if (isInitialized) return;
  isInitialized = true;

  if (isWebPlatform()) {
    return;
  }

  try {
    AsyncStorageLib = require('@react-native-async-storage/async-storage').default;
  } catch {
    AsyncStorageLib = undefined;
    if (!loggedNativeFallback) {
      loggedNativeFallback = true;
      console.warn(
        '[SafeAsyncStorage] @react-native-async-storage could not load; using localStorage only.'
      );
    }
  }
};

const localStorageFallback = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
    } catch (e) {
      console.warn('localStorage not available');
    }
    return null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn('localStorage not available');
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn('localStorage not available');
    }
  },
  getAllKeys: async (): Promise<string[]> => {
    try {
      if (typeof localStorage !== 'undefined') {
        return Object.keys(localStorage);
      }
    } catch (e) {
      console.warn('localStorage not available');
    }
    return [];
  },
  clear: async (): Promise<void> => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }
    } catch (e) {
      console.warn('localStorage not available');
    }
  },
};

function canTryNativeAsyncStorage(): boolean {
  return !isWebPlatform() && !!AsyncStorageLib;
}

function handleNativeError(error: unknown, op: string): void {
  if (!loggedNativeFallback) {
    loggedNativeFallback = true;
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(
      `[SafeAsyncStorage] Native AsyncStorage ${op} failed (${msg}). Using localStorage fallback only.`
    );
  }
}

const SafeAsyncStorage = {
  getItem: async (key: string): Promise<string | null> => {
    initializeNativeModule();
    if (canTryNativeAsyncStorage()) {
      try {
        const value = await AsyncStorageLib.getItem(key);
        if (value != null) {
          memoryStore.set(key, value);
          return value;
        }
      } catch (error: unknown) {
        handleNativeError(error, 'getItem');
      }
    }
    const fromLs = await localStorageFallback.getItem(key);
    if (fromLs != null) return fromLs;
    return memoryStore.has(key) ? memoryStore.get(key)! : null;
  },

  setItem: async (key: string, value: string): Promise<void> => {
    initializeNativeModule();
    memoryStore.set(key, value);
    if (canTryNativeAsyncStorage()) {
      try {
        await AsyncStorageLib.setItem(key, value);
        return;
      } catch (error: unknown) {
        handleNativeError(error, 'setItem');
      }
    }
    await localStorageFallback.setItem(key, value);
  },

  removeItem: async (key: string): Promise<void> => {
    initializeNativeModule();
    memoryStore.delete(key);
    if (canTryNativeAsyncStorage()) {
      try {
        await AsyncStorageLib.removeItem(key);
      } catch (error: unknown) {
        handleNativeError(error, 'removeItem');
      }
    }
    await localStorageFallback.removeItem(key);
  },

  getAllKeys: async (): Promise<string[]> => {
    initializeNativeModule();
    const keys = new Set<string>();
    if (canTryNativeAsyncStorage()) {
      try {
        const nativeKeys = await AsyncStorageLib.getAllKeys();
        if (Array.isArray(nativeKeys)) {
          nativeKeys.forEach((k: string) => keys.add(k));
        }
      } catch (error: unknown) {
        handleNativeError(error, 'getAllKeys');
      }
    }
    const webKeys = await localStorageFallback.getAllKeys();
    webKeys.forEach((k) => keys.add(k));
    memoryStore.forEach((_, k) => keys.add(k));
    return [...keys];
  },

  clear: async (): Promise<void> => {
    initializeNativeModule();
    memoryStore.clear();
    if (canTryNativeAsyncStorage()) {
      try {
        await AsyncStorageLib.clear();
      } catch (error: unknown) {
        handleNativeError(error, 'clear');
      }
    }
    await localStorageFallback.clear();
  },

  init: initializeNativeModule,
};

export default SafeAsyncStorage;
