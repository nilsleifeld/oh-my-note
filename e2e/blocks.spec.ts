import { expect, test } from "@playwright/test";
import { readMockBlocksScript } from "./storageSeed";
import {
  addBlock,
  blocks,
  blockImage,
  blockImageTarget,
  blockInput,
  blocksInDay,
  changeBlockType,
  emptyDayHint,
  ensureDaySectionLoaded,
  fillBlock,
  getStoredBlock,
  gotoApp,
  gotoAppWithBlocks,
  nestedBlocks,
  pasteImageInBlock,
  pickImageInBlock,
  pressInBlock,
  reloadApp,
  selectCodeLanguage,
  shiftDate,
  simulateDragDrop,
  simulateDragOver,
  TEST_IMAGE_DATA_URL,
  TEST_PNG_BUFFER,
  todaySection,
  todayISO,
  typeInBlockAndPress,
  waitForBlockCount,
} from "./fixtures/app";

test.describe("Block-Erstellung", () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
  });

  test("erstellt Text-, Bullet-, To-do- und Code-Blöcke", async ({ page }) => {
    await addBlock(page, "text");
    await addBlock(page, "bullet");
    await addBlock(page, "todo");
    await addBlock(page, "code");

    await expect(blocks(page, "text")).toHaveCount(1);
    await expect(blocks(page, "bullet")).toHaveCount(1);
    await expect(blocks(page, "todo")).toHaveCount(1);
    await expect(blocks(page, "code")).toHaveCount(1);
    await expect(
      blocks(page, "text").first().locator(".block__bullet"),
    ).toHaveCount(0);
    await expect(
      blocks(page, "bullet").first().locator(".block__bullet"),
    ).toBeVisible();
  });

  test("erstellt Heading-Blöcke h1–h5", async ({ page }) => {
    for (const type of ["h1", "h2", "h3", "h4", "h5"] as const) {
      await addBlock(page, type);
      const block = blocks(page, type).last();
      await expect(block).toHaveClass(new RegExp(`block--${type}`));
      await expect(block.locator(".block__bullet")).toHaveCount(0);
    }

    await expect(blocks(page, "h1")).toHaveCount(1);
    await expect(blocks(page, "h2")).toHaveCount(1);
    await expect(blocks(page, "h3")).toHaveCount(1);
    await expect(blocks(page, "h4")).toHaveCount(1);
    await expect(blocks(page, "h5")).toHaveCount(1);
  });

  test("zeigt leeren Zustand wenn keine Blöcke vorhanden sind", async ({
    page,
  }) => {
    await expect(emptyDayHint(page)).toBeVisible();
  });

  test("erstellt Textblock über leeren Zustand", async ({ page }) => {
    await emptyDayHint(page).click();
    await expect(blocks(page, "text")).toHaveCount(1);
  });
});

test.describe("Block-Bearbeitung", () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
  });

  test("speichert Text in einem Textblock", async ({ page }) => {
    await addBlock(page, "text");
    const block = blocks(page, "text").first();
    await fillBlock(block, "Meine Notiz");

    await expect(blockInput(block)).toHaveValue("Meine Notiz");
    await reloadApp(page);
    await expect(blockInput(blocks(page, "text").first())).toHaveValue(
      "Meine Notiz",
    );
  });

  test("speichert Text in einem To-do-Block", async ({ page }) => {
    await addBlock(page, "todo");
    const block = blocks(page, "todo").first();
    await fillBlock(block, "Einkaufen gehen");

    await expect(blockInput(block)).toHaveValue("Einkaufen gehen");
  });

  test("schaltet To-do-Checkbox und zeigt Durchstreichung", async ({
    page,
  }) => {
    await addBlock(page, "todo");
    const block = blocks(page, "todo").first();
    await fillBlock(block, "Erledigen");

    const checkbox = block.locator(".block__checkbox");
    await expect(checkbox).not.toBeChecked();
    await checkbox.check();
    await expect(checkbox).toBeChecked();
    await expect(blockInput(block)).toHaveCSS(
      "text-decoration-line",
      "line-through",
    );

    await checkbox.uncheck();
    await expect(blockInput(block)).not.toHaveCSS(
      "text-decoration-line",
      "line-through",
    );
  });

  test("speichert Code und wählt Sprache", async ({ page }) => {
    await addBlock(page, "code");
    const block = blocks(page, "code").first();
    await selectCodeLanguage(block, "JavaScript");
    await fillBlock(block, 'console.log("hi")');

    await expect(blockInput(block)).toHaveValue('console.log("hi")');
    await expect(block.locator(".block__code-lang .select__value")).toHaveText(
      "JavaScript",
    );
  });

  test("speichert Text in einem Heading-Block", async ({ page }) => {
    await addBlock(page, "h1");
    const block = blocks(page, "h1").first();
    await fillBlock(block, "Mein Titel");

    await expect(blockInput(block)).toHaveValue("Mein Titel");
    await reloadApp(page);
    await expect(blockInput(blocks(page, "h1").first())).toHaveValue(
      "Mein Titel",
    );
  });

  test("wendet Heading-Typografie je nach Ebene an", async ({ page }) => {
    const types = ["h1", "h2", "h3", "h4", "h5"] as const;
    const fontSizes: number[] = [];

    for (const type of types) {
      await addBlock(page, type);
      const block = blocks(page, type).last();
      const size = await blockInput(block).evaluate((el) =>
        parseFloat(getComputedStyle(el).fontSize),
      );
      fontSizes.push(size);
      await expect(blockInput(block)).toHaveCSS("font-weight", "600");
    }

    for (let i = 0; i < fontSizes.length - 1; i++) {
      expect(fontSizes[i]).toBeGreaterThan(fontSizes[i + 1]);
    }
  });
});

