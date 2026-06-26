import type { ReactNode } from "react";

export function highlightMatches(
  text: string,
  indices: readonly [number, number][],
): ReactNode {
  if (!indices.length) return text;

  const sorted = [...indices].sort((a, b) => a[0] - b[0]);
  const parts: ReactNode[] = [];
  let cursor = 0;

  for (const [start, end] of sorted) {
    if (start > cursor) {
      parts.push(text.slice(cursor, start));
    }
    parts.push(
      <mark key={`${start}-${end}`} className="search-modal__mark">
        {text.slice(start, end + 1)}
      </mark>,
    );
    cursor = end + 1;
  }

  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }

  return parts;
}
