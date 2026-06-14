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

export function createdAtAfter(
  date: string,
  after?: string,
  before?: string,
): string {
  if (after && before) {
    const mid = (new Date(after).getTime() + new Date(before).getTime()) / 2;
    return new Date(mid).toISOString();
  }
  if (after) {
    return new Date(new Date(after).getTime() + 1).toISOString();
  }
  if (before) {
    return new Date(new Date(before).getTime() - 1).toISOString();
  }
  return `${date}T12:00:00.000Z`;
}