test.describe("Block-Typ wechseln", () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
    await addBlock(page, "text");
  });

  test("wechselt Text → To-do", async ({ page }) => {
    const block = blocks(page, "text").first();
    await fillBlock(block, "Aufgabe");
    await changeBlockType(block, "todo");

    await expect(blocks(page, "todo")).toHaveCount(1);
    await expect(blocks(page, "text")).toHaveCount(0);
    await expect(blockInput(blocks(page, "todo").first())).toHaveValue(
      "Aufgabe",
    );
    await expect(
      blocks(page, "todo").first().locator(".block__checkbox"),
    ).toBeVisible();
  });

  test("wechselt Text → Code", async ({ page }) => {
    const block = blocks(page, "text").first();
    await fillBlock(block, "const x = 1");
    await changeBlockType(block, "code");

    await expect(blocks(page, "code")).toHaveCount(1);
    await expect(blocks(page, "text")).toHaveCount(0);
    await expect(blockInput(blocks(page, "code").first())).toHaveValue(
      "const x = 1",
    );
    await expect(
      blocks(page, "code")
        .first()
        .locator(".block__code-lang .select__trigger"),
    ).toBeVisible();
  });

  test("Backspace am Zeilenanfang wandelt Bullet in Text um", async ({
    page,
  }) => {
    const block = blocks(page, "text").first();
    await changeBlockType(block, "bullet");
    await fillBlock(blocks(page, "bullet").first(), "Listenpunkt");

    const input = blockInput(blocks(page, "bullet").first());
    await input.click();
    await input.press("Home");
    await input.press("Backspace");

    await expect(blocks(page, "bullet")).toHaveCount(0);
    await expect(blocks(page, "text")).toHaveCount(1);
    await expect(blockInput(blocks(page, "text").first())).toHaveValue(
      "Listenpunkt",
    );
    await expect(
      blocks(page, "text").first().locator(".block__bullet"),
    ).toHaveCount(0);
  });

  test('"- " wandelt Textblock in Bullet um', async ({ page }) => {
    const block = blocks(page, "text").first();
    const input = blockInput(block);
    await input.click();
    await input.pressSequentially("- ", { delay: 50 });

    await expect(blocks(page, "text")).toHaveCount(0);
    await expect(blocks(page, "bullet")).toHaveCount(1);
    await expect(blockInput(blocks(page, "bullet").first())).toHaveValue("");
    await expect(
      blocks(page, "bullet").first().locator(".block__bullet"),
    ).toBeVisible();
  });

  test("Backspace am Zeilenanfang wandelt To-do in Text um", async ({
    page,
  }) => {
    const block = blocks(page, "text").first();
    await changeBlockType(block, "todo");
    await fillBlock(blocks(page, "todo").first(), "Aufgabe");

    const input = blockInput(blocks(page, "todo").first());
    await input.click();
    await input.press("Home");
    await input.press("Backspace");

    await expect(blocks(page, "todo")).toHaveCount(0);
    await expect(blocks(page, "text")).toHaveCount(1);
    await expect(blockInput(blocks(page, "text").first())).toHaveValue(
      "Aufgabe",
    );
    await expect(
      blocks(page, "text").first().locator(".block__checkbox"),
    ).toHaveCount(0);
  });

  test("Backspace am Zeilenanfang wandelt Toggle in Text um", async ({
    page,
  }) => {
    const block = blocks(page, "text").first();
    await changeBlockType(block, "toggle");
    await fillBlock(blocks(page, "toggle").first(), "Abschnitt");

    const input = blockInput(blocks(page, "toggle").first());
    await input.click();
    await input.press("Home");
    await input.press("Backspace");

    await expect(blocks(page, "toggle")).toHaveCount(0);
    await expect(blocks(page, "text")).toHaveCount(1);
    await expect(blockInput(blocks(page, "text").first())).toHaveValue(
      "Abschnitt",
    );
    await expect(
      blocks(page, "text").first().locator(".block__toggle"),
    ).toHaveCount(0);
  });

  test('"[] " wandelt Textblock in To-do um', async ({ page }) => {
    const block = blocks(page, "text").first();
    const input = blockInput(block);
    await input.click();
    await input.pressSequentially("[] ", { delay: 50 });

    await expect(blocks(page, "text")).toHaveCount(0);
    await expect(blocks(page, "todo")).toHaveCount(1);
    await expect(blockInput(blocks(page, "todo").first())).toHaveValue("");
    await expect(
      blocks(page, "todo").first().locator(".block__checkbox"),
    ).toBeVisible();
    await expect(
      blocks(page, "todo").first().locator(".block__checkbox"),
    ).not.toBeChecked();
  });

  test.describe("Shortcuts aus jedem Block-Typ", () => {
    async function typeShortcut(
      block: ReturnType<typeof blocks>,
      shortcut: "- " | "[] ",
    ) {
      const input = blockInput(block);
      await input.click();
      await input.pressSequentially(shortcut, { delay: 50 });
    }

    test('"- " wandelt To-do in Bullet um', async ({ page }) => {
      await addBlock(page, "todo");
      await typeShortcut(blocks(page, "todo").first(), "- ");

      await expect(blocks(page, "todo")).toHaveCount(0);
      await expect(blocks(page, "bullet")).toHaveCount(1);
      await expect(blockInput(blocks(page, "bullet").first())).toHaveValue("");
      await expect(
        blocks(page, "bullet").first().locator(".block__bullet"),
      ).toBeVisible();
    });

    test('"[] " wandelt Bullet in To-do um', async ({ page }) => {
      await addBlock(page, "bullet");
      await typeShortcut(blocks(page, "bullet").first(), "[] ");

      await expect(blocks(page, "bullet")).toHaveCount(0);
      await expect(blocks(page, "todo")).toHaveCount(1);
      await expect(blockInput(blocks(page, "todo").first())).toHaveValue("");
      await expect(
        blocks(page, "todo").first().locator(".block__checkbox"),
      ).toBeVisible();
    });

    test('"- " wandelt Toggle in Bullet um', async ({ page }) => {
      await addBlock(page, "toggle");
      await typeShortcut(blocks(page, "toggle").first(), "- ");

      await expect(blocks(page, "toggle")).toHaveCount(0);
      await expect(blocks(page, "bullet")).toHaveCount(1);
      await expect(blockInput(blocks(page, "bullet").first())).toHaveValue("");
    });

    test('"[] " wandelt Toggle in To-do um', async ({ page }) => {
      await addBlock(page, "toggle");
      await typeShortcut(blocks(page, "toggle").first(), "[] ");

      await expect(blocks(page, "toggle")).toHaveCount(0);
      await expect(blocks(page, "todo")).toHaveCount(1);
      await expect(blockInput(blocks(page, "todo").first())).toHaveValue("");
    });

    test('"- " wandelt Code in Bullet um', async ({ page }) => {
      await addBlock(page, "code");
      await typeShortcut(blocks(page, "code").first(), "- ");

      await expect(blocks(page, "code")).toHaveCount(0);
      await expect(blocks(page, "bullet")).toHaveCount(1);
      await expect(blockInput(blocks(page, "bullet").first())).toHaveValue("");
    });

    test('"[] " wandelt Code in To-do um', async ({ page }) => {
      await addBlock(page, "code");
      await typeShortcut(blocks(page, "code").first(), "[] ");

      await expect(blocks(page, "code")).toHaveCount(0);
      await expect(blocks(page, "todo")).toHaveCount(1);
      await expect(blockInput(blocks(page, "todo").first())).toHaveValue("");
    });

    test('"- " wandelt Heading in Bullet um', async ({ page }) => {
      await addBlock(page, "h1");
      await typeShortcut(blocks(page, "h1").first(), "- ");

      await expect(blocks(page, "h1")).toHaveCount(0);
      await expect(blocks(page, "bullet")).toHaveCount(1);
      await expect(blockInput(blocks(page, "bullet").first())).toHaveValue("");
    });

    test('"[] " wandelt Heading in To-do um', async ({ page }) => {
      await addBlock(page, "h2");
      await typeShortcut(blocks(page, "h2").first(), "[] ");

      await expect(blocks(page, "h2")).toHaveCount(0);
      await expect(blocks(page, "todo")).toHaveCount(1);
      await expect(blockInput(blocks(page, "todo").first())).toHaveValue("");
    });

    test('"- " behält vorhandenen Inhalt beim Umwandeln', async ({ page }) => {
      await addBlock(page, "todo");
      const block = blocks(page, "todo").first();
      await fillBlock(block, "Aufgabe");

      const input = blockInput(block);
      await input.click();
      await input.press("Home");
      await input.pressSequentially("- ", { delay: 50 });

      await expect(blocks(page, "todo")).toHaveCount(0);
      await expect(blocks(page, "bullet")).toHaveCount(1);
      await expect(blockInput(blocks(page, "bullet").first())).toHaveValue(
        "Aufgabe",
      );
    });

    test('"[] " behält vorhandenen Inhalt beim Umwandeln', async ({ page }) => {
      await addBlock(page, "toggle");
      const block = blocks(page, "toggle").first();
      await fillBlock(block, "Abschnitt");

      const input = blockInput(block);
      await input.click();
      await input.press("Home");
      await input.pressSequentially("[] ", { delay: 50 });

      await expect(blocks(page, "toggle")).toHaveCount(0);
      await expect(blocks(page, "todo")).toHaveCount(1);
      await expect(blockInput(blocks(page, "todo").first())).toHaveValue(
        "Abschnitt",
      );
    });
  });

  test("Backspace am Zeilenanfang löscht Textblock", async ({ page }) => {
    const block = blocks(page, "text").first();
    await fillBlock(block, "Inhalt");

    const input = blockInput(block);
    await input.click();
    await input.press("Home");
    await input.press("Backspace");

    await expect(blocks(page, "text")).toHaveCount(0);
  });

  test("wechselt To-do → Text", async ({ page }) => {
    const block = blocks(page, "text").first();
    await changeBlockType(block, "todo");
    await changeBlockType(blocks(page, "todo").first(), "text");

    await expect(blocks(page, "text")).toHaveCount(1);
    await expect(blocks(page, "todo")).toHaveCount(0);
    await expect(
      blocks(page, "text").first().locator(".block__bullet"),
    ).toHaveCount(0);
  });

  test("wechselt Text → Heading 1 und behält Inhalt", async ({ page }) => {
    const block = blocks(page, "text").first();
    await fillBlock(block, "Überschrift");
    await changeBlockType(block, "h1");

    await expect(blocks(page, "h1")).toHaveCount(1);
    await expect(blocks(page, "text")).toHaveCount(0);
    await expect(blockInput(blocks(page, "h1").first())).toHaveValue(
      "Überschrift",
    );
    await expect(
      blocks(page, "h1").first().locator(".block__bullet"),
    ).toHaveCount(0);
  });

  test("wechselt Heading 1 → Heading 2", async ({ page }) => {
    const block = blocks(page, "text").first();
    await changeBlockType(block, "h1");
    await fillBlock(blocks(page, "h1").first(), "Kapitel");
    await changeBlockType(blocks(page, "h1").first(), "h2");

    await expect(blocks(page, "h2")).toHaveCount(1);
    await expect(blocks(page, "h1")).toHaveCount(0);
    await expect(blockInput(blocks(page, "h2").first())).toHaveValue("Kapitel");
  });
});

