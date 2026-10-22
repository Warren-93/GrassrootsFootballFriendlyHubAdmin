/** A stored timestamp as local date and time, or a dash when there isn't one. */
export function dateTime(value: string | null | undefined): string {
  if (!value) return '-';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleString();
}

/** How long ago, roughly: "just now", "5 min ago", "3 h ago", "12 days ago", or the date past ~2 months. */
export function ago(value: string | null | undefined, now: Date = new Date()): string {
  if (!value) return 'never';
  const then = new Date(value);
  if (Number.isNaN(then.getTime())) return 'never';
  const minutes = Math.round((now.getTime() - then.getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 60) return `${days} day${days === 1 ? '' : 's'} ago`;
  return then.toLocaleDateString();
}

/** CLUB_ADMIN -> "Club admin". */
export function roleLabel(role: string): string {
  const words = role.toLowerCase().replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}
