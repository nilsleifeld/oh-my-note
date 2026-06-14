import type { SelectOption } from "../types/ui";

export function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function filterOptions(
  options: readonly SelectOption[],
  query: string,
): SelectOption[] {
  const needle = normalize(query);
  if (!needle) return [...options];
  return options.filter(
    (option) =>
      normalize(option.label).includes(needle) ||
      normalize(option.value).includes(needle),
  );
}
