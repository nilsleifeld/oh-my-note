import type { Block } from "./models";

export type DragState = {
  draggingId: string | null;
  overId: string | null;
};

export type BlockRowProps = {
  blockId: string;
  date: string;
  rootKey: string;
  rootIds: string[];
  dragState: DragState;
  pendingContent?: (parentId: string) => string[] | undefined;
  onDragStart: (id: string) => void;
  onDragOver: (id: string) => void;
  onDrop: (id: string) => void;
  onDragEnd: () => void;
  focusId: string | null;
  onFocused: () => void;
  onRequestFocus: (blockId: string) => void;
  onAddBelow: (type: Block["type"], afterId: string) => void;
  onIndent: (id: string) => void;
  onOutdent: (id: string) => void;
};

export type BlockContentProps = {
  blockId: string;
  block: Block;
  onEnter: () => void;
  onBackspaceEmpty: () => void;
  onIndent: () => void;
  onOutdent: () => void;
  shouldFocus: boolean;
  onFocused: () => void;
  onRequestFocus: (blockId: string) => void;
};

export type SelectOption = {
  value: string;
  label: string;
};

export type PopoverControls = {
  open: () => boolean;
  toggle: () => void;
  close: () => void;
};
