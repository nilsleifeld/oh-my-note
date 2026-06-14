import { useEffect } from "react";
import { getApiClientKind } from "../api/client";
import { useViewMode, type ViewMode } from "../features/app/ViewModeProvider";
import { useTheme } from "../features/app/ThemeProvider";
import { useBlockHistory } from "../features/blocks/history/BlockHistoryProvider";
import { useNotesFolder } from "../features/folder/FolderProvider";

function UndoIcon() {
  return (
    <svg
      className="app-header__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 7H5v4" />
      <path d="M5 11c1.5-3 4.5-5 8-5 4.4 0 8 3.6 8 8s-3.6 8-8 8" />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg
      className="app-header__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 7h4v4" />
      <path d="M19 11c-1.5-3-4.5-5-8-5-4.4 0-8 3.6-8 8s3.6 8 8 8" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg
      className="app-header__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 20h16a1 1 0 0 0 1-1V7l-5-4H4a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1Z" />
      <path d="M9 7h6" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      className="app-header__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      className="app-header__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      className="app-header__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

function ViewButton({
  mode,
  label,
}: {
  mode: "notes" | "todos";
  label: string;
}) {
  const { mode: current, setViewMode, isTodoViewMode } = useViewMode();
  const isActive = mode === "notes" ? current === "notes" : isTodoViewMode;

  return (
    <button
      type="button"
      className={
        isActive
          ? "app-header__view-btn app-header__view-btn--active"
          : "app-header__view-btn"
      }
      aria-pressed={isActive}
      onClick={() => setViewMode(mode === "notes" ? "notes" : "todos")}
    >
      {label}
    </button>
  );
}

function TodoFilterButton({ mode, label }: { mode: ViewMode; label: string }) {
  const { mode: current, setViewMode } = useViewMode();

  return (
    <button
      type="button"
      className={
        current === mode
          ? "app-header__todo-filter-btn app-header__todo-filter-btn--active"
          : "app-header__todo-filter-btn"
      }
      aria-pressed={current === mode}
      onClick={() => setViewMode(mode)}
    >
      {label}
    </button>
  );
}

export function AppHeader() {
  const { isTodoViewMode } = useViewMode();
  const { isDark, toggleTheme } = useTheme();
  const { canUndo, canRedo, busy, undo, redo } = useBlockHistory();
  const { folderName, closeFolder } = useNotesFolder();
  const showFolder = getApiClientKind() === "folder";

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      const mod = event.metaKey || event.ctrlKey;
      if (!mod) return;

      const key = event.key.toLowerCase();
      if (key === "z" && !event.shiftKey) {
        event.preventDefault();
        void undo();
        return;
      }

      if ((key === "z" && event.shiftKey) || key === "y") {
        event.preventDefault();
        void redo();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [redo, undo]);

  return (
    <header className="app-header">
      <div className="app-header__inner">
        <nav className="app-header__view" aria-label="View">
          <div className="app-header__view-main">
            <ViewButton mode="notes" label="Notes" />
            <ViewButton mode="todos" label="Todos" />
          </div>
          <div
            className={
              isTodoViewMode
                ? "app-header__todo-filter"
                : "app-header__todo-filter app-header__todo-filter--hidden"
            }
            aria-hidden={!isTodoViewMode}
          >
            <TodoFilterButton mode="todos" label="All" />
            <TodoFilterButton mode="todos-open" label="Open" />
            <TodoFilterButton mode="todos-done" label="Done" />
          </div>
        </nav>
        <div className="app-header__right">
          {showFolder ? (
            <div className="app-header__folder-box">
              <div
                className="app-header__folder"
                title={`Notes folder: ${folderName ?? "unknown"}`}
              >
                <FolderIcon />
                <span className="app-header__folder-name">
                  {folderName ?? "Folder"}
                </span>
              </div>
              <div className="app-header__folder-divider" aria-hidden="true" />
              <button
                type="button"
                className="app-header__folder-close"
                title="Close folder"
                aria-label="Close folder"
                disabled={busy}
                onClick={() => void closeFolder()}
              >
                <CloseIcon />
              </button>
            </div>
          ) : null}
          <div className="app-header__actions">
            <button
              type="button"
              className="app-header__action"
              title="Undo"
              aria-label="Undo"
              disabled={busy || !canUndo}
              onClick={() => void undo()}
            >
              <UndoIcon />
            </button>
            <button
              type="button"
              className="app-header__action"
              title="Redo"
              aria-label="Redo"
              disabled={busy || !canRedo}
              onClick={() => void redo()}
            >
              <RedoIcon />
            </button>
          </div>
          <div className="app-header__theme">
            <button
              type="button"
              className="app-header__action"
              title={isDark ? "Light mode" : "Dark mode"}
              aria-label={
                isDark ? "Switch to light mode" : "Switch to dark mode"
              }
              onClick={toggleTheme}
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
