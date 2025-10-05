// packages/client/src/hooks/useAuth.ts
import { useState, useCallback } from "react";
import { loginUser, signupUser, logout } from "@/api/auth";
import type {
  LoginPayload,
  SignupPayload,
  User,
  AuthResponse,
} from "@/types/auth";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: false,
    isAuthenticated: false,
    error: null,
  });

  const signIn = useCallback(async (data: LoginPayload) => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const res: AuthResponse = await loginUser(data);
      setAuthState({
        user: res.user,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      });
      return { user: res.user };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      return { error: { message } };
    }
  }, []);

  const signUp = useCallback(async (data: SignupPayload) => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const res: AuthResponse = await signupUser(data);
      setAuthState({
        user: res.user,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      });
      return { user: res.user };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Signup failed";
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      return { error: { message } };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await logout();
    } catch {
      // ignore errors
    }
    setAuthState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
    });
  }, []);

  return { ...authState, signIn, signUp, signOut };
}
