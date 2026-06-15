/** Domain models shared across API, cache, and UI. */

export type BlockType =
  | "todo"
  | "text"
  | "bullet"
  | "code"
  | "image"
  | "toggle"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5";

export type BlockProperties = {
  title: string;
  checked: boolean;
  language: string;
  /** Base64 data URL, e.g. `data:image/png;base64,...` */
  imageData: string;
  /** Whether child blocks are expanded in the UI */
  open: boolean;
};

export type BlockComment = {
  id: string;
  text: string;
  /** ISO timestamp */
  createdAt: string;
};

export type Block = {
  id: string;
  type: BlockType;
  parentId: string | null;
  /** YYYY-MM-DD — day section this block belongs to */
  day: string;
  /** ISO timestamp — ordering within a day */
  createdAt: string;
  /** Child block IDs (tree structure) */
  content: string[];
  properties: BlockProperties;
  comments: BlockComment[];
};

export type BlockSortField = "createdAt";

export type BlockSortBy = {
  field: BlockSortField;
  order: "asc" | "desc";
};

export type BlockFilter = {
  type?: BlockType;
  parentId?: string | null;
  /** YYYY-MM-DD */
  day?: string;
  properties?: Partial<BlockProperties>;
  page?: number;
  pageSize?: number;
  sortBy?: BlockSortBy;
};

export type DayDatesFilter = {
  page?: number;
  pageSize?: number;
};

export type PagedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export type ApiClient = {
  getBlock(id: string): Promise<Block | undefined>;
  getBlocks(filter?: BlockFilter): Promise<PagedResult<Block>>;
  getDayDates(filter?: DayDatesFilter): Promise<PagedResult<string>>;
  saveBlocks(blocks: Block[]): Promise<void>;
  deleteBlocks(ids: string[]): Promise<void>;
};

/** Optimistic mutation payload — snapshot enables rollback on error. */
export type BlockChange = {
  snapshot: Block[];
  updates: Block[];
  createdIds?: string[];
  deletedIds?: string[];
};

export type ParentInfo = {
  /** `null` when the block is a day root */
  parent: Block | null;
  index: number;
};
