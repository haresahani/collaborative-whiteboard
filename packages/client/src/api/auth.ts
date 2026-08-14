export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  isEmailVerified?: boolean;
}

export interface AuthResponse {
  token?: string;
  user?: UserProfile;
  requiresVerification?: boolean;
  email?: string;
  devCode?: string;
  message?: string;
}

const AUTH_TOKEN_KEY = "auth_token";
const AUTH_USER_KEY = "auth_user";

/**
 * Base URL for all API requests.
 * - Locally: empty string → relative paths → Vite dev-server proxy handles /api/*
 * - Production (Render): set VITE_API_URL to the full API service URL
 *   e.g. https://whiteboard-api-xxxx.onrender.com
 */
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function parseResponseJson(res: Response): Promise<Record<string, any>> {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { message: text || `HTTP Error ${res.status}: ${res.statusText}` };
  }
}

/**
 * Saves auth token in localStorage.
 */
export function setStoredToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

/**
 * Removes auth token from localStorage.
 */
export function removeStoredToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

/**
 * Retrieves stored auth token from localStorage without side-effects.
 */
export function getStoredToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

/**
 * Saves user profile in localStorage for instant offline/refresh UI initialization.
 */
export function setStoredUser(user: UserProfile | null): void {
  if (user) {
    try {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } catch {
      // ignore
    }
  } else {
    localStorage.removeItem(AUTH_USER_KEY);
  }
}

/**
 * Removes user profile from localStorage.
 */
export function removeStoredUser(): void {
  localStorage.removeItem(AUTH_USER_KEY);
}

/**
 * Retrieves stored user profile from localStorage.
 */
