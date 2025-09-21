// src/contexts/AuthContext.tsx
import React, { createContext, useState, ReactNode, useEffect } from "react";
import { AuthResponse, LoginPayload, SignupPayload } from "@/types/auth";
import {
  loginUser as apiLoginUser,
  signupUser as apiSignupUser,
  refreshToken,
} from "@/api/auth";

export interface AuthContextType {
  user: AuthResponse["user"] | null;
  accessToken: string | null;
  loginUser: (payload: LoginPayload) => Promise<void>;
  signupUser: (payload: SignupPayload) => Promise<void>;
  logoutUser: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthResponse["user"] | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const loginUser = async (payload: LoginPayload) => {
    const res = await apiLoginUser(payload);
    setUser(res.user);
    setAccessToken(res.accessToken);
  };

  const signupUser = async (payload: SignupPayload) => {
    const res = await apiSignupUser(payload);
    setUser(res.user);
    setAccessToken(res.accessToken);
  };

  const logoutUser = () => {
    setUser(null);
    setAccessToken(null);
  };

  useEffect(() => {
    const refresh = async () => {
      try {
        const res = await refreshToken();
        setUser(res.user);
        setAccessToken(res.accessToken);
      } catch {
        setUser(null);
        setAccessToken(null);
      }
    };
    refresh();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, accessToken, loginUser, signupUser, logoutUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};
