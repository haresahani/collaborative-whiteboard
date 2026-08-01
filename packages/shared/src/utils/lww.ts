export interface GroupClock {
  lamport: number;
  clientId: string;
}

export interface ILastUpdateState {
  transform?: GroupClock;
  style?: GroupClock;
}

export type FieldGroup = "transform" | "style";

const TRANSFORM_FIELDS = new Set([
  "x",
  "y",
  "width",
  "height",
  "rotation",
  "x1",
  "y1",
  "x2",
  "y2",
  "points",
]);

const STYLE_FIELDS = new Set([
  "style",
  "color",
  "strokeColor",
  "fillColor",
  "strokeWidth",
  "lineStyle",
  "fontFamily",
  "fontSize",
]);

/**
 * Compares two (lamport, clientId) tuples.
 * Returns > 0 if `a` is strictly newer/wins, < 0 if `b` is newer/wins, 0 if identical.
 */
export function compareLamportClientId(a: GroupClock, b: GroupClock): number {
  if (a.lamport !== b.lamport) {
    return a.lamport - b.lamport;
  }
  return a.clientId.localeCompare(b.clientId);
}

/**
 * Determines which field groups ('transform' and/or 'style') are touched by an update object.
 */
export function getTouchedFieldGroups(
  updates: Record<string, unknown>,
): Set<FieldGroup> {
  const groups = new Set<FieldGroup>();

  for (const key of Object.keys(updates)) {
    if (TRANSFORM_FIELDS.has(key)) {
      groups.add("transform");
    } else if (STYLE_FIELDS.has(key)) {
      groups.add("style");
    }
  }

  // Fallback: if unknown keys are passed, treat as style group
  if (groups.size === 0 && Object.keys(updates).length > 0) {
    groups.add("style");
  }

  return groups;
}

/**
 * Filter an update dictionary to only contain fields belonging to a specific field group.
 */
export function filterUpdatesForGroup(
  updates: Record<string, unknown>,
  group: FieldGroup,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(updates)) {
    if (group === "transform" && TRANSFORM_FIELDS.has(key)) {
      result[key] = value;
    } else if (group === "style" && STYLE_FIELDS.has(key)) {
      result[key] = value;
    } else if (
      group === "style" &&
      !TRANSFORM_FIELDS.has(key) &&
      !STYLE_FIELDS.has(key)
    ) {
      result[key] = value;
    }
  }

  return result;
}
