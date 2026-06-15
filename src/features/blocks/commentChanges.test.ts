import { describe, expect, it } from "vitest";
import {
  buildAddCommentChange,
  buildDeleteCommentChange,
  buildUpdateCommentChange,
} from "./changes/buildBlockChanges";
import {
  applyChangeToState,
  createEmptyCacheState,
  getBlockFromState,
  rollbackChangeInState,
  setBlocksInState,
} from "./cache/blockCacheState";
import { makeBlock } from "./test/fixtures";

describe("block comment changes", () => {
  it("adds, updates, and deletes comments", () => {
    const block = makeBlock({ id: "a", properties: { title: "Note" } });
    let state = setBlocksInState(createEmptyCacheState(), [block]);

    const comment = {
      id: "c1",
      text: "First comment",
      createdAt: "2025-06-13T12:00:00.000Z",
    };

    state = applyChangeToState(state, buildAddCommentChange(block, comment));
    expect(getBlockFromState(state, "a")?.comments).toEqual([comment]);

    state = applyChangeToState(
      state,
      buildUpdateCommentChange(getBlockFromState(state, "a")!, "c1", "Updated"),
    );
    expect(getBlockFromState(state, "a")?.comments[0]?.text).toBe("Updated");

    const deleteChange = buildDeleteCommentChange(
      getBlockFromState(state, "a")!,
      "c1",
    );
    state = applyChangeToState(state, deleteChange);
    expect(getBlockFromState(state, "a")?.comments).toEqual([]);

    state = rollbackChangeInState(state, deleteChange);
    expect(getBlockFromState(state, "a")?.comments[0]?.text).toBe("Updated");
  });
});
