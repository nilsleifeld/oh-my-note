import type { Block, BlockType } from "../types/models";
import type { SelectOption } from "../types/ui";

export const headingBlockTypes: BlockType[] = ["h1", "h2", "h3", "h4", "h5"];

export function isHeadingBlockType(type: BlockType): boolean {
  return headingBlockTypes.includes(type);
}

export const blockPlaceholders: Record<Block["type"], string> = {
  text: "Empty text block",
  bullet: "Bullet",
  todo: "To-do",
  toggle: "Toggle",
  code: "Code",
  image: "Image",
  h1: "Heading 1",
  h2: "Heading 2",
  h3: "Heading 3",
  h4: "Heading 4",
  h5: "Heading 5",
};

export const blockTypeOptions: SelectOption[] = [
  { value: "h1", label: "Heading 1" },
  { value: "h2", label: "Heading 2" },
  { value: "h3", label: "Heading 3" },
  { value: "h4", label: "Heading 4" },
  { value: "h5", label: "Heading 5" },
  { value: "text", label: "Text" },
  { value: "bullet", label: "Bullet" },
  { value: "todo", label: "To-do" },
  { value: "toggle", label: "Toggle" },
  { value: "code", label: "Code" },
  { value: "image", label: "Image" },
];

export const codeLanguages: SelectOption[] = [
  { value: "", label: "Plain Text" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "json", label: "JSON" },
  { value: "sql", label: "SQL" },
  { value: "bash", label: "Bash" },
  { value: "yaml", label: "YAML" },
  { value: "markdown", label: "Markdown" },
];

export function createChildBlock(
  type: BlockType,
  opts: { parentId: string | null; day: string; createdAt: string },
): Block {
  return {
    id: crypto.randomUUID(),
    type,
    parentId: opts.parentId,
    day: opts.day,
    createdAt: opts.createdAt,
    content: [],
    properties: {
      title: "",
      checked: false,
      language: "",
      imageData: "",
      open: true,
    },
  };
}
