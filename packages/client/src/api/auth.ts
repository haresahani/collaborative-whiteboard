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
 * Authenticates user via email and password.
 */
export async function loginUser(credentials: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await fetch("/api/auth/login", {
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
  return data;
}

/**
 * Authenticates user via Google OAuth ID Token credential.
 */
export async function googleAuthApi(credential: string): Promise<AuthResponse> {
  const res = await fetch("/api/auth/google", {
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
  const res = await fetch("/api/auth/signup", {
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
  const res = await fetch("/api/auth/verify-email", {
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
  return data;
}

/**
 * Requests a new verification code to be sent to email.
 */
export async function resendVerificationCodeApi(email: string): Promise<{ message: string; devCode?: string }> {
  const res = await fetch("/api/auth/resend-code", {
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

  const res = await fetch("/api/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401 || res.status === 404) {
    removeStoredToken();
    throw new Error("Session expired or invalid");
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch profile: ${res.statusText}`);
  }

  const json = await parseResponseJson(res);
  const data = json.data || {};
  return {
    id: String(data.id || data._id || ""),
    email: String(data.email || ""),
    displayName: String(data.displayName || data.name || "User"),
    isEmailVerified: Boolean(data.isEmailVerified),
  };
}

/**
 * Logs out current user.
 */
export function logoutUser(): void {
  removeStoredToken();
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

  const res = await fetch(`/api/boards/${boardId}/join-token`, { headers });

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
    const res = await fetch("/api/boards", {
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
    const res = await fetch(`/api/boards/${boardId}`, {
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
    const res = await fetch(`/api/boards/${boardId}`, {
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
