import SafeAsyncStorage from './asyncStorageWrapper';

export interface User {
  username: string;
  name: string;
  password: string; // This will be hashed in production; for MVP stored securely
}

// Simple hash function for passwords (NOT for production - use proper bcrypt)
const hashPassword = (password: string): string => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString();
};

export const auth = {
  // Initialize demo account on first run
  async initializeDemoAccount(): Promise<void> {
    try {
      const initialized = await SafeAsyncStorage.getItem('demo_initialized');
      if (!initialized) {
        const existingUser = await SafeAsyncStorage.getItem('user_demo');
        if (!existingUser) {
          const user: User = {
            username: 'demo',
            name: 'Demo User',
            password: hashPassword('demo123'),
          };
          await SafeAsyncStorage.setItem('user_demo', JSON.stringify(user));
        }
        await SafeAsyncStorage.setItem('demo_initialized', 'true');
      }
    } catch (error) {
      console.error('Failed to initialize demo account', error);
    }
  },

  // Create new account
  async createAccount(username: string, password: string, name: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate inputs
      if (!username || !password || !name) {
        return { success: false, error: 'All fields are required' };
      }
      if (username.length < 3) {
        return { success: false, error: 'Username must be at least 3 characters' };
      }
      if (password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters' };
      }

      // Check if user already exists
      const existingUser = await SafeAsyncStorage.getItem(`user_${username}`);
      if (existingUser) {
        return { success: false, error: 'Username already exists' };
      }

      // Hash password
      const hashedPassword = hashPassword(password);

      // Store user
      const user: User = {
        username,
        password: hashedPassword,
        name,
      };

      await SafeAsyncStorage.setItem(`user_${username}`, JSON.stringify(user));
      await SafeAsyncStorage.setItem('currentUser', username);

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to create account' };
    }
  },

  // Login
  async login(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const userStr = await SafeAsyncStorage.getItem(`user_${username}`);
      if (!userStr) {
        return { success: false, error: 'User not found' };
      }

      const user: User = JSON.parse(userStr);
      const hashedPassword = hashPassword(password);

      if (user.password !== hashedPassword) {
        return { success: false, error: 'Incorrect password' };
      }

      await SafeAsyncStorage.setItem('currentUser', username);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Login failed' };
    }
  },

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    try {
      const username = await SafeAsyncStorage.getItem('currentUser');
      if (!username) return null;

      const userStr = await SafeAsyncStorage.getItem(`user_${username}`);
      if (!userStr) return null;

      return JSON.parse(userStr);
    } catch (error) {
      return null;
    }
  },

  // Logout
  async logout(): Promise<void> {
    try {
      await SafeAsyncStorage.removeItem('currentUser');
    } catch (error) {
      console.error('Logout failed', error);
    }
  },

  // Check if user is logged in
  async isLoggedIn(): Promise<boolean> {
    try {
      const username = await SafeAsyncStorage.getItem('currentUser');
      return !!username;
    } catch (error) {
      return false;
    }
  },
};