export function getStoredUser(): UserProfile | null {
  try {
    const saved = localStorage.getItem(AUTH_USER_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

/**
 * Authenticates user via email and password.
 */
export async function loginUser(credentials: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  const json = await parseResponseJson(res);

  if (res.status === 403 && json.data?.requiresVerification) {
    return {
      requiresVerification: true,
      email: json.data.email,
      devCode: json.data.devCode,
      message: json.message,
    };
  }

  if (!res.ok) {
    throw new Error(json.message || "Invalid email or password");
  }

  const data: AuthResponse = json.data;
  if (data?.token) {
    setStoredToken(data.token);
  }
  if (data?.user) {
    setStoredUser(data.user);
  }
  return data;
}

/**
 * Authenticates user via Google OAuth ID Token credential.
 */
export async function googleAuthApi(credential: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
  });

  const json = await parseResponseJson(res);

  if (!res.ok) {
    throw new Error(json.message || "Google authentication failed");
  }

  const data: AuthResponse = json.data;
  if (data?.token) {
    setStoredToken(data.token);
  }
  if (data?.user) {
    setStoredUser(data.user);
  }
  return data;
}

/**
 * Registers a new user account.
 */
export async function signupUser(data: {
  email: string;
  password: string;
  displayName: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const json = await parseResponseJson(res);

  if (!res.ok) {
    throw new Error(json.message || "Signup failed. Please try again.");
  }

  return json.data;
}

/**
 * Verifies email using 6-digit OTP verification code.
 */
export async function verifyEmailApi(payload: {
  email: string;
  code: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await parseResponseJson(res);

  if (!res.ok) {
    throw new Error(json.message || "Email verification failed");
  }

  const data: AuthResponse = json.data;
  if (data?.token) {
    setStoredToken(data.token);
  }
  if (data?.user) {
    setStoredUser(data.user);
  }
  return data;
}

/**
 * Requests a new verification code to be sent to email.
 */
export async function resendVerificationCodeApi(email: string): Promise<{ message: string; devCode?: string }> {
  const res = await fetch(`${API_BASE}/api/auth/resend-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const json = await parseResponseJson(res);

  if (!res.ok) {
    throw new Error(json.message || "Failed to resend verification code");
  }

  return json.data;
}

/**
 * Fetches current authenticated user profile using token.
 */
export async function fetchCurrentUser(): Promise<UserProfile> {
  const token = getStoredToken();
  if (!token) {
    throw new Error("No auth token found");
  }

  const res = await fetch(`${API_BASE}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401 || res.status === 404) {
    removeStoredToken();
    removeStoredUser();
    throw new Error("Session expired or invalid");
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch profile: ${res.statusText}`);
  }

  const json = await parseResponseJson(res);
  const data = json.data || {};
  const profile: UserProfile = {
    id: String(data.id || data._id || ""),
    email: String(data.email || ""),
    displayName: String(data.displayName || data.name || "User"),
    isEmailVerified: Boolean(data.isEmailVerified),
  };
  setStoredUser(profile);
  return profile;
}

/**
 * Logs out current user.
 */
export function logoutUser(): void {
  removeStoredToken();
  removeStoredUser();
}

/**
 * Retrieves primary user auth token.
 */
export function getAuthToken(): string | null {
  return getStoredToken();
}

/**
 * Fetches short-lived board-scoped token from REST API for Socket.IO connection handshake.
 */
export async function getBoardJoinToken(boardId: string, isRetry = false): Promise<string> {
  const authToken = getStoredToken();
  const headers: Record<string, string> = {};
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const res = await fetch(`${API_BASE}/api/boards/${boardId}/join-token`, { headers });

  if (res.status === 401 && !isRetry) {
    console.warn("[Auth] Token expired or invalid. Clearing localStorage and retrying...");
    removeStoredToken();
    return getBoardJoinToken(boardId, true);
  }

  if (!res.ok) {
    throw new Error(`Failed to retrieve board join token: ${res.statusText}`);
  }

  const json = await parseResponseJson(res);
  return json.data?.token || "";
}

/**
 * Fetches user-owned boards from REST API.
 */
export async function fetchMyBoardsApi(): Promise<Array<{ id: string; name: string; updatedAt: string; itemCount: number }>> {
  const token = getStoredToken();
  if (!token) return [];

  try {
    const res = await fetch(`${API_BASE}/api/boards`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) return [];

    const json = await parseResponseJson(res);
    const boards = json.data?.boards || json.data || [];
    if (!Array.isArray(boards)) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return boards.map((b: any) => ({
      id: String(b._id || b.id),
      name: String(b.title || b.name || "Untitled Whiteboard"),
      updatedAt: String(b.updatedAt || new Date().toISOString()),
      itemCount: Number(b.activeElementsCount || 0),
    }));
  } catch (err) {
    console.error("Failed to fetch my boards:", err);
    return [];
  }
}

/**
 * Deletes a board by ID from backend MongoDB database.
 */
export async function deleteBoardApi(boardId: string): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return true;

  try {
    const res = await fetch(`${API_BASE}/api/boards/${boardId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.ok;
  } catch (err) {
    console.error("Failed to delete board from backend database:", err);
    return false;
  }
}

/**
 * Updates board title in backend MongoDB database.
 */
export async function updateBoardTitleApi(boardId: string, title: string): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return true;

  try {
    const res = await fetch(`${API_BASE}/api/boards/${boardId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title }),
    });
    return res.ok;
  } catch (err) {
    console.error("Failed to update board title in backend database:", err);
    return false;
  }
}

/**
 * Creates a new board in backend MongoDB database.
 */
export async function createBoardApi(title: string): Promise<{ id: string; name: string; updatedAt: string; itemCount: number } | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE}/api/boards`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title }),
    });

    if (!res.ok) return null;

    const json = await parseResponseJson(res);
    const b = json.data;
    if (!b) return null;

    return {
      id: String(b._id || b.id),
      name: String(b.title || title),
      updatedAt: String(b.updatedAt || new Date().toISOString()),
      itemCount: 0,
    };
  } catch (err) {
    console.error("Failed to create board in database:", err);
    return null;
  }
}
