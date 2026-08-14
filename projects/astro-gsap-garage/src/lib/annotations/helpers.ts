/**
 * Shared annotation helper functions.
 * Single source — not duplicated per theme.
 */

export function lookAttr(look: number[]): string {
  return look.join(",");
}

export function hotspotAttr(a: { id: unknown; label?: string }): string | null {
  if (a.id == null || typeof a.id !== "number") return null;
  return `${a.id}|${a.label || `Part ${a.id}`}`;
}

export function explodeAttr(a: { explode?: number | null }): string | null {
  if (a.explode == null) return null;
  return String(a.explode);
}

export function noteAttr(a: { title?: string | null; body?: string | null }): string | null {
  if (!a.title) return null;
  return `${a.title}|${a.body || ""}`;
}
