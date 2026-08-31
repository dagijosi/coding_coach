// ---------------------------------------------------------------------------
// GitHub UI formatting helpers (Phase 8).
// ---------------------------------------------------------------------------

/** "5m ago", "2h ago", "3d ago" or a date for human-friendly times. */
export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const when = new Date(iso).getTime();
  if (Number.isNaN(when)) return '';
  const diffMs = Date.now() - when;
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

/** e.g. "Last synced 3m ago" or "Never synced". */
export function lastSyncedText(iso: string | null | undefined): string {
  if (!iso) return 'Never synced';
  return `Last synced ${relativeTime(iso)}`;
}

/** Compact number: 1200 -> "1.2k". */
export function compactCount(n: number): string {
  if (n >= 1000) {
    const v = (n / 1000).toFixed(1).replace(/\.0$/, '');
    return `${v}k`;
  }
  return String(n);
}

/** Extracts "<repo>/<name>" from a full repo id without mutating data. */
export function repoName(fullName: string): string {
  const idx = fullName.lastIndexOf('/');
  return idx === -1 ? fullName : fullName.slice(idx + 1);
}
