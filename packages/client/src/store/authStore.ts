import { create } from "zustand";
import {
  fetchCurrentUser,
  loginUser,
  googleAuthApi,
  logoutUser,
  signupUser,
  verifyEmailApi,
  resendVerificationCodeApi,
  type UserProfile,
} from "../api/auth";

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  pendingVerificationEmail: string | null;
  latestDevCode: string | null;

  // Actions
  initAuth: () => Promise<void>;
  login: (credentials: { email: string; password: string }) => Promise<{ requiresVerification?: boolean }>;
  loginWithGoogle: (credential: string) => Promise<void>;
  signup: (data: {
    email: string;
    password: string;
    displayName: string;
  }) => Promise<void>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendCode: (email: string) => Promise<void>;
  setPendingEmail: (email: string | null) => void;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  pendingVerificationEmail: null,
  latestDevCode: null,

  initAuth: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = await fetchCurrentUser();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const res = await loginUser(credentials);
      if (res.requiresVerification && res.email) {
        set({
          pendingVerificationEmail: res.email,
          latestDevCode: res.devCode || null,
          isLoading: false,
          error: null,
        });
        return { requiresVerification: true };
      }

      if (res.user && res.token) {
        set({
          user: res.user,
          isAuthenticated: true,
          isLoading: false,
          pendingVerificationEmail: null,
          error: null,
        });
      }
      return {};
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Login failed. Check credentials.";
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  loginWithGoogle: async (credential: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await googleAuthApi(credential);
      if (res.user && res.token) {
        set({
          user: res.user,
          isAuthenticated: true,
          isLoading: false,
          pendingVerificationEmail: null,
          error: null,
        });
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Google Sign-In failed.";
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  signup: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await signupUser(data);
      set({
        pendingVerificationEmail: data.email,
        latestDevCode: res.devCode || null,
        isLoading: false,
        error: null,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Signup failed. Try again.";
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  verifyEmail: async (email, code) => {
    set({ isLoading: true, error: null });
    try {
      const res = await verifyEmailApi({ email, code });
      set({
        user: res.user || null,
        isAuthenticated: true,
        isLoading: false,
        pendingVerificationEmail: null,
        latestDevCode: null,
        error: null,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Verification failed. Check the code.";
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  resendCode: async (email) => {
    set({ error: null });
    try {
      const res = await resendVerificationCodeApi(email);
      set({ latestDevCode: res.devCode || get().latestDevCode });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to resend code.";
      set({ error: message });
      throw err;
    }
  },

  setPendingEmail: (email) => set({ pendingVerificationEmail: email }),

  logout: () => {
    logoutUser();
    set({
      user: null,
      isAuthenticated: false,
      pendingVerificationEmail: null,
      latestDevCode: null,
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));