test.describe("Tastatur-Interaktionen", () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
  });

  test("Enter erstellt neuen Textblock darunter", async ({ page }) => {
    await addBlock(page, "text");
    const first = blocks(page, "text").first();
    await typeInBlockAndPress(first, "Erster Block", "Enter");

    await waitForBlockCount(page, 2, "text");
    const second = blocks(page, "text").nth(1);
    await expect(blockInput(second)).toHaveValue("");
    await expect(blockInput(second)).toBeFocused();
  });

  test("Enter im To-do-Input erstellt To-do darunter mit Fokus", async ({
    page,
  }) => {
    await addBlock(page, "todo");
    const todo = blocks(page, "todo").first();
    await typeInBlockAndPress(todo, "Aufgabe", "Enter");

    await expect(blocks(page, "todo")).toHaveCount(2);
    const newBlock = blocks(page, "todo").nth(1);
    await expect(blockInput(newBlock)).toHaveValue("");
    await expect(blockInput(newBlock)).toBeFocused();
  });

  test("Backspace auf leerem Block löscht ihn", async ({ page }) => {
    await addBlock(page, "text");
    await addBlock(page, "text");
    await waitForBlockCount(page, 2, "text");

    const second = blocks(page, "text").nth(1);
    await pressInBlock(second, "Backspace");

    await waitForBlockCount(page, 1, "text");
  });

  test("Tab rückt Block ein, Shift+Tab rückt aus", async ({ page }) => {
    await addBlock(page, "text");
    await addBlock(page, "text");
    await fillBlock(blocks(page, "text").first(), "Parent");
    await fillBlock(blocks(page, "text").nth(1), "Child");

    const second = blocks(page, "text").nth(1);
    await pressInBlock(second, "Tab");

    const parent = blocks(page, "text").first();
    await expect(parent.locator("> .block__children")).toBeVisible();
    await expect(nestedBlocks(parent, "text")).toHaveCount(1);
    await expect(blockInput(nestedBlocks(parent, "text").first())).toHaveValue(
      "Child",
    );

    const nested = nestedBlocks(parent, "text").first();
    await pressInBlock(nested, "Shift+Tab");

    await waitForBlockCount(page, 2, "text");
    await expect(parent.locator("> .block__children")).toHaveCount(0);
  });

  test("Enter in Code erstellt Codeblock darunter", async ({ page }) => {
    await addBlock(page, "code");
    const code = blocks(page, "code").first();
    await fillBlock(code, "fn main() {}");
    await pressInBlock(code, "Enter");

    await expect(blocks(page, "code")).toHaveCount(2);
    await expect(blockInput(blocks(page, "code").nth(1))).toHaveValue("");
    await expect(blockInput(blocks(page, "code").nth(1))).toBeFocused();
  });

  test("Enter in Heading erstellt Textblock darunter", async ({ page }) => {
    await addBlock(page, "h2");
    const heading = blocks(page, "h2").first();
    await typeInBlockAndPress(heading, "Abschnitt", "Enter");

    await expect(blocks(page, "h2")).toHaveCount(1);
    await expect(blocks(page, "text")).toHaveCount(1);
    const textBlock = blocks(page, "text").first();
    await expect(blockInput(textBlock)).toHaveValue("");
    await expect(blockInput(textBlock)).toBeFocused();
  });
});

