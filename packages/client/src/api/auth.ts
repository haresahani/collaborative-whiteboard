/**
 * Retrieves primary user auth token.
 * In development, if no token is in localStorage, auto-creates a guest account.
 * TODO: Replace with real UI login flow when auth screens are completed.
 */
export async function getAuthToken(): Promise<string> {
  let token = localStorage.getItem("auth_token");

  if (!token && process.env.NODE_ENV !== "production") {
    const randomId = Math.floor(Math.random() * 100000);
    const email = `guest_${randomId}@example.com`;
    const password = `guest_pass_${randomId}`;
    const displayName = `Guest ${randomId}`;

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, displayName }),
    });

    if (!res.ok) {
      throw new Error("Dev guest signup failed");
    }

    const data = await res.json();
    token = data.token;
    localStorage.setItem("auth_token", token!);
  }

  if (!token) {
    throw new Error("No authentication token available");
  }

  return token;
}

/**
 * Fetches short-lived board-scoped token from REST API for Socket.IO connection handshake.
 */
export async function getBoardJoinToken(boardId: string): Promise<string> {
  const authToken = await getAuthToken();

  const res = await fetch(`/api/boards/${boardId}/join-token`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to retrieve board join token: ${res.statusText}`);
  }

  const json = await res.json();
  return json.data.token;
}
