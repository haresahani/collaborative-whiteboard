// packages/client/src/api/auth.ts
import { API_URL } from "@/config/constants";
import type { LoginPayload, SignupPayload, AuthResponse } from "@/types/auth";

/**
 * LOGIN
 */
export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Login failed");
  }

  return res.json();
}

/**
 * SIGNUP
 */
export async function signupUser(payload: SignupPayload): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Signup failed");
  }

  return res.json();
}

/**
 * LOGOUT
 */
export async function logout(): Promise<void> {
  const res = await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include", // if cookies are used
  });

  if (!res.ok) {
    throw new Error("Logout failed");
  }
}

/**
 * REFRESH TOKEN
 */
export async function refreshToken(): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to refresh token");
  }

  return res.json();
}
