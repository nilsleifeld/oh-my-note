import { expect, type Locator, type Page } from "@playwright/test";
import {
  forceSeedMockBlocksScript,
  readMockBlocksScript,
  seedMockBlocksScript,
} from "../storageSeed";

/** Keeps today's section empty while the mock client starts non-empty. */
const SENTINEL_BLOCKS = [
  {
    id: "e2e-sentinel",
    type: "text" as const,
    parentId: null,
    day: "1999-01-01",
    createdAt: "1999-01-01T12:00:00.000Z",
    content: [],
    properties: {
      title: "sentinel",
      checked: false,
      language: "",
      imageData: "",
      open: true,
    },
  },
];

export type BlockType =
  | "text"
  | "bullet"
  | "todo"
  | "toggle"
  | "code"
  | "image"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5";

export type ViewMode = "notes" | "todos" | "todos-open" | "todos-done";

export type SeedBlock = {
  id: string;
  type: BlockType;
  parentId: string | null;
  day: string;
  createdAt: string;
  content: string[];
  properties: {
    title: string;
    checked: boolean;
    language: string;
    imageData: string;
    open: boolean;
  };
};

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function shiftDate(date: string, days: number) {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function gotoAppWithBlocks(page: Page, blocks: SeedBlock[]) {
  await page.addInitScript(forceSeedMockBlocksScript, blocks);

  await page.goto("/");
  await expect(todaySection(page)).toBeVisible();
  await expect(todaySection(page).locator(".day--loading")).toHaveCount(0);
}

export async function gotoApp(page: Page) {
  await page.addInitScript(seedMockBlocksScript, SENTINEL_BLOCKS);

  await page.goto("/");
  await expect(todaySection(page)).toBeVisible();
  await expect(todaySection(page).locator(".day--loading")).toHaveCount(0);
}

/** Reloads while preserving in-memory mock state via init script. */
export async function reloadApp(page: Page) {
  const blocks = await page.evaluate(readMockBlocksScript);
  await page.addInitScript(forceSeedMockBlocksScript, blocks);
  await page.reload();
  await expect(todaySection(page)).toBeVisible();
  await expect(todaySection(page).locator(".day--loading")).toHaveCount(0);
}

export function todaySection(page: Page): Locator {
  return daySection(page, todayISO());
}

export function daySection(page: Page, date: string): Locator {
  return page.locator(`section.day[data-date="${date}"]`);
}

/** Scrolls to a lazily loaded day and waits until its blocks are ready. */
export async function ensureDaySectionLoaded(page: Page, date: string) {
  await expect(daySection(page, date)).toBeAttached();

  await expect(async () => {
    await daySection(page, date).scrollIntoViewIfNeeded();
  }).toPass();

  const section = daySection(page, date);
  await expect(section.locator(`time[datetime="${date}"]`)).toBeVisible();
  await expect(section.locator(".day--loading")).toHaveCount(0);
  return section;
}

export function emptyDayHint(page: Page): Locator {
  return todaySection(page).getByRole("button", { name: "Block" });
}

export async function addBlock(page: Page, type: BlockType) {
  const count = await blocks(page).count();
  if (count === 0) {
    await emptyDayHint(page).click();
  } else {
    await pressInBlock(blocks(page).last(), "Enter");
  }

  const block = blocks(page).last();
  if (type !== "text") {
    await changeBlockType(block, type);
    await expect(block).toHaveClass(new RegExp(`block--${type}`));
    if (type === "code") {
      await expect(block.locator(".block__code-lang")).toBeVisible();
    }
  }
}

/** Root-level blocks only (excludes nested children). */
export function blocks(page: Page, type?: BlockType): Locator {
  return blocksInDay(todaySection(page), type);
}

export function blocksInDay(day: Locator, type?: BlockType): Locator {
  const root = ":scope > .day__inner > .day__blocks";
  if (type) return day.locator(`${root} > .block--${type}`);
  return day.locator(`${root} > .block:not(.block--placeholder)`);
}

export function blockInput(block: Locator): Locator {
  return block.locator("> .block__row .block__input").first();
}

export function blockImageTarget(block: Locator): Locator {
  return block
    .locator("> .block__row .block__input, > .block__row .block__image")
    .first();
}

export function blockImage(block: Locator): Locator {
  return block.locator("> .block__row .block__image-img");
}

/** 1×1 red PNG as data URL for paste tests. */
export const TEST_IMAGE_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

export const TEST_PNG_BUFFER = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

export async function pickImageInBlock(block: Locator) {
  await block.locator(".block__image-file-input").setInputFiles({
    name: "test.png",
    mimeType: "image/png",
    buffer: TEST_PNG_BUFFER,
  });
}

export async function pasteImageInBlock(
  block: Locator,
  dataUrl: string = TEST_IMAGE_DATA_URL,
) {
  const target = blockImageTarget(block);
  await target.click();
  await target.evaluate(async (el, url) => {
    const response = await fetch(url);
    const blob = await response.blob();
    const file = new File([blob], "test.png", { type: "image/png" });
    const dt = new DataTransfer();
    dt.items.add(file);
    el.dispatchEvent(
      new ClipboardEvent("paste", {
        clipboardData: dt,
        bubbles: true,
        cancelable: true,
      }),
    );
  }, dataUrl);
}

export async function getStoredBlock(page: Page, blockId: string) {
  const stored = (await page.evaluate(readMockBlocksScript)) as SeedBlock[];
  return stored.find((block) => block.id === blockId);
}

export async function hoverBlockRow(block: Locator) {
  await block.locator("> .block__row").hover();
}

export async function openTypeMenu(block: Locator) {
  await hoverBlockRow(block);
  await block.locator(".block__type-select .select__trigger").click();
}

export async function changeBlockType(block: Locator, type: BlockType) {
  const labels: Record<BlockType, string> = {
    h1: "Heading 1",
    h2: "Heading 2",
    h3: "Heading 3",
    h4: "Heading 4",
    h5: "Heading 5",
    text: "Text",
    bullet: "Bullet",
    todo: "To-do",
    toggle: "Toggle",
    code: "Code",
    image: "Image",
  };
  await openTypeMenu(block);
  const select = block.locator(".block__type-select");
  await expect(select).toHaveClass(/popover--open/);

  const search = select.locator(".select__search-input");
  await search.fill(labels[type]);
  const option = select
    .locator(".select__option")
    .filter({ hasText: labels[type] });
  await expect(option).toBeVisible();
  await option.click();
}

export async function fillBlock(block: Locator, text: string) {
  const input = blockInput(block);
  await input.click();
  await input.fill(text);
  await input.blur();
}

export function blockSlashMenu(block: Locator): Locator {
  return block.locator(".block-slash-menu");
}

export async function typeSlashInBlock(block: Locator, text: string) {
  const input = blockInput(block);
  await input.click();
  await input.pressSequentially(text);
}

export async function selectSlashOption(block: Locator, label: string) {
  const option = blockSlashMenu(block)
    .locator(".block-slash-menu__option")
    .filter({ hasText: label });
  await expect(option).toBeVisible();
  await option.click();
}

export async function confirmSlashSelection(block: Locator) {
  await blockInput(block).press("Enter");
}

export async function pressInBlock(block: Locator, key: string) {
  const target = blockImageTarget(block);
  await target.click();
  await target.press(key);
}

export async function typeInBlockAndPress(
  block: Locator,
  text: string,
  key: string,
) {
  const input = blockInput(block);
  await input.click();
  await input.fill(text);
  await input.press(key);
}

export async function selectCodeLanguage(block: Locator, label: string) {
  const select = block.locator(".block__code-lang");
  await blockInput(block).blur();
  await select.locator(".select__trigger").click();
  await expect(select).toHaveClass(/popover--open/);

  const search = select.locator(".select__search-input");
  await search.fill(label);
  const option = select.locator(".select__option").filter({ hasText: label });
  await expect(option).toBeVisible();
  await option.click();
  await expect(select).not.toHaveClass(/popover--open/);

  await expect(select.locator(".select__value")).toHaveText(label);
}

export async function simulateDragOver(source: Locator, target: Locator) {
  await dispatchDrag(source, target, false);
}

export async function simulateDragDrop(source: Locator, target: Locator) {
  await dispatchDrag(source, target, true);
}

async function dispatchDrag(source: Locator, target: Locator, drop: boolean) {
  const sourceId = await source.getAttribute("data-block-id");
  const targetId = await target.getAttribute("data-block-id");
  if (!sourceId || !targetId) throw new Error("Block IDs missing for drag");

  const page = source.page();

  await page.evaluate((id) => {
    const sourceEl = document.querySelector(`[data-block-id="${id}"]`);
    const handle = sourceEl?.querySelector(".block__handle");
    if (!sourceEl || !handle) return;

    const dt = new DataTransfer();
    handle.dispatchEvent(
      new DragEvent("dragstart", {
        bubbles: true,
        cancelable: true,
        dataTransfer: dt,
      }),
    );
  }, sourceId);

  await expect(source).toHaveClass(/block--dragging/);

  await page.evaluate(
    ({ sourceId, targetId }) => {
      const sourceEl = document.querySelector(`[data-block-id="${sourceId}"]`);
      const targetEl = document.querySelector(`[data-block-id="${targetId}"]`);
      const handle = sourceEl?.querySelector(".block__handle");
      if (!sourceEl || !targetEl || !handle) return;

      const dt = new DataTransfer();
      targetEl.dispatchEvent(
        new DragEvent("dragover", {
          bubbles: true,
          cancelable: true,
          dataTransfer: dt,
        }),
      );
    },
    { sourceId, targetId },
  );

  if (!drop) {
    await expect(target).toHaveClass(/block--over/);
    return;
  }

  await page.evaluate(
    ({ sourceId, targetId }) => {
      const sourceEl = document.querySelector(`[data-block-id="${sourceId}"]`);
      const targetEl = document.querySelector(`[data-block-id="${targetId}"]`);
      if (!sourceEl || !targetEl) return;

      const dt = new DataTransfer();
      targetEl.dispatchEvent(
        new DragEvent("drop", {
          bubbles: true,
          cancelable: true,
          dataTransfer: dt,
        }),
      );
      sourceEl
        .querySelector(".block__handle")
        ?.dispatchEvent(
          new DragEvent("dragend", { bubbles: true, cancelable: true }),
        );
    },
    { sourceId, targetId },
  );
}
export async function waitForBlockCount(
  page: Page,
  count: number,
  type?: BlockType,
) {
  await expect(blocks(page, type)).toHaveCount(count);
}

export function nestedBlocks(parent: Locator, type?: BlockType): Locator {
  if (type) return parent.locator(`> .block__children > .block--${type}`);
  return parent.locator("> .block__children > .block");
}

export function app(page: Page): Locator {
  return page.locator(".app");
}

export function todoFilter(page: Page): Locator {
  return page.locator(".app-header__todo-filter");
}

/** All to-do blocks in today's section, including nested ones. */
export function allTodos(page: Page): Locator {
  return todaySection(page).locator(".block--todo");
}

export async function selectViewMode(page: Page, mode: ViewMode) {
  switch (mode) {
    case "notes":
      await page.getByRole("button", { name: "Notes", exact: true }).click();
      break;
    case "todos":
      await page.getByRole("button", { name: "Todos", exact: true }).click();
      break;
    case "todos-open":
      await page.getByRole("button", { name: "Todos", exact: true }).click();
      await page.getByRole("button", { name: "Open", exact: true }).click();
      break;
    case "todos-done":
      await page.getByRole("button", { name: "Todos", exact: true }).click();
      await page.getByRole("button", { name: "Done", exact: true }).click();
      break;
  }
}

export async function expectBlockRowVisible(block: Locator, visible: boolean) {
  const row = block.locator("> .block__row");
  if (visible) {
    await expect(row).toBeVisible();
  } else {
    await expect(row).toBeHidden();
  }
}

export function navSelectedBlock(page: Page): Locator {
  return page.locator(".block--nav-selected");
}

/** Clicks outside block inputs so vim navigation keys are handled globally. */
export async function focusBlockNavigation(page: Page) {
  await todaySection(page).locator(".day__header").click();
}

export async function pressVimRedoKey(page: Page) {
  await page.keyboard.press("Control+r");
}

export async function pressVimNavKey(
  page: Page,
  key:
    | "j"
    | "k"
    | "i"
    | "a"
    | "0"
    | "d"
    | "g"
    | "G"
    | "y"
    | "p"
    | "o"
    | "O"
    | "u"
    | "Tab"
    | " "
    | "Escape",
) {
  await page.keyboard.press(key);
}