test.describe("Toggle-Block", () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
  });

  test("erstellt Toggle-Block mit Chevron-Button", async ({ page }) => {
    await addBlock(page, "toggle");

    const block = blocks(page, "toggle").first();
    await expect(block).toHaveClass(/block--toggle/);
    await expect(block.locator(".block__toggle")).toBeVisible();
    await expect(block.locator(".block__toggle")).toHaveClass(
      /block__toggle--open/,
    );
  });

  test("klappt verschachtelte Kinder auf und zu", async ({ page }) => {
    const today = todayISO();
    await gotoAppWithBlocks(page, [
      {
        id: "toggle-parent",
        type: "toggle",
        parentId: null,
        day: today,
        createdAt: `${today}T10:00:00.000Z`,
        content: ["toggle-child"],
        properties: {
          title: "Abschnitt",
          checked: false,
          language: "",
          imageData: "",
          open: true,
        },
      },
      {
        id: "toggle-child",
        type: "text",
        parentId: "toggle-parent",
        day: today,
        createdAt: `${today}T10:30:00.000Z`,
        content: [],
        properties: {
          title: "Detail",
          checked: false,
          language: "",
          imageData: "",
          open: true,
        },
      },
    ]);

    const parent = blocks(page, "toggle").first();
    await expect(nestedBlocks(parent, "text")).toHaveCount(1);
    await expect(blockInput(nestedBlocks(parent, "text").first())).toHaveValue(
      "Detail",
    );

    const toggle = parent.locator(".block__toggle");
    await expect(toggle).toHaveClass(/block__toggle--open/);

    await toggle.click();
    await expect(toggle).toHaveClass(/block__toggle--closed/);
    await expect(parent.locator("> .block__children")).toHaveCount(0);

    await toggle.click();
    await expect(toggle).toHaveClass(/block__toggle--open/);
    await expect(nestedBlocks(parent, "text")).toHaveCount(1);
  });

  test("speichert open-Zustand nach Reload", async ({ page }) => {
    const today = todayISO();
    await gotoAppWithBlocks(page, [
      {
        id: "toggle-parent",
        type: "toggle",
        parentId: null,
        day: today,
        createdAt: `${today}T10:00:00.000Z`,
        content: ["toggle-child"],
        properties: {
          title: "Abschnitt",
          checked: false,
          language: "",
          imageData: "",
          open: true,
        },
      },
      {
        id: "toggle-child",
        type: "text",
        parentId: "toggle-parent",
        day: today,
        createdAt: `${today}T10:30:00.000Z`,
        content: [],
        properties: {
          title: "Detail",
          checked: false,
          language: "",
          imageData: "",
          open: true,
        },
      },
    ]);

    const parent = blocks(page, "toggle").first();
    const toggle = parent.locator(".block__toggle");
    await expect(nestedBlocks(parent, "text")).toHaveCount(1);

    await toggle.click();
    await expect(parent.locator("> .block__children")).toHaveCount(0);

    await reloadApp(page);

    const reloaded = blocks(page, "toggle").first();
    await expect(reloaded.locator(".block__toggle")).toHaveClass(
      /block__toggle--closed/,
    );
    await expect(reloaded.locator("> .block__children")).toHaveCount(0);

    const stored = await getStoredBlock(page, "toggle-parent");
    expect(stored?.properties.open).toBe(false);
  });

  test("andere Block-Typen haben keinen Toggle-Button", async ({ page }) => {
    await addBlock(page, "text");
    await addBlock(page, "text");
    await fillBlock(blocks(page, "text").first(), "Parent");
    await fillBlock(blocks(page, "text").nth(1), "Child");
    await pressInBlock(blocks(page, "text").nth(1), "Tab");

    const parent = blocks(page, "text").first();
    await expect(parent.locator(".block__toggle")).toHaveCount(0);
    await expect(nestedBlocks(parent, "text")).toHaveCount(1);
  });

  test("Text-Kinder bleiben sichtbar unabhängig von open", async ({ page }) => {
    const today = todayISO();
    await gotoAppWithBlocks(page, [
      {
        id: "text-parent",
        type: "text",
        parentId: null,
        day: today,
        createdAt: `${today}T10:00:00.000Z`,
        content: ["text-child"],
        properties: {
          title: "Parent",
          checked: false,
          language: "",
          imageData: "",
          open: false,
        },
      },
      {
        id: "text-child",
        type: "text",
        parentId: "text-parent",
        day: today,
        createdAt: `${today}T10:30:00.000Z`,
        content: [],
        properties: {
          title: "Child",
          checked: false,
          language: "",
          imageData: "",
          open: true,
        },
      },
    ]);

    const parent = blocks(page, "text").first();
    await expect(parent.locator(".block__toggle")).toHaveCount(0);
    await expect(nestedBlocks(parent, "text")).toHaveCount(1);
    await expect(blockInput(nestedBlocks(parent, "text").first())).toHaveValue(
      "Child",
    );
  });
});

