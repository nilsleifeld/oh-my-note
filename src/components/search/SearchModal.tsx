import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { blockTypeOptions } from "../../data/blocks";
import { useBlockNavigation } from "../../features/blocks/navigation/BlockNavigationProvider";
import { useFeedJump } from "../../features/search/FeedJumpProvider";
import { jumpToBlock } from "../../features/search/jumpToBlock";
import { useSearchModal } from "../../features/search/SearchModalProvider";
import { useBlockSearch } from "../../features/search/useBlockSearch";
import { formatDayShort } from "../../utils/date";
import { highlightMatches } from "../../utils/highlightMatches";
import { Modal } from "../ui/Modal";
import { SearchPreview } from "./SearchPreview";

type SearchMode = "insert" | "normal";

function blockTypeLabel(type: string): string {
  return (
    blockTypeOptions.find((option) => option.value === type)?.label ?? type
  );
}

function SearchGlyph() {
  return (
    <svg
      className="search-modal__search-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function SearchModal() {
  const { isOpen, close } = useSearchModal();
  const { getFeedController } = useFeedJump();
  const { navigateToBlock } = useBlockNavigation();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const [mode, setMode] = useState<SearchMode>("insert");
  const searchQuery = useBlockSearch(query, isOpen);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef(mode);

  const results = searchQuery.data?.items ?? [];
  const searchableCount = searchQuery.data?.searchableTotal ?? 0;
  const isLoading = searchQuery.isLoading;
  const isError = searchQuery.isError;
  const selected = results[highlight];

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const reset = useCallback(() => {
    setQuery("");
    setHighlight(0);
    setMode("insert");
  }, []);

  const handleClose = useCallback(() => {
    close();
    reset();
  }, [close, reset]);

  const scrollHighlight = useCallback(() => {
    listRef.current
      ?.querySelector(".search-modal__option--highlighted")
      ?.scrollIntoView({ block: "nearest" });
  }, []);

  const moveHighlight = useCallback(
    (delta: number) => {
      if (!results.length) {
        setHighlight(0);
        return;
      }
      setHighlight(
        (current) => (current + delta + results.length) % results.length,
      );
      requestAnimationFrame(scrollHighlight);
    },
    [results.length, scrollHighlight],
  );

  const confirmBlock = useCallback(
    async (blockId: string) => {
      handleClose();

      await jumpToBlock({
        queryClient,
        blockId,
        feedController: getFeedController(),
        navigateToBlock,
      });
    },
    [getFeedController, handleClose, navigateToBlock, queryClient],
  );

  const confirmSelection = useCallback(async () => {
    if (!selected) return;
    await confirmBlock(selected.block.id);
  }, [confirmBlock, selected]);

  useEffect(() => {
    if (!isOpen) return;
    reset();
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }, [isOpen, reset]);

  useEffect(() => {
    setHighlight(0);
  }, [query]);

  const onCancel = useCallback((event: Event) => {
    if (modeRef.current === "insert") {
      event.preventDefault();
      inputRef.current?.blur();
      setMode("normal");
      requestAnimationFrame(() => {
        panelRef.current?.focus();
      });
    }
  }, []);

  const onPanelKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    event.stopPropagation();

    if (mode === "insert") {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        moveHighlight(1);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        moveHighlight(-1);
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        void confirmSelection();
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        inputRef.current?.blur();
        setMode("normal");
        panelRef.current?.focus();
        return;
      }
      return;
    }

    if (event.key === "j") {
      event.preventDefault();
      moveHighlight(1);
      return;
    }
    if (event.key === "k") {
      event.preventDefault();
      moveHighlight(-1);
      return;
    }
    if (event.key === "i") {
      event.preventDefault();
      setMode("insert");
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      void confirmSelection();
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      ariaLabel="Search blocks"
      className="search-modal"
      panelClassName="modal__panel--wide"
      panelRef={panelRef}
      onCancel={onCancel}
      onKeyDown={onPanelKeyDown}
    >
      <div className="search-modal__search">
        <SearchGlyph />
        <input
          ref={inputRef}
          className="search-modal__input"
          type="search"
          value={query}
          placeholder="Search blocks…"
          aria-label="Search blocks"
          onFocus={() => setMode("insert")}
          onChange={(event) => setQuery(event.target.value)}
        />
        <span className="search-modal__count" aria-live="polite">
          {results.length} / {searchableCount}
        </span>
      </div>

      <div className="search-modal__layout">
        <div className="search-modal__results-wrap">
          {isLoading ? (
            <p className="search-modal__status">Searching…</p>
          ) : isError ? (
            <p className="search-modal__status search-modal__status--error">
              Could not load blocks.
            </p>
          ) : (
            <ul ref={listRef} className="search-modal__results" role="listbox">
              {!results.length ? (
                <li className="search-modal__empty">No matches</li>
              ) : (
                results.map((result, index) => {
                  const isHighlighted = index === highlight;
                  return (
                    <li
                      key={result.block.id}
                      className={
                        isHighlighted
                          ? "search-modal__option search-modal__option--highlighted"
                          : "search-modal__option"
                      }
                      role="option"
                      aria-selected={isHighlighted}
                      onMouseEnter={() => setHighlight(index)}
                      onClick={() => {
                        setHighlight(index);
                        void confirmBlock(result.block.id);
                      }}
                    >
                      <span className="search-modal__option-body">
                        <span className="search-modal__option-title">
                          {result.indices.length
                            ? highlightMatches(
                                result.block.properties.title,
                                result.indices,
                              )
                            : result.block.properties.title}
                        </span>
                        <span className="search-modal__option-meta">
                          {formatDayShort(result.block.day)} ·{" "}
                          {blockTypeLabel(result.block.type)}
                        </span>
                      </span>
                    </li>
                  );
                })
              )}
            </ul>
          )}
        </div>

        {selected ? (
          <SearchPreview
            day={selected.block.day}
            highlightBlockId={selected.block.id}
            matchIndices={selected.indices}
          />
        ) : (
          <div className="search-modal__preview search-modal__preview--empty">
            <div className="search-modal__preview-body search-modal__preview-body--empty">
              Select a result to preview
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
