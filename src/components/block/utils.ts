export function resizeTextarea(el: HTMLTextAreaElement): void {
  el.style.overflow = "hidden";
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

export function focusInput(
  el: HTMLElement,
  shouldFocus: boolean,
  onFocused: () => void,
): void {
  if (!shouldFocus) return;
  requestAnimationFrame(() => {
    el.focus();
    onFocused();
  });
}

export function onTabIndentOutdent(
  e: React.KeyboardEvent,
  onIndent: () => void,
  onOutdent: () => void,
): void {
  if (e.key !== "Tab") return;
  e.preventDefault();
  if (e.shiftKey) onOutdent();
  else onIndent();
}