test.describe("Drag & Drop", () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
  });

  test("zeigt Drag-Feedback auf Quelle und Ziel", async ({ page }) => {
    await addBlock(page, "text");
    await addBlock(page, "text");
    await fillBlock(blocks(page, "text").nth(0), "Quelle");
    await fillBlock(blocks(page, "text").nth(1), "Ziel");

    const source = blocks(page, "text").nth(0);
    const target = blocks(page, "text").nth(1);
    await simulateDragOver(source, target);

    await expect(source).toHaveClass(/block--dragging/);
    await expect(target).toHaveClass(/block--over/);
  });

  test("sortiert Blöcke innerhalb eines Tages per Drop", async ({ page }) => {
    const today = todayISO();

    await gotoAppWithBlocks(page, [
      {
        id: "block-top",
        type: "text",
        parentId: null,
        day: today,
        createdAt: `${today}T10:00:00.000Z`,
        content: [],
        properties: {
          title: "Oben",
          checked: false,
          language: "",
          imageData: "",
          open: true,
        },
      },
      {
        id: "block-bottom",
        type: "text",
        parentId: null,
        day: today,
        createdAt: `${today}T11:00:00.000Z`,
        content: [],
        properties: {
          title: "Unten",
          checked: false,
          language: "",
          imageData: "",
          open: true,
        },
      },
    ]);

    const day = todaySection(page);
    await simulateDragDrop(
      blocksInDay(day, "text").nth(1),
      blocksInDay(day, "text").nth(0),
    );

    await expect(blockInput(blocksInDay(day, "text").nth(0))).toHaveValue(
      "Unten",
    );
    await expect(blockInput(blocksInDay(day, "text").nth(1))).toHaveValue(
      "Oben",
    );
  });

  test("verschiebt Block zwischen Day-Sections", async ({ page }) => {
    const today = todayISO();
    const yesterday = shiftDate(today, -1);

    await gotoAppWithBlocks(page, [
      {
        id: "block-yesterday",
        type: "text",
        parentId: null,
        day: yesterday,
        createdAt: `${yesterday}T10:00:00.000Z`,
        content: [],
        properties: {
          title: "Gestern",
          checked: false,
          language: "",
          imageData: "",
          open: true,
        },
      },
      {
        id: "block-today",
        type: "text",
        parentId: null,
        day: today,
        createdAt: `${today}T11:00:00.000Z`,
        content: [],
        properties: {
          title: "Heute",
          checked: false,
          language: "",
          imageData: "",
          open: true,
        },
      },
    ]);

    const yesterdayEl = await ensureDaySectionLoaded(page, yesterday);

    const source = blocksInDay(yesterdayEl, "text").first();
    const target = blocksInDay(todaySection(page), "text").first();
    await expect(blockInput(source)).toHaveValue("Gestern");
    await expect(blockInput(target)).toHaveValue("Heute");

    await simulateDragDrop(source, target);

    await expect(blocksInDay(yesterdayEl, "text")).toHaveCount(0);
    await expect(blocksInDay(todaySection(page), "text")).toHaveCount(2);
    await expect(
      blockInput(blocksInDay(todaySection(page), "text").nth(0)),
    ).toHaveValue("Gestern");

    const stored = (await page.evaluate(readMockBlocksScript)) as Array<{
      id: string;
      day: string;
    }>;
    const moved = stored.find(
      (block: { id: string }) => block.id === "block-yesterday",
    );
    expect(moved).toBeDefined();
    expect(moved!.day).toBe(today);
  });
});

