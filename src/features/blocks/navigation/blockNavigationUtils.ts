const NAVIGABLE_BLOCK_SELECTOR =
  ".feed [data-block-id]:not(.block--loading):not(.block--placeholder)";

export function isTextEntryTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;

  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") {
    return !target.classList.contains("block__input");
  }

  return false;
}

export function isBlockEditTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.classList.contains("block__input")) return true;
  if (target.classList.contains("block__image")) return true;
  return false;
}

function isBlockRowVisible(block: Element): boolean {
  const row = block.querySelector(":scope > .block__line > .block__row");
  if (!row) return false;

  const style = getComputedStyle(row);
  if (style.display === "none" || style.visibility === "hidden") return false;
  if (parseFloat(style.opacity) === 0) return false;
  if (parseFloat(style.maxHeight) === 0) return false;

  return true;
}

export function getNavigableBlocks(): HTMLElement[] {
  return Array.from(document.querySelectorAll(NAVIGABLE_BLOCK_SELECTOR)).filter(
    (block): block is HTMLElement =>
      block instanceof HTMLElement && isBlockRowVisible(block),
  );
}

export function getBlockIdFromElement(el: Element | null): string | null {
  return el?.closest("[data-block-id]")?.getAttribute("data-block-id") ?? null;
}

export function getBlockEditTarget(blockId: string): HTMLElement | null {
  const block = document.querySelector(`[data-block-id="${blockId}"]`);
  if (!block) return null;

  const input = block.querySelector(".block__input");
  if (input instanceof HTMLElement) return input;

  const image = block.querySelector(".block__image");
  if (image instanceof HTMLElement) return image;

  return null;
}

export function focusBlockEditTarget(
  blockId: string,
  position: "start" | "end" = "end",
): void {
  const target = getBlockEditTarget(blockId);
  if (!target) return;

  target.focus();
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement
  ) {
    const offset = position === "start" ? 0 : target.value.length;
    target.setSelectionRange(offset, offset);
  }
}

export function moveBlockSelection(
  currentId: string | null,
  direction: 1 | -1,
): string | null {
  const blocks = getNavigableBlocks();
  if (!blocks.length) return null;

  if (!currentId) {
    return direction === 1
      ? (blocks[0]?.getAttribute("data-block-id") ?? null)
      : (blocks.at(-1)?.getAttribute("data-block-id") ?? null);
  }

  const index = blocks.findIndex(
    (block) => block.getAttribute("data-block-id") === currentId,
  );
  if (index === -1) {
    return direction === 1
      ? (blocks[0]?.getAttribute("data-block-id") ?? null)
      : (blocks.at(-1)?.getAttribute("data-block-id") ?? null);
  }

  const next = blocks[index + direction];
  return next?.getAttribute("data-block-id") ?? currentId;
}

export function getBlockBelow(blockId: string): string | null {
  const blocks = getNavigableBlocks();
  const index = blocks.findIndex(
    (block) => block.getAttribute("data-block-id") === blockId,
  );
  if (index === -1) return null;
  if (index < blocks.length - 1) {
    return blocks[index + 1]?.getAttribute("data-block-id") ?? null;
  }
  return blocks[index - 1]?.getAttribute("data-block-id") ?? null;
}

export function getBlockAbove(blockId: string): string | null {
  const blocks = getNavigableBlocks();
  const index = blocks.findIndex(
    (block) => block.getAttribute("data-block-id") === blockId,
  );
  if (index === -1) return null;
  if (index > 0) {
    return blocks[index - 1]?.getAttribute("data-block-id") ?? null;
  }
  return blocks[index + 1]?.getAttribute("data-block-id") ?? null;
}

export function scrollBlockIntoView(blockId: string): void {
  const block = document.querySelector(`[data-block-id="${blockId}"]`);
  block?.scrollIntoView({ block: "nearest" });
}

export function getFirstNavigableBlockId(): string | null {
  return getNavigableBlocks()[0]?.getAttribute("data-block-id") ?? null;
}

export function getLastNavigableBlockId(): string | null {
  return getNavigableBlocks().at(-1)?.getAttribute("data-block-id") ?? null;
}
