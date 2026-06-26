import { expect, test } from "@playwright/test";
import {
  blockInput,
  ensureDaySectionLoaded,
  enterSearchNormalMode,
  expectSearchClosed,
  fillSearch,
  focusBlockNavigation,
  gotoAppWithBlocks,
  highlightedSearchResult,
  navSelectedBlock,
  openSearch,
  openSearchWithShortcut,
  pressVimNavKey,
  searchCount,
  searchInput,
  searchModal,
  searchPreview,
  searchResults,
  shiftDate,
  todayISO,
  type SeedBlock,
} from "./fixtures/app";

function textBlock(
  id: string,
  title: string,
  day: string,
  createdAt: string,
  parentId: string | null = null,
): SeedBlock {
  return {
    id,
    type: "text",
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
  };
}

test.describe("Globale Block-Suche", () => {
  const today = todayISO();
  const yesterday = shiftDate(today, -1);

  const searchSeed: SeedBlock[] = [
    textBlock(
      "search-today-a",
      "Meeting notes today",
      today,
      `${today}T10:00:00.000Z`,
    ),
    textBlock(
      "search-today-b",
      "Shopping list",
      today,
      `${today}T11:00:00.000Z`,
    ),
    textBlock(
      "search-yesterday",
      "Archive entry yesterday",
      yesterday,
      `${yesterday}T10:00:00.000Z`,
    ),
    {
      id: "search-code",
      type: "code",
      parentId: null,
      day: today,
      createdAt: `${today}T12:00:00.000Z`,
      properties: {
        title: "function hello() {}",
        checked: false,
        language: "javascript",
        imageData: "",
        open: true,
      },
    },
    {
      id: "search-toggle",
      type: "toggle",
      parentId: null,
      day: today,
      createdAt: `${today}T13:00:00.000Z`,
      properties: {
        title: "Collapsed section",
        checked: false,
        language: "",
        imageData: "",
        open: false,
      },
    },
    textBlock(
      "search-hidden",
      "Hidden gem inside toggle",
      today,
      `${today}T13:30:00.000Z`,
      "search-toggle",
    ),
  ];

  test.beforeEach(async ({ page }) => {
    await gotoAppWithBlocks(page, searchSeed);
  });

  test("öffnet und schließt Suche über Header-Button", async ({ page }) => {
    await expectSearchClosed(page);
    await openSearch(page);
    await expect(searchInput(page)).toBeFocused();
    await expect(searchResults(page)).toHaveCount(6);
    await expect(searchCount(page)).toHaveText("6 / 6");

    await searchModal(page).click({ position: { x: 8, y: 8 } });
    await expectSearchClosed(page);
  });

  test("öffnet Suche über Tastenkürzel", async ({ page }) => {
    await openSearchWithShortcut(page);
    await expect(searchInput(page)).toBeFocused();
    await expect(searchModal(page)).toBeVisible();
  });

  test("filtert Ergebnisse per Fuzzy-Suche und hebt Treffer hervor", async ({
    page,
  }) => {
    await openSearch(page);
    await fillSearch(page, "meetng");

    await expect(searchResults(page)).toHaveCount(1);
    await expect(searchCount(page)).toHaveText("1 / 6");
    await expect(highlightedSearchResult(page)).toContainText(
      "Meeting notes today",
    );
    await expect(
      highlightedSearchResult(page).locator(".search-modal__mark").first(),
    ).toBeVisible();
  });

  test("zeigt leere Ergebnisliste bei keinem Treffer", async ({ page }) => {
    await openSearch(page);
    await fillSearch(page, "zzznomatch");

    await expect(searchModal(page).locator(".search-modal__empty")).toHaveText(
      "No matches",
    );
    await expect(searchCount(page)).toHaveText("0 / 6");
    await expect(
      searchModal(page).locator(".search-modal__preview-body--empty"),
    ).toBeVisible();
  });

  test("aktualisiert Preview bei Navigation und Hover", async ({ page }) => {
    await openSearch(page);

    const firstTitle = await highlightedSearchResult(page)
      .locator(".search-modal__option-title")
      .textContent();
    await expect(searchPreview(page)).toContainText(firstTitle!);

    await searchInput(page).press("ArrowDown");
    const secondTitle = await highlightedSearchResult(page)
      .locator(".search-modal__option-title")
      .textContent();
    expect(secondTitle).not.toBe(firstTitle);
    await expect(searchPreview(page)).toContainText(secondTitle!);
    await expect(
      searchPreview(page).locator(".search-modal__preview-block--match"),
    ).toContainText(secondTitle!);

    await searchResults(page).nth(2).hover();
    const hoveredTitle = await highlightedSearchResult(page)
      .locator(".search-modal__option-title")
      .textContent();
    await expect(searchPreview(page)).toContainText(hoveredTitle!);
  });

  test("navigiert mit Pfeiltasten im Insert-Modus und j/k im Normal-Modus", async ({
    page,
  }) => {
    await openSearch(page);
    await expect(searchResults(page)).toHaveCount(6);

    const firstTitle = await highlightedSearchResult(page)
      .locator(".search-modal__option-title")
      .textContent();

    await searchInput(page).press("ArrowDown");
    const secondTitle = await highlightedSearchResult(page)
      .locator(".search-modal__option-title")
      .textContent();
    expect(firstTitle).not.toBe(secondTitle);

    await enterSearchNormalMode(page);
    await page.keyboard.press("j");
    const thirdTitle = await highlightedSearchResult(page)
      .locator(".search-modal__option-title")
      .textContent();
    expect(thirdTitle).not.toBe(secondTitle);

    await page.keyboard.press("k");
    await expect(highlightedSearchResult(page)).toContainText(secondTitle!);
  });

  test("wechselt mit Esc und i zwischen Insert- und Normal-Modus", async ({
    page,
  }) => {
    await openSearch(page);
    await expect(searchInput(page)).toBeFocused();

    await searchInput(page).press("Escape");
    await expect(searchModal(page)).toBeVisible();
    await expect(searchInput(page)).not.toBeFocused();

    await page.keyboard.press("i");
    await expect(searchInput(page)).toBeFocused();
  });

  test("schließt Suche mit Esc im Normal-Modus", async ({ page }) => {
    await openSearch(page);
    await enterSearchNormalMode(page);
    await page.keyboard.press("Escape");
    await expectSearchClosed(page);
  });

  test("ignoriert Feed-Vim-Navigation solange Suche offen ist", async ({
    page,
  }) => {
    await focusBlockNavigation(page);
    await pressVimNavKey(page, "G");
    await expect(navSelectedBlock(page)).toHaveAttribute(
      "data-block-id",
      "search-yesterday",
    );

    await openSearch(page);
    const before = await highlightedSearchResult(page)
      .locator(".search-modal__option-title")
      .textContent();

    await enterSearchNormalMode(page);
    await page.keyboard.press("k");

    await expect(navSelectedBlock(page)).toHaveAttribute(
      "data-block-id",
      "search-yesterday",
    );
    const after = await highlightedSearchResult(page)
      .locator(".search-modal__option-title")
      .textContent();
    expect(before).not.toBe(after);
  });

  test("springt per Enter zum ausgewählten Block im Feed", async ({ page }) => {
    await openSearch(page);
    await fillSearch(page, "Shopping");
    await searchInput(page).press("Enter");

    await expectSearchClosed(page);
    await expect(navSelectedBlock(page)).toHaveAttribute(
      "data-block-id",
      "search-today-b",
    );
    await expect(
      blockInput(page.locator('[data-block-id="search-today-b"]')),
    ).toHaveValue("Shopping list");
  });

  test("springt per Klick auf Ergebnis zum Block", async ({ page }) => {
    await openSearch(page);
    await fillSearch(page, "Archive");

    await searchResults(page).first().click();

    await expectSearchClosed(page);
    await expect(navSelectedBlock(page)).toHaveAttribute(
      "data-block-id",
      "search-yesterday",
    );
  });

  test("springt zu Block auf anderem Tag", async ({ page }) => {
    await openSearch(page);
    await fillSearch(page, "Archive entry");
    await searchInput(page).press("Enter");

    await expectSearchClosed(page);
    const yesterdaySection = await ensureDaySectionLoaded(page, yesterday);
    await expect(
      yesterdaySection.locator('[data-block-id="search-yesterday"]'),
    ).toBeVisible();
    await expect(navSelectedBlock(page)).toHaveAttribute(
      "data-block-id",
      "search-yesterday",
    );
  });

  test("öffnet zugeklappte Toggle-Vorfahren beim Springen", async ({
    page,
  }) => {
    const toggle = page.locator('[data-block-id="search-toggle"]');
    await expect(toggle.locator(".block__toggle")).toHaveClass(
      /block__toggle--closed/,
    );
    await expect(toggle.locator("> .block__children")).toHaveCount(0);

    await openSearch(page);
    await fillSearch(page, "Hidden gem");
    await searchInput(page).press("Enter");

    await expectSearchClosed(page);
    await expect(toggle.locator(".block__toggle")).toHaveClass(
      /block__toggle--open/,
    );
    await expect(
      toggle.locator('[data-block-id="search-hidden"]'),
    ).toBeVisible();
    await expect(navSelectedBlock(page)).toHaveAttribute(
      "data-block-id",
      "search-hidden",
    );
  });

  test("zeigt Code-Inhalt in der Preview", async ({ page }) => {
    await openSearch(page);
    await fillSearch(page, "hello");

    await expect(highlightedSearchResult(page)).toContainText("function hello");
    await expect(searchPreview(page)).toContainText("function hello() {}");
    await expect(searchPreview(page)).toContainText("javascript");
  });
});