test.describe("Verschachtelung", () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
  });

  test("erstellt mehrstufige Hierarchie", async ({ page }) => {
    await addBlock(page, "text");
    await addBlock(page, "text");
    await addBlock(page, "text");
    await fillBlock(blocks(page, "text").nth(0), "Ebene 0");
    await fillBlock(blocks(page, "text").nth(1), "Ebene 1");
    await fillBlock(blocks(page, "text").nth(2), "Ebene 2");

    await pressInBlock(blocks(page, "text").nth(1), "Tab");
    await pressInBlock(blocks(page, "text").nth(1), "Tab");

    const root = blocks(page, "text").first();
    const ebene1 = nestedBlocks(root, "text").first();
    const ebene2 = nestedBlocks(root, "text").nth(1);
    await pressInBlock(ebene2, "Tab");

    const level2 = nestedBlocks(ebene1, "text");

    await expect(blockInput(root)).toHaveValue("Ebene 0");
    await expect(blockInput(ebene1)).toHaveValue("Ebene 1");
    await expect(blockInput(level2)).toHaveValue("Ebene 2");
  });

  test("Enter in verschachteltem Block fügt Geschwister ein", async ({
    page,
  }) => {
    await addBlock(page, "text");
    await addBlock(page, "text");
    await fillBlock(blocks(page, "text").nth(0), "Parent");
    await fillBlock(blocks(page, "text").nth(1), "Child");
    await pressInBlock(blocks(page, "text").nth(1), "Tab");

    const parent = blocks(page, "text").first();
    const child = nestedBlocks(parent, "text").first();
    await fillBlock(child, "Child");
    await pressInBlock(child, "Enter");

    await expect(nestedBlocks(parent, "text")).toHaveCount(2);
  });
});

