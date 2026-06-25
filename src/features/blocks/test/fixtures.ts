import type { Block } from "../../../types/models";
import { sortKeysBetween } from "../../../utils/sortKey";

export const DATE = "2025-06-13";

const ROOT_KEYS = sortKeysBetween(null, null, 3);
const A_CHILD_KEYS = sortKeysBetween(null, null, 2);
const B_CHILD_KEYS = sortKeysBetween(null, null, 1);
const C_CHILD_KEYS = sortKeysBetween(null, null, 1);

export function makeBlock(
  overrides: Omit<Partial<Block>, "properties"> &
    Pick<Block, "id"> & { properties?: Partial<Block["properties"]> },
): Block {
  const { properties: propOverrides, ...rest } = overrides;
  return {
    type: "text",
    parentId: null,
    day: DATE,
    createdAt: `${DATE}T12:00:00.000Z`,
    sortKey: sortKeysBetween(null, null, 1)[0],
    properties: {
      title: "",
      checked: false,
      language: "",
      imageData: "",
      open: true,
      ...propOverrides,
    },
    comments: [],
    ...rest,
  };
}

export function sampleTreeBlocks(): Block[] {
  const a = makeBlock({
    id: "a",
    createdAt: `${DATE}T10:00:00.000Z`,
    sortKey: ROOT_KEYS[0],
    properties: { title: "A", checked: false, language: "" },
  });
  const b = makeBlock({
    id: "b",
    createdAt: `${DATE}T11:00:00.000Z`,
    sortKey: ROOT_KEYS[1],
    properties: { title: "B", checked: false, language: "" },
  });
  const c = makeBlock({
    id: "c",
    type: "todo",
    parentId: "a",
    createdAt: `${DATE}T10:30:00.000Z`,
    sortKey: A_CHILD_KEYS[0],
    properties: { title: "C", checked: true, language: "" },
  });
  const d = makeBlock({
    id: "d",
    type: "code",
    parentId: "b",
    createdAt: `${DATE}T11:30:00.000Z`,
    sortKey: B_CHILD_KEYS[0],
    properties: { title: "D", checked: false, language: "javascript" },
  });

  return [a, b, c, d];
}

export function deepTreeBlocks(): Block[] {
  const f = makeBlock({
    id: "f",
    parentId: "c",
    createdAt: `${DATE}T10:45:00.000Z`,
    sortKey: C_CHILD_KEYS[0],
    properties: { title: "F", checked: false, language: "" },
  });
  const c = makeBlock({
    id: "c",
    parentId: "a",
    createdAt: `${DATE}T10:30:00.000Z`,
    sortKey: A_CHILD_KEYS[0],
    properties: { title: "C", checked: false, language: "" },
  });
  const e = makeBlock({
    id: "e",
    parentId: "a",
    createdAt: `${DATE}T10:40:00.000Z`,
    sortKey: A_CHILD_KEYS[1],
    properties: { title: "E", checked: false, language: "" },
  });
  const a = makeBlock({
    id: "a",
    createdAt: `${DATE}T10:00:00.000Z`,
    sortKey: ROOT_KEYS[0],
    properties: { title: "A", checked: false, language: "" },
  });
  const d = makeBlock({
    id: "d",
    parentId: "b",
    createdAt: `${DATE}T11:30:00.000Z`,
    sortKey: B_CHILD_KEYS[0],
    properties: { title: "D", checked: false, language: "" },
  });
  const b = makeBlock({
    id: "b",
    createdAt: `${DATE}T11:00:00.000Z`,
    sortKey: ROOT_KEYS[1],
    properties: { title: "B", checked: false, language: "" },
  });
  const g = makeBlock({
    id: "g",
    createdAt: `${DATE}T12:00:00.000Z`,
    sortKey: ROOT_KEYS[2],
    properties: { title: "G", checked: false, language: "" },
  });

  return [a, b, c, d, e, f, g];
}

export function deepRootIds(): string[] {
  return ["a", "b", "g"];
}
