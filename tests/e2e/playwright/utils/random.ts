export function randomString(length = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function randomEmail(): string {
  return `e2e_user_${randomString(6)}@example.com`;
}

export function randomBoardName(): string {
  return `E2E Board ${randomString(5).toUpperCase()}`;
}
