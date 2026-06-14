import { expect, test } from "@playwright/test";
import {
  addBlock,
  allTodos,
  app,
  blockInput,
  blocks,
  expectBlockRowVisible,
  fillBlock,
  gotoApp,
  nestedBlocks,
  pressInBlock,
  selectViewMode,
  todoFilter,
} from "./fixtures/app";

test.describe("View Mode", () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
  });

  test("blendet To-do-Filter aus bis Todos gewählt ist", async ({ page }) => {
    await expect(todoFilter(page)).toBeHidden();

    await selectViewMode(page, "todos");
    await expect(todoFilter(page)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "All", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");

    await selectViewMode(page, "notes");
    await expect(todoFilter(page)).toBeHidden();
  });

  test("Todos zeigt alle To-dos und blendet andere Blöcke aus", async ({
    page,
  }) => {
    await addBlock(page, "text");
    await fillBlock(blocks(page, "text").first(), "Notiz");
    await addBlock(page, "todo");
    await fillBlock(blocks(page, "todo").first(), "Offen");
    await addBlock(page, "todo");
    const done = blocks(page, "todo").nth(1);
    await fillBlock(done, "Erledigt");
    await done.locator(".block__checkbox").check();

    await selectViewMode(page, "todos");
    await expect(app(page)).toHaveClass(/app--todos/);
    await expect(app(page)).not.toHaveClass(/app--todos-open/);
    await expect(app(page)).not.toHaveClass(/app--todos-done/);

    await expectBlockRowVisible(blocks(page, "text").first(), false);
    await expectBlockRowVisible(blocks(page, "todo").first(), true);
    await expectBlockRowVisible(blocks(page, "todo").nth(1), true);
    await expect(allTodos(page)).toHaveCount(2);
  });

  test("Open zeigt nur offene To-dos", async ({ page }) => {
    await addBlock(page, "todo");
    await fillBlock(blocks(page, "todo").first(), "Offen");
    await addBlock(page, "todo");
    const done = blocks(page, "todo").nth(1);
    await fillBlock(done, "Erledigt");
    await done.locator(".block__checkbox").check();

    await selectViewMode(page, "todos-open");
    await expect(app(page)).toHaveClass(/app--todos-open/);

    const open = blocks(page, "todo").first();
    await expectBlockRowVisible(open, true);
    await expect(blockInput(open)).toHaveValue("Offen");
    await expectBlockRowVisible(blocks(page, "todo").nth(1), false);
  });

  test("Done zeigt nur erledigte To-dos", async ({ page }) => {
    await addBlock(page, "todo");
    await fillBlock(blocks(page, "todo").first(), "Offen");
    await addBlock(page, "todo");
    const done = blocks(page, "todo").nth(1);
    await fillBlock(done, "Erledigt");
    await done.locator(".block__checkbox").check();

    await selectViewMode(page, "todos-done");
    await expect(app(page)).toHaveClass(/app--todos-done/);

    await expectBlockRowVisible(blocks(page, "todo").first(), false);
    await expectBlockRowVisible(done, true);
    await expect(blockInput(done)).toHaveValue("Erledigt");
  });

  test("Open und Done filtern verschachtelte To-dos", async ({ page }) => {
    await addBlock(page, "text");
    await fillBlock(blocks(page, "text").first(), "Projekt");
    await addBlock(page, "todo");
    await fillBlock(blocks(page, "todo").first(), "Verschachtelt offen");
    await pressInBlock(blocks(page, "todo").first(), "Tab");

    const parent = blocks(page, "text").first();
    const nestedOpen = nestedBlocks(parent, "todo").first();
    await pressInBlock(nestedOpen, "Enter");

    const nestedDone = nestedBlocks(parent, "todo").nth(1);
    await fillBlock(nestedDone, "Verschachtelt erledigt");
    await nestedDone.locator(".block__checkbox").check();

    await selectViewMode(page, "todos-open");
    await expectBlockRowVisible(nestedOpen, true);
    await expectBlockRowVisible(nestedDone, false);

    await selectViewMode(page, "todos-done");
    await expectBlockRowVisible(nestedOpen, false);
    await expectBlockRowVisible(nestedDone, true);
  });
});
