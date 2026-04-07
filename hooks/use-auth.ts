import { auth } from '@/utils/auth';
import { useEffect, useState } from 'react';

export const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const loggedIn = await auth.isLoggedIn();
        setIsLoggedIn(loggedIn);
      } catch (error) {
        console.error('Failed to check auth', error);
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  return { isLoggedIn, isLoading };
};
