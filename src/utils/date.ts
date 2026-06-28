export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function blockDate(createdAt: string): string {
  return createdAt.slice(0, 10);
}

export function formatDayTitle(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDayShort(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function isFutureDate(
  date: string,
  referenceDate = todayISO(),
): boolean {
  return date > referenceDate;
}

export function rescheduleDateFromShortcut(
  shortcut: number,
  referenceDate = todayISO(),
): string {
  return shiftDate(referenceDate, shortcut);
}

export function formatCommentRelative(iso: string, now = Date.now()): string {
  const then = new Date(iso).getTime();
  const diffMs = Math.max(0, now - then);
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;

  return formatCommentDate(iso);
}

export function formatCommentDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
