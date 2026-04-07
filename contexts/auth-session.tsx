import { createContext, useContext, type ReactNode } from 'react';

type AuthSessionContextValue = {
  signOut: () => Promise<void>;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({
  children,
  signOut,
}: {
  children: ReactNode;
  signOut: () => Promise<void>;
}) {
  return (
    <AuthSessionContext.Provider value={{ signOut }}>{children}</AuthSessionContext.Provider>
  );
}

export function useAuthSession() {
  const ctx = useContext(AuthSessionContext);
  if (!ctx) {
    throw new Error('useAuthSession must be used within AuthSessionProvider');
  }
  return ctx;
}
