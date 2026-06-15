import type { Block } from "../../../types/models";

export const DATE = "2025-06-13";

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
    content: [],
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
    content: ["c"],
    properties: { title: "A", checked: false, language: "" },
  });
  const b = makeBlock({
    id: "b",
    createdAt: `${DATE}T11:00:00.000Z`,
    content: ["d"],
    properties: { title: "B", checked: false, language: "" },
  });
  const c = makeBlock({
    id: "c",
    type: "todo",
    parentId: "a",
    createdAt: `${DATE}T10:30:00.000Z`,
    properties: { title: "C", checked: true, language: "" },
  });
  const d = makeBlock({
    id: "d",
    type: "code",
    parentId: "b",
    createdAt: `${DATE}T11:30:00.000Z`,
    properties: { title: "D", checked: false, language: "javascript" },
  });

  return [a, b, c, d];
}

export function deepTreeBlocks(): Block[] {
  const f = makeBlock({
    id: "f",
    parentId: "c",
    createdAt: `${DATE}T10:45:00.000Z`,
    properties: { title: "F", checked: false, language: "" },
  });
  const c = makeBlock({
    id: "c",
    parentId: "a",
    createdAt: `${DATE}T10:30:00.000Z`,
    content: ["f"],
    properties: { title: "C", checked: false, language: "" },
  });
  const e = makeBlock({
    id: "e",
    parentId: "a",
    createdAt: `${DATE}T10:40:00.000Z`,
    properties: { title: "E", checked: false, language: "" },
  });
  const a = makeBlock({
    id: "a",
    createdAt: `${DATE}T10:00:00.000Z`,
    content: ["c", "e"],
    properties: { title: "A", checked: false, language: "" },
  });
  const d = makeBlock({
    id: "d",
    parentId: "b",
    createdAt: `${DATE}T11:30:00.000Z`,
    properties: { title: "D", checked: false, language: "" },
  });
  const b = makeBlock({
    id: "b",
    createdAt: `${DATE}T11:00:00.000Z`,
    content: ["d"],
    properties: { title: "B", checked: false, language: "" },
  });
  const g = makeBlock({
    id: "g",
    createdAt: `${DATE}T12:00:00.000Z`,
    properties: { title: "G", checked: false, language: "" },
  });

  return [a, b, c, d, e, f, g];
}

export function deepRootIds(): string[] {
  return ["a", "b", "g"];
}
