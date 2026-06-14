# oh-my-note

A personal daily notes app for **fleeting notes** — quick thoughts you want to jot down without building a permanent knowledge base. Open the app, write, move on. Older days stay in the feed but naturally fade into the background as you scroll.

Built with React and Vite. Notes are stored as plain JSON files in a local folder on your machine — no account, no cloud, no server.

## Why I built this

Most note apps assume you want to keep, organize, and revisit everything forever. I don't. I wanted something lightweight for thoughts that are useful in the moment but not worth curating long-term: reminders, half-formed ideas, quick todos, snippets I might need later today but probably not next month.

The workflow is simple: capture fast, browse by day, let the past scroll away.

## Inspirations

Two ideas shaped the design:

### Block-based content (Notion)

Everything in oh-my-note is a **block** — text, headings, todos, code, images. Each block has an ID, a type, properties, and a list of child block IDs. Blocks can be nested and reordered.

This follows the same core idea as [Notion's block model](https://www.notion.com/blog/data-model-behind-notion): information as small, composable units rather than monolithic documents. Changing a block's type doesn't throw away its content — properties are stored independently from rendering.

### Daily journal feed (Logseq)

Days are not separate pages you navigate to. They load **one after another** in a single scrollable feed — today at the top, yesterday below, and so on. Infinite scroll loads older days as you go down.

This mirrors the daily journal experience in [Logseq](https://logseq.com/): a continuous timeline of days rather than a folder of documents.

## How it works

### Daily feed

The main view is a reverse-chronological feed of day sections. Each section shows all blocks for that date. Scroll down to load more past days automatically.

### Blocks

Supported block types:

| Type      | Description                                  |
| --------- | -------------------------------------------- |
| `text`    | Plain text                                   |
| `h1`–`h5` | Headings                                     |
| `todo`    | Checkbox item                                |
| `code`    | Syntax-highlighted code (multiple languages) |
| `image`   | Inline image (paste or drop)                 |

Blocks form a tree via `parentId` and `content` arrays. You can indent blocks, drag and drop to reorder, change types, and undo/redo edits.

### View modes

Switch between a **notes** view (all blocks per day) and a **todos** view that aggregates open todo items across days.

### Storage

In folder mode, the app uses the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API) to read and write a local directory you choose. Each day is one JSON file:

```
notes/
  2026-06-14.json
  2026-06-13.json
  ...
```

File format:

```json
{
  "version": 1,
  "day": "2026-06-14",
  "blocks": [ ... ]
}
```

Your data stays on disk. The browser remembers the folder handle between sessions.

## Tech stack

- **React 19** + **TypeScript** (strict)
- **Vite** for dev and build
- **TanStack Query** for data fetching, caching, and optimistic updates
- **Vitest** for unit tests, **Playwright** for e2e tests
- **CSS** with BEM naming and design tokens (`src/css/token.css`)

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Open the app, pick a notes folder, and start writing.

For development without a folder, set `VITE_API_CLIENT=mock` in `.env` to use an in-memory client with optional seed data.

## Configuration

| Variable          | Values                     | Description                       |
| ----------------- | -------------------------- | --------------------------------- |
| `VITE_API_CLIENT` | `folder` (default), `mock` | Storage backend                   |
| `VITE_SEED`       | `true`                     | Preload sample blocks (mock only) |

## Scripts

| Command             | Description                                          |
| ------------------- | ---------------------------------------------------- |
| `npm run dev`       | Start dev server                                     |
| `npm run build`     | Typecheck + production build                         |
| `npm run preview`   | Preview production build                             |
| `npm run test`      | Full test suite (typecheck, lint, format, unit, e2e) |
| `npm run test:unit` | Unit tests only                                      |
| `npm run test:e2e`  | E2e tests only                                       |

## Browser support

Folder mode requires a browser with File System Access API support (Chrome or Edge). Mock mode works in any modern browser.

## Project structure

```
src/
  api/           # API clients (folder, mock)
  components/    # React UI
  css/           # Styles and design tokens
  data/          # Block constants and factories
  features/      # Domain logic (queries, mutations, providers)
  lib/query/     # TanStack Query keys
  types/         # Shared TypeScript types
```