test.describe("Image-Blöcke", () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
  });

  test("fügt Bild per Choose-image-Button ein", async ({ page }) => {
    await addBlock(page, "image");
    const block = blocks(page, "image").first();

    const fileChooserPromise = page.waitForEvent("filechooser");
    await block.getByRole("button", { name: "Choose image" }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "test.png",
      mimeType: "image/png",
      buffer: TEST_PNG_BUFFER,
    });

    await expect(blockImage(block)).toBeVisible();
    await expect(blockImage(block)).toHaveAttribute(
      "src",
      /^data:image\/png;base64,/,
    );
  });

  test("fügt Bild per Dateiauswahl in leeren Image-Block ein", async ({
    page,
  }) => {
    await addBlock(page, "image");
    const block = blocks(page, "image").first();
    await expect(block.locator(".block__image-pick")).toBeVisible();

    await pickImageInBlock(block);

    await expect(block.locator(".block__image-placeholder")).toHaveCount(0);
    await expect(blockImage(block)).toBeVisible();
    await expect(blockImage(block)).toHaveAttribute(
      "src",
      /^data:image\/png;base64,/,
    );

    await reloadApp(page);
    await expect(blockImage(blocks(page, "image").first())).toHaveAttribute(
      "src",
      /^data:image\/png;base64,/,
    );
  });

  test("fügt Bild per Paste in leeren Image-Block ein", async ({ page }) => {
    await addBlock(page, "image");
    const block = blocks(page, "image").first();
    await expect(blockImageTarget(block)).toBeVisible();
    await expect(block.locator(".block__image-placeholder")).toBeVisible();

    await pasteImageInBlock(block);

    await expect(block.locator(".block__image-placeholder")).toHaveCount(0);
    await expect(blockImage(block)).toBeVisible();
    await expect(blockImage(block)).toHaveAttribute("src", TEST_IMAGE_DATA_URL);

    await reloadApp(page);
    const reloaded = blocks(page, "image").first();
    await expect(blockImage(reloaded)).toHaveAttribute(
      "src",
      TEST_IMAGE_DATA_URL,
    );
  });

  test("wandelt Textblock per Paste in Image-Block um", async ({ page }) => {
    await addBlock(page, "text");
    const block = blocks(page, "text").first();
    await fillBlock(block, "Wird ersetzt");

    await pasteImageInBlock(block);

    await expect(blocks(page, "image")).toHaveCount(1);
    await expect(blocks(page, "text")).toHaveCount(0);
    await expect(blockImage(blocks(page, "image").first())).toHaveAttribute(
      "src",
      TEST_IMAGE_DATA_URL,
    );

    const blockId = await blocks(page, "image")
      .first()
      .getAttribute("data-block-id");
    expect(blockId).toBeTruthy();
    const stored = await getStoredBlock(page, blockId!);
    expect(stored).toBeDefined();
    expect(stored!.type).toBe("image");
    expect(stored!.properties.imageData).toBe(TEST_IMAGE_DATA_URL);
    expect(stored!.properties.title).toBe("");
  });

  test("wandelt To-do-Block per Paste in Image-Block um", async ({ page }) => {
    await addBlock(page, "todo");
    const block = blocks(page, "todo").first();
    await fillBlock(block, "Aufgabe");

    await pasteImageInBlock(block);

    await expect(blocks(page, "image")).toHaveCount(1);
    await expect(blocks(page, "todo")).toHaveCount(0);
    await expect(blockImage(blocks(page, "image").first())).toBeVisible();
  });

  test("wandelt Code-Block per Paste in Image-Block um", async ({ page }) => {
    await addBlock(page, "code");
    const block = blocks(page, "code").first();
    await fillBlock(block, "console.log(1)");

    await pasteImageInBlock(block);

    await expect(blocks(page, "image")).toHaveCount(1);
    await expect(blocks(page, "code")).toHaveCount(0);
  });

  test("Enter im Image-Block erstellt Textblock darunter", async ({ page }) => {
    await addBlock(page, "image");
    const image = blocks(page, "image").first();
    await pasteImageInBlock(image);
    await pressInBlock(image, "Enter");

    await expect(blocks(page, "image")).toHaveCount(1);
    await expect(blocks(page, "text")).toHaveCount(1);
    await expect(blockInput(blocks(page, "text").first())).toBeFocused();
  });

  test("wechselt Text → Image über Typ-Menü", async ({ page }) => {
    await addBlock(page, "text");
    const block = blocks(page, "text").first();
    await changeBlockType(block, "image");

    const image = blocks(page, "image").first();
    await expect(blocks(page, "image")).toHaveCount(1);
    await expect(image.locator(".block__image-placeholder")).toBeVisible();

    await pasteImageInBlock(image);
    await expect(blockImage(image)).toBeVisible();
  });
});
