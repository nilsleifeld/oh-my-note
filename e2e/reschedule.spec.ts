import { expect, test } from "@playwright/test";
import { readMockBlocksScript } from "./storageSeed";
import {
  blocks,
  blocksInDay,
  blockInput,
  daySection,
  ensureDaySectionLoaded,
  expectRescheduleClosed,
  focusBlockNavigation,
  gotoAppWithBlocks,
  navSelectedBlock,
  pressVimNavKey,
  rescheduleDateInput,
  rescheduleModal,
  confirmReschedule,
  confirmRescheduleWithShortcut,
  focusRescheduleModal,
  openRescheduleWithShortcut,
  shiftDate,
  todayISO,
} from "./fixtures/app";

const seedTextBlock = (
  id: string,
  title: string,
  day: string,
  createdAt: string,
  parentId: string | null = null,
) => ({
  id,
  type: "text" as const,
  parentId,
  day,
  createdAt,
  properties: {
    title,
    checked: false,
    language: "",
    imageData: "",
    open: true,
  },
});

test.describe("Wiedervorlage", () => {
  test("öffnet den Dialog mit w bei ausgewähltem Block", async ({ page }) => {
    const today = todayISO();
    await gotoAppWithBlocks(page, [
      seedTextBlock("res-a", "Alpha", today, `${today}T10:00:00.000Z`),
    ]);

    await focusBlockNavigation(page);
    await pressVimNavKey(page, "k");
    await expect(navSelectedBlock(page)).toHaveAttribute(
      "data-block-id",
      "res-a",
    );

    await openRescheduleWithShortcut(page);
    await expect(rescheduleModal(page)).toBeVisible();
    await expect(rescheduleModal(page).getByRole("heading")).toHaveText(
      "Wiedervorlage",
    );
    await expect(rescheduleDateInput(page)).toHaveValue(shiftDate(today, 1));
  });

  test("öffnet den Dialog nicht im Block-Input", async ({ page }) => {
    const today = todayISO();
    await gotoAppWithBlocks(page, [
      seedTextBlock("res-input", "Alpha", today, `${today}T10:00:00.000Z`),
    ]);

    const block = page.locator('[data-block-id="res-input"]');
    await blockInput(block).click();
    await page.keyboard.press("w");
    await expectRescheduleClosed(page);
  });

  test("setzt mit Zahl 1 das Datum auf morgen", async ({ page }) => {
    const today = todayISO();
    await gotoAppWithBlocks(page, [
      seedTextBlock("res-1", "Alpha", today, `${today}T10:00:00.000Z`),
    ]);

    await focusBlockNavigation(page);
    await pressVimNavKey(page, "k");
    await openRescheduleWithShortcut(page);

    await rescheduleDateInput(page).fill("");
    await focusRescheduleModal(page);
    await page.keyboard.press("1");
    await expect(rescheduleDateInput(page)).toHaveValue(shiftDate(today, 1));
  });

  test("setzt mit Zahl 3 das Datum auf heute + 3 Tage", async ({ page }) => {
    const today = todayISO();
    await gotoAppWithBlocks(page, [
      seedTextBlock("res-3", "Alpha", today, `${today}T10:00:00.000Z`),
    ]);

    await focusBlockNavigation(page);
    await pressVimNavKey(page, "k");
    await openRescheduleWithShortcut(page);

    await focusRescheduleModal(page);
    await page.keyboard.press("3");
    await expect(rescheduleDateInput(page)).toHaveValue(shiftDate(today, 3));
  });

  test("verschiebt Block mit Setzen auf den Wiedervorlage-Tag", async ({
    page,
  }) => {
    const today = todayISO();
    const targetDay = shiftDate(today, 2);

    await gotoAppWithBlocks(page, [
      seedTextBlock("res-move", "Verschieben", today, `${today}T10:00:00.000Z`),
    ]);

    await focusBlockNavigation(page);
    await pressVimNavKey(page, "k");
    await openRescheduleWithShortcut(page);
    await focusRescheduleModal(page);
    await page.keyboard.press("2");
    await confirmReschedule(page);

    await expectRescheduleClosed(page);
    await expect(blocks(page)).toHaveCount(0);

    const targetSection = await ensureDaySectionLoaded(page, targetDay);
    await expect(blocksInDay(targetSection, "text")).toHaveCount(1);
    await expect(
      blockInput(blocksInDay(targetSection, "text").first()),
    ).toHaveValue("Verschieben");

    const stored = (await page.evaluate(readMockBlocksScript)) as Array<{
      id: string;
      day: string;
    }>;
    const moved = stored.find((block) => block.id === "res-move");
    expect(moved).toBeDefined();
    expect(moved!.day).toBe(targetDay);
  });

  test("bestätigt mit Command+Enter", async ({ page }) => {
    const today = todayISO();
    const targetDay = shiftDate(today, 1);

    await gotoAppWithBlocks(page, [
      seedTextBlock("res-meta", "Meta", today, `${today}T10:00:00.000Z`),
    ]);

    await focusBlockNavigation(page);
    await pressVimNavKey(page, "k");
    await openRescheduleWithShortcut(page);
    await confirmRescheduleWithShortcut(page);

    await expectRescheduleClosed(page);
    const targetSection = await ensureDaySectionLoaded(page, targetDay);
    await expect(blocksInDay(targetSection, "text")).toHaveCount(1);
    await expect(
      blockInput(blocksInDay(targetSection, "text").first()),
    ).toHaveValue("Meta");
  });

  test("schließt mit Escape", async ({ page }) => {
    const today = todayISO();
    await gotoAppWithBlocks(page, [
      seedTextBlock("res-esc", "Escape", today, `${today}T10:00:00.000Z`),
    ]);

    await focusBlockNavigation(page);
    await pressVimNavKey(page, "k");
    await openRescheduleWithShortcut(page);
    await page.keyboard.press("Escape");

    await expectRescheduleClosed(page);
    await expect(blocks(page)).toHaveCount(1);
  });

  test("verschiebt verschachtelte Blöcke mit dem Subtree", async ({ page }) => {
    const today = todayISO();
    const targetDay = shiftDate(today, 4);

    await gotoAppWithBlocks(page, [
      seedTextBlock("res-parent", "Parent", today, `${today}T10:00:00.000Z`),
      seedTextBlock(
        "res-child",
        "Child",
        today,
        `${today}T10:30:00.000Z`,
        "res-parent",
      ),
    ]);

    await focusBlockNavigation(page);
    await pressVimNavKey(page, "k");
    await expect(navSelectedBlock(page)).toHaveAttribute(
      "data-block-id",
      "res-child",
    );

    await openRescheduleWithShortcut(page);
    await focusRescheduleModal(page);
    await page.keyboard.press("4");
    await confirmReschedule(page);

    await expectRescheduleClosed(page);
    await expect(page.locator('[data-block-id="res-child"]')).toBeVisible();
    await expect(
      blockInput(page.locator('[data-block-id="res-child"]')),
    ).toHaveValue("Child");
    await expect(blocks(page)).toHaveCount(1);
    await expect(blockInput(blocks(page).first())).toHaveValue("Parent");

    const targetSection = await ensureDaySectionLoaded(page, targetDay);
    await expect(blocksInDay(targetSection, "text")).toHaveCount(1);
    await expect(
      blockInput(blocksInDay(targetSection, "text").first()),
    ).toHaveValue("Child");

    const stored = (await page.evaluate(readMockBlocksScript)) as Array<{
      id: string;
      day: string;
      parentId: string | null;
    }>;
    const child = stored.find((block) => block.id === "res-child");
    const grandchildCheck = stored.find((block) => block.id === "res-parent");
    expect(child?.day).toBe(targetDay);
    expect(child?.parentId).toBeNull();
    expect(grandchildCheck?.day).toBe(today);
  });

  test("zeigt zukünftige Day-Sections zugeklappt bis zum Aufklappen", async ({
    page,
  }) => {
    const today = todayISO();
    const futureDay = shiftDate(today, 3);

    await gotoAppWithBlocks(page, [
      seedTextBlock(
        "future-block",
        "Future",
        futureDay,
        `${futureDay}T10:00:00.000Z`,
      ),
    ]);

    const futureSection = daySection(page, futureDay);
    await expect(futureSection).toHaveClass(/day--collapsed/);
    await expect(futureSection.locator(".day__blocks")).toHaveCount(0);

    await futureSection.locator(".day__header-toggle").click();
    await expect(futureSection).not.toHaveClass(/day--collapsed/);
    await expect(blocksInDay(futureSection, "text")).toHaveCount(1);

    await futureSection.locator(".day__header-toggle").click();
    await expect(futureSection).toHaveClass(/day--collapsed/);
    await expect(futureSection.locator(".day__blocks")).toHaveCount(0);
  });

  test("deaktiviert Setzen ohne gültiges Zukunftsdatum", async ({ page }) => {
    const today = todayISO();
    await gotoAppWithBlocks(page, [
      seedTextBlock("res-invalid", "Invalid", today, `${today}T10:00:00.000Z`),
    ]);

    await focusBlockNavigation(page);
    await pressVimNavKey(page, "k");
    await openRescheduleWithShortcut(page);
    await rescheduleDateInput(page).fill(today);

    await expect(
      rescheduleModal(page).getByRole("button", { name: "Setzen" }),
    ).toBeDisabled();
  });
});
