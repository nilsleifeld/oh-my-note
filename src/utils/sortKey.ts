/** Fractional indexing for stable sibling ordering (lexicographic sort). */

const DIGITS = "0123456789abcdefghijklmnopqrstuvwxyz";
const BASE = DIGITS.length;
const MID = Math.floor(BASE / 2);

function digitIndex(char: string): number {
  const index = DIGITS.indexOf(char);
  if (index === -1) {
    throw new Error(`Invalid sortKey character: ${char}`);
  }
  return index;
}

function assertOrder(a: string | null, b: string | null): void {
  if (a !== null && b !== null && a >= b) {
    throw new Error(`sortKeyBetween: "${a}" must be less than "${b}"`);
  }
}

/** Returns a sort key strictly between `a` and `b` (null = unbounded). */
export function sortKeyBetween(a: string | null, b: string | null): string {
  assertOrder(a, b);

  if (a === null && b === null) {
    return "a0";
  }

  if (a === null) {
    return sortKeyBefore(b!);
  }

  if (b === null) {
    return sortKeyAfter(a);
  }

  let prefix = "";
  let index = 0;

  while (true) {
    const aDigit = index < a.length ? digitIndex(a[index]) : 0;
    const bDigit = index < b.length ? digitIndex(b[index]) : BASE - 1;

    if (bDigit - aDigit > 1) {
      const mid = Math.floor((aDigit + bDigit) / 2);
      return prefix + DIGITS[mid];
    }

    prefix += DIGITS[aDigit];
    index += 1;
  }
}

function sortKeyBefore(b: string): string {
  let prefix = "";
  let index = 0;

  while (index < b.length) {
    const bDigit = digitIndex(b[index]);
    if (bDigit > 0) {
      const mid = Math.floor(bDigit / 2);
      return prefix + DIGITS[mid];
    }
    prefix += DIGITS[0];
    index += 1;
  }

  return prefix + DIGITS[MID];
}

function sortKeyAfter(a: string): string {
  let prefix = "";
  let index = 0;

  while (index < a.length) {
    const aDigit = digitIndex(a[index]);
    if (aDigit < BASE - 1) {
      const mid = Math.ceil((aDigit + BASE) / 2);
      return prefix + DIGITS[mid];
    }
    prefix += DIGITS[BASE - 1];
    index += 1;
  }

  return a + DIGITS[MID];
}

/** Returns `count` evenly spaced keys between `a` and `b`. */
export function sortKeysBetween(
  a: string | null,
  b: string | null,
  count: number,
): string[] {
  if (count <= 0) return [];
  if (count === 1) return [sortKeyBetween(a, b)];

  const keys: string[] = [];
  let prev = a;

  for (let i = 0; i < count; i += 1) {
    const next = sortKeyBetween(prev, b);
    keys.push(next);
    prev = next;
  }

  return keys;
}

export function compareSortKeys(a: string, b: string): number {
  return a.localeCompare(b);
}

/** Assigns sequential sort keys to sibling groups (seed / migration). */
export function assignSortKeysToSiblings(
  blocks: Array<{ id: string; parentId: string | null; sortKey?: string }>,
  orderedChildIdsByParent: Map<string | null, string[]>,
): Map<string, string> {
  const result = new Map<string, string>();

  for (const [parentId, childIds] of orderedChildIdsByParent) {
    void parentId;
    const keys = sortKeysBetween(null, null, childIds.length);
    childIds.forEach((id, index) => {
      result.set(id, keys[index]);
    });
  }

  for (const block of blocks) {
    if (!result.has(block.id) && block.sortKey) {
      result.set(block.id, block.sortKey);
    }
  }

  return result;
}
