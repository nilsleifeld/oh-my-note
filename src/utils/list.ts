export function uniqueIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    result.push(id);
  }
  return result;
}

export function insertAtIndex(
  list: string[],
  id: string,
  index: number,
): string[] {
  const without = list.filter((item) => item !== id);
  const insertAt = Math.max(0, Math.min(index, without.length));
  without.splice(insertAt, 0, id);
  return without;
}

export function moveInList(
  list: string[],
  fromId: string,
  toId: string,
): string[] {
  const content = [...list];
  const from = content.indexOf(fromId);
  const to = content.indexOf(toId);
  if (from === -1 || to === -1 || from === to) return list;
  content.splice(from, 1);
  content.splice(to, 0, fromId);
  return content;
}
