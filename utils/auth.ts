import { credentialStorage } from './credentialStorage';
import SafeAsyncStorage from './asyncStorageWrapper';

export interface User {
  username: string;
  name: string;
  password: string; // Stored as hash only
}

const SESSION_USERNAME_KEY = 'currentUser';

/** In-memory fallback when secure storage read fails but the user is still in-session. */
let sessionUsernameCache: string | null = null;

const userRecordKey = (username: string) => `user_${username}`;

// Simple hash for passwords (replace with server-side bcrypt in production)
const hashPassword = (password: string): string => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString();
};

async function getSessionUsername(): Promise<string | null> {
  try {
    let username = await credentialStorage.getItem(SESSION_USERNAME_KEY);
    if (!username) {
      username = await SafeAsyncStorage.getItem(SESSION_USERNAME_KEY);
      if (username) {
        await credentialStorage.setItem(SESSION_USERNAME_KEY, username);
        await SafeAsyncStorage.removeItem(SESSION_USERNAME_KEY);
      }
    }
    if (username) {
      sessionUsernameCache = username;
      return username;
    }
  } catch {
    // fall through to cache
  }
  return sessionUsernameCache;
}

async function setSessionUsername(username: string): Promise<void> {
  sessionUsernameCache = username;
  await credentialStorage.setItem(SESSION_USERNAME_KEY, username);
  await SafeAsyncStorage.removeItem(SESSION_USERNAME_KEY);
}

async function clearSessionUsername(): Promise<void> {
  sessionUsernameCache = null;
  await credentialStorage.removeItem(SESSION_USERNAME_KEY);
  await SafeAsyncStorage.removeItem(SESSION_USERNAME_KEY);
}

async function readUserRecord(username: string): Promise<User | null> {
  const key = userRecordKey(username);
  let raw = await credentialStorage.getItem(key);
  if (!raw) {
    raw = await SafeAsyncStorage.getItem(key);
    if (raw) {
      await credentialStorage.setItem(key, raw);
      await SafeAsyncStorage.removeItem(key);
    }
  }
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

async function writeUserRecord(user: User): Promise<void> {
  const key = userRecordKey(user.username);
  await credentialStorage.setItem(key, JSON.stringify(user));
  await SafeAsyncStorage.removeItem(key);
}

export const auth = {
  async initializeDemoAccount(): Promise<void> {
    try {
      try {
        const initialized = await SafeAsyncStorage.getItem('demo_initialized');
        if (!initialized) {
          const demoUser = await readUserRecord('demo');
          if (!demoUser) {
            const user: User = {
              username: 'demo',
              name: 'Demo User',
              password: hashPassword('demo123'),
            };
            await writeUserRecord(user);
          }
          await SafeAsyncStorage.setItem('demo_initialized', 'true');
        }
      } catch (storageError) {
        console.warn('Demo account storage error (will use fallback):', storageError);
      }
    } catch (error) {
      console.error('Failed to initialize demo account', error);
    }
  },

  async createAccount(
    username: string,
    password: string,
    name: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!username || !password || !name) {
        return { success: false, error: 'All fields are required' };
      }
      if (username.length < 3) {
        return { success: false, error: 'Username must be at least 3 characters' };
      }
      if (password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters' };
      }

      const existing = await readUserRecord(username);
      if (existing) {
        return { success: false, error: 'Username already exists' };
      }

      const hashedPassword = hashPassword(password);
      const user: User = {
        username,
        password: hashedPassword,
        name,
      };

      await writeUserRecord(user);
      await setSessionUsername(username);

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to create account' };
    }
  },

  async login(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await readUserRecord(username);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const hashedPassword = hashPassword(password);
      if (user.password !== hashedPassword) {
        return { success: false, error: 'Incorrect password' };
      }

      await setSessionUsername(username);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Login failed' };
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const username = await getSessionUsername();
      if (!username) return null;
      return await readUserRecord(username);
    } catch (error) {
      return null;
    }
  },

  /** Session username only — use for scoping data when the full user record might not be readable yet. */
  async getLoggedInUsername(): Promise<string | null> {
    try {
      return await getSessionUsername();
    } catch {
      return null;
    }
  },

  async logout(): Promise<void> {
    try {
      await clearSessionUsername();
    } catch (error) {
      console.error('Logout failed', error);
    }
  },

  async isLoggedIn(): Promise<boolean> {
    try {
      const username = await getSessionUsername();
      return !!username;
    } catch (error) {
      return false;
    }
  },
};
