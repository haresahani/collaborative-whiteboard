// src/lib/utils.ts

/**
 * Generate a random UUID
 * Used for creating board IDs, element IDs, etc.
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Utility to merge class names safely
 * Useful for Tailwind class composition
 */
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
