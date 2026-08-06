export function randomString(length = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let res = "";
  for (let i = 0; i < length; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

export function randomEmail(): string {
  return `k6_vu_${randomString(6)}@example.com`;
}

export function randomBoardTitle(): string {
  return `k6 Board ${randomString(4).toUpperCase()}`;
}

export function randomCoord(max = 1000): number {
  return Math.floor(Math.random() * max);
}
