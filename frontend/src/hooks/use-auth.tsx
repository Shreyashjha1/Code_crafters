import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { api } from "@/lib/api";
import type { AuthUser } from "@/types/api";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  refreshSession: () => Promise<AuthUser | null>;
  setUser: (user: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setUser = useCallback((nextUser: AuthUser | null) => {
    startTransition(() => {
      setUserState(nextUser);
    });
  }, []);

  const refreshSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const session = await api.getSession();
      setUser(session.user);
      return session.user;
    } catch {
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    function handleAuthRequired() {
      setUser(null);
      setIsLoading(false);
    }

    window.addEventListener("resume-ai:auth-required", handleAuthRequired);
    return () => {
      window.removeEventListener("resume-ai:auth-required", handleAuthRequired);
    };
  }, [setUser]);

  const value = useMemo(
    () => ({ user, isLoading, refreshSession, setUser }),
    [user, isLoading, refreshSession, setUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
