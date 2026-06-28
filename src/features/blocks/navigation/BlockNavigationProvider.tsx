import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useBlockHistory } from "../history/BlockHistoryProvider";
import { deleteBlockByNavigation } from "./deleteBlockByNavigation";
import {
  insertBlockAboveByNavigation,
  insertBlockBelowByNavigation,
} from "./insertBlockByNavigation";
import { getBlock } from "../cache/blockCache";
import {
  focusBlockEditTarget,
  getBlockBelow,
  getBlockIdFromElement,
  getFirstNavigableBlockId,
  getLastNavigableBlockId,
  isBlockEditTarget,
  isTextEntryTarget,
  moveBlockSelection,
  scrollBlockIntoView,
} from "./blockNavigationUtils";
import { hasBlockClipboard } from "./blockClipboard";
import { indentBlockByNavigation } from "./indentBlockByNavigation";
import { outdentBlockByNavigation } from "./outdentBlockByNavigation";
import { pasteBlockByNavigation } from "./pasteBlockByNavigation";
import {
  toggleBlockOpenByNavigation,
  toggleTodoByNavigation,
} from "./toggleBlockByNavigation";
import { yankBlockByNavigation } from "./yankBlockByNavigation";

type BlockNavigationContextValue = {
  selectedBlockId: string | null;
  focusId: string | null;
  isNavSelected: (blockId: string) => boolean;
  requestFocus: (blockId: string) => void;
  clearFocusRequest: () => void;
  notifyBlockInputFocus: (blockId: string) => void;
  exitInputMode: () => void;
  navigateToBlock: (blockId: string) => void;
  selectBlockFromPointer: (
    blockId: string,
    options?: { edit?: boolean; position?: "start" | "end" },
  ) => void;
};

const BlockNavigationContext =
  createContext<BlockNavigationContextValue | null>(null);

function isSlashMenuOpen(): boolean {
  return document.querySelector(".block-slash-menu") !== null;
}

function isPopoverOpen(): boolean {
  return document.querySelector(".popover--open") !== null;
}

function isSearchModalOpen(): boolean {
  return document.querySelector("dialog.search-modal[open]") !== null;
}

function isRescheduleModalOpen(): boolean {
  return document.querySelector("dialog.reschedule-modal[open]") !== null;
}

const CHORD_PREFIX_TIMEOUT_MS = 1000;

function isInteractiveBlockTarget(target: HTMLElement): boolean {
  return !!target.closest(
    ".block__handle, .block__type-select, .block__comments-btn, .select, .block__checkbox, .block__toggle, .block__image-pick, .block-slash-menu, input[type=file]",
  );
}

function isBlockEditSurface(target: HTMLElement): boolean {
  return (
    target.classList.contains("block__input") ||
    target.classList.contains("block__image")
  );
}

export function BlockNavigationProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { pushHistory, isApplyingHistory, undo, redo } = useBlockHistory();
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState(false);
  const pendingZeroRef = useRef(false);
  const pendingZeroTimeoutRef = useRef<number | null>(null);
  const pendingDeleteRef = useRef(false);
  const pendingDeleteTimeoutRef = useRef<number | null>(null);
  const pendingGRef = useRef(false);
  const pendingGTimeoutRef = useRef<number | null>(null);
  const pendingYRef = useRef(false);
  const pendingYTimeoutRef = useRef<number | null>(null);

  const clearPendingZero = useCallback(() => {
    pendingZeroRef.current = false;
    if (pendingZeroTimeoutRef.current !== null) {
      window.clearTimeout(pendingZeroTimeoutRef.current);
      pendingZeroTimeoutRef.current = null;
    }
  }, []);

  const clearPendingDelete = useCallback(() => {
    pendingDeleteRef.current = false;
    if (pendingDeleteTimeoutRef.current !== null) {
      window.clearTimeout(pendingDeleteTimeoutRef.current);
      pendingDeleteTimeoutRef.current = null;
    }
  }, []);

  const clearPendingG = useCallback(() => {
    pendingGRef.current = false;
    if (pendingGTimeoutRef.current !== null) {
      window.clearTimeout(pendingGTimeoutRef.current);
      pendingGTimeoutRef.current = null;
    }
  }, []);

  const clearPendingY = useCallback(() => {
    pendingYRef.current = false;
    if (pendingYTimeoutRef.current !== null) {
      window.clearTimeout(pendingYTimeoutRef.current);
      pendingYTimeoutRef.current = null;
    }
  }, []);

  const clearPendingChords = useCallback(() => {
    clearPendingZero();
    clearPendingDelete();
    clearPendingG();
    clearPendingY();
  }, [clearPendingDelete, clearPendingG, clearPendingY, clearPendingZero]);

  const armPendingZero = useCallback(() => {
    clearPendingChords();
    pendingZeroRef.current = true;
    pendingZeroTimeoutRef.current = window.setTimeout(() => {
      pendingZeroRef.current = false;
      pendingZeroTimeoutRef.current = null;
    }, CHORD_PREFIX_TIMEOUT_MS);
  }, [clearPendingChords]);

  const armPendingDelete = useCallback(() => {
    clearPendingChords();
    pendingDeleteRef.current = true;
    pendingDeleteTimeoutRef.current = window.setTimeout(() => {
      pendingDeleteRef.current = false;
      pendingDeleteTimeoutRef.current = null;
    }, CHORD_PREFIX_TIMEOUT_MS);
  }, [clearPendingChords]);

  const armPendingG = useCallback(() => {
    clearPendingChords();
    pendingGRef.current = true;
    pendingGTimeoutRef.current = window.setTimeout(() => {
      pendingGRef.current = false;
      pendingGTimeoutRef.current = null;
    }, CHORD_PREFIX_TIMEOUT_MS);
  }, [clearPendingChords]);

  const armPendingY = useCallback(() => {
    clearPendingChords();
    pendingYRef.current = true;
    pendingYTimeoutRef.current = window.setTimeout(() => {
      pendingYRef.current = false;
      pendingYTimeoutRef.current = null;
    }, CHORD_PREFIX_TIMEOUT_MS);
  }, [clearPendingChords]);

  const requestFocus = useCallback((blockId: string) => {
    setSelectedBlockId(blockId);
    setFocusId(blockId);
  }, []);

  const clearFocusRequest = useCallback(() => {
    setFocusId(null);
  }, []);

  const notifyBlockInputFocus = useCallback((blockId: string) => {
    setSelectedBlockId(blockId);
    setInputMode(true);
  }, []);

  const exitInputMode = useCallback(() => {
    setInputMode(false);
    const active = document.activeElement;
    if (active instanceof HTMLElement && isBlockEditTarget(active)) {
      active.blur();
    }
  }, []);

  const selectBlock = useCallback((blockId: string | null) => {
    setSelectedBlockId(blockId);
    setInputMode(false);
    if (blockId) scrollBlockIntoView(blockId);
  }, []);

  const selectBlockFromPointer = useCallback(
    (
      blockId: string,
      options: { edit?: boolean; position?: "start" | "end" } = {},
    ) => {
      const { edit = true, position = "end" } = options;
      clearPendingChords();
      setSelectedBlockId(blockId);
      setInputMode(edit);
      if (edit) {
        requestAnimationFrame(() => focusBlockEditTarget(blockId, position));
      }
    },
    [clearPendingChords],
  );

  const deleteSelectedBlock = useCallback(async () => {
    if (!selectedBlockId) return;

    const blockId = selectedBlockId;
    const focusTarget = getBlockBelow(blockId);

    await yankBlockByNavigation(queryClient, blockId);

    const change = await deleteBlockByNavigation(queryClient, blockId);
    if (!change) return;

    if (!isApplyingHistory()) {
      pushHistory(change);
    }

    selectBlock(focusTarget);
  }, [
    isApplyingHistory,
    pushHistory,
    queryClient,
    selectBlock,
    selectedBlockId,
  ]);

  const enterInputMode = useCallback(
    (position: "start" | "end" = "end") => {
      if (!selectedBlockId) return;
      setInputMode(true);
      focusBlockEditTarget(selectedBlockId, position);
    },
    [selectedBlockId],
  );

  const insertBlockBelow = useCallback(async () => {
    if (!selectedBlockId) return;

    const result = await insertBlockBelowByNavigation(
      queryClient,
      selectedBlockId,
    );
    if (!result) return;

    if (!isApplyingHistory()) {
      pushHistory(result.change);
    }

    requestFocus(result.newBlockId);
  }, [
    isApplyingHistory,
    pushHistory,
    queryClient,
    requestFocus,
    selectedBlockId,
  ]);

  const insertBlockAbove = useCallback(async () => {
    if (!selectedBlockId) return;

    const result = await insertBlockAboveByNavigation(
      queryClient,
      selectedBlockId,
    );
    if (!result) return;

    if (!isApplyingHistory()) {
      pushHistory(result.change);
    }

    requestFocus(result.newBlockId);
  }, [
    isApplyingHistory,
    pushHistory,
    queryClient,
    requestFocus,
    selectedBlockId,
  ]);

  const indentSelectedBlock = useCallback(async () => {
    if (!selectedBlockId) return;

    const change = await indentBlockByNavigation(queryClient, selectedBlockId);
    if (!change) return;

    if (!isApplyingHistory()) {
      pushHistory(change);
    }

    selectBlock(selectedBlockId);
  }, [
    isApplyingHistory,
    pushHistory,
    queryClient,
    selectBlock,
    selectedBlockId,
  ]);

  const outdentSelectedBlock = useCallback(async () => {
    if (!selectedBlockId) return;

    const change = await outdentBlockByNavigation(queryClient, selectedBlockId);
    if (!change) return;

    if (!isApplyingHistory()) {
      pushHistory(change);
    }

    selectBlock(selectedBlockId);
  }, [
    isApplyingHistory,
    pushHistory,
    queryClient,
    selectBlock,
    selectedBlockId,
  ]);

  const toggleSelectedBlock = useCallback(async () => {
    if (!selectedBlockId) return;

    const block = getBlock(queryClient, selectedBlockId);
    if (!block) return;

    let change = null;
    if (block.type === "todo") {
      change = await toggleTodoByNavigation(queryClient, selectedBlockId);
    } else if (block.type === "toggle") {
      change = await toggleBlockOpenByNavigation(queryClient, selectedBlockId);
    }
    if (!change) return;

    if (!isApplyingHistory()) {
      pushHistory(change);
    }

    selectBlock(selectedBlockId);
  }, [
    isApplyingHistory,
    pushHistory,
    queryClient,
    selectBlock,
    selectedBlockId,
  ]);

  const yankSelectedBlock = useCallback(async () => {
    if (!selectedBlockId) return;
    await yankBlockByNavigation(queryClient, selectedBlockId);
  }, [queryClient, selectedBlockId]);

  const pasteAfterSelectedBlock = useCallback(async () => {
    if (!selectedBlockId || !hasBlockClipboard()) return;

    const result = await pasteBlockByNavigation(queryClient, selectedBlockId);
    if (!result) return;

    if (!isApplyingHistory()) {
      pushHistory(result.change);
    }

    selectBlock(result.newRootId);
  }, [
    isApplyingHistory,
    pushHistory,
    queryClient,
    selectBlock,
    selectedBlockId,
  ]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;

      if (
        event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        event.key.toLowerCase() === "r"
      ) {
        if (isBlockEditTarget(target)) return;
        if (
          isTextEntryTarget(target) ||
          isPopoverOpen() ||
          isSearchModalOpen() ||
          isRescheduleModalOpen()
        )
          return;

        event.preventDefault();
        clearPendingChords();
        void redo();
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (isBlockEditTarget(target)) {
        if (event.key === "Escape" && !isSlashMenuOpen()) {
          event.preventDefault();
          exitInputMode();
        }
        return;
      }

      if (
        isTextEntryTarget(target) ||
        isPopoverOpen() ||
        isSearchModalOpen() ||
        isRescheduleModalOpen()
      )
        return;

      if (event.key === "Tab") {
        event.preventDefault();
        clearPendingChords();
        if (!selectedBlockId) return;
        if (event.shiftKey) {
          void outdentSelectedBlock();
        } else {
          void indentSelectedBlock();
        }
        return;
      }

      if (event.key === " " || event.key === "Enter") {
        if (!selectedBlockId) return;
        const block = getBlock(queryClient, selectedBlockId);
        if (block?.type !== "todo" && block?.type !== "toggle") return;

        event.preventDefault();
        clearPendingChords();
        void toggleSelectedBlock();
        return;
      }

      if (event.key === "g") {
        event.preventDefault();
        if (pendingGRef.current) {
          clearPendingChords();
          selectBlock(getFirstNavigableBlockId());
          return;
        }
        armPendingG();
        return;
      }

      if (event.key === "G") {
        event.preventDefault();
        clearPendingChords();
        selectBlock(getLastNavigableBlockId());
        return;
      }

      if (event.key === "y") {
        event.preventDefault();
        if (pendingYRef.current) {
          clearPendingChords();
          if (selectedBlockId) void yankSelectedBlock();
          return;
        }
        armPendingY();
        return;
      }

      if (event.key === "p") {
        event.preventDefault();
        clearPendingChords();
        if (selectedBlockId) void pasteAfterSelectedBlock();
        return;
      }

      if (event.key === "0") {
        event.preventDefault();
        armPendingZero();
        return;
      }

      if (event.key === "j") {
        event.preventDefault();
        clearPendingChords();
        selectBlock(moveBlockSelection(selectedBlockId, 1));
        return;
      }

      if (event.key === "k") {
        event.preventDefault();
        clearPendingChords();
        selectBlock(moveBlockSelection(selectedBlockId, -1));
        return;
      }

      if (event.key === "d") {
        event.preventDefault();
        if (pendingDeleteRef.current) {
          clearPendingChords();
          if (selectedBlockId) void deleteSelectedBlock();
          return;
        }
        armPendingDelete();
        return;
      }

      if (event.key === "i") {
        event.preventDefault();
        clearPendingChords();
        enterInputMode("start");
        return;
      }

      if (event.key === "a") {
        event.preventDefault();
        clearPendingChords();
        enterInputMode("end");
        return;
      }

      if (event.key === "o") {
        event.preventDefault();
        clearPendingChords();
        if (selectedBlockId) void insertBlockBelow();
        return;
      }

      if (event.key === "O") {
        event.preventDefault();
        clearPendingChords();
        if (selectedBlockId) void insertBlockAbove();
        return;
      }

      if (event.key === "u") {
        event.preventDefault();
        clearPendingChords();
        void undo();
        return;
      }

      clearPendingChords();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      clearPendingChords();
    };
  }, [
    armPendingDelete,
    armPendingG,
    armPendingY,
    armPendingZero,
    clearPendingChords,
    deleteSelectedBlock,
    enterInputMode,
    exitInputMode,
    indentSelectedBlock,
    insertBlockAbove,
    insertBlockBelow,
    outdentSelectedBlock,
    pasteAfterSelectedBlock,
    queryClient,
    selectBlock,
    selectedBlockId,
    toggleSelectedBlock,
    undo,
    redo,
    yankSelectedBlock,
  ]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;

      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (
        target.closest(".app-header, .app-footer, .popover, dialog.modal[open]")
      )
        return;
      if (isTextEntryTarget(target)) return;

      const blockId = getBlockIdFromElement(target);
      if (!blockId) return;
      if (isInteractiveBlockTarget(target)) return;

      if (isBlockEditSurface(target)) {
        clearPendingChords();
        setSelectedBlockId(blockId);
        setInputMode(true);
        return;
      }

      event.preventDefault();
      selectBlockFromPointer(blockId);
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", onPointerDown, true);
  }, [clearPendingChords, selectBlockFromPointer]);

  const value = useMemo(
    () => ({
      selectedBlockId,
      focusId,
      isNavSelected: (blockId: string) =>
        selectedBlockId === blockId && !inputMode,
      requestFocus,
      clearFocusRequest,
      notifyBlockInputFocus,
      exitInputMode,
      navigateToBlock: selectBlock,
      selectBlockFromPointer,
    }),
    [
      clearFocusRequest,
      exitInputMode,
      focusId,
      notifyBlockInputFocus,
      requestFocus,
      inputMode,
      selectedBlockId,
      selectBlock,
      selectBlockFromPointer,
    ],
  );

  return (
    <BlockNavigationContext.Provider value={value}>
      {children}
    </BlockNavigationContext.Provider>
  );
}

export function useBlockNavigation(): BlockNavigationContextValue {
  const value = useContext(BlockNavigationContext);
  if (!value) {
    throw new Error(
      "useBlockNavigation must be used within BlockNavigationProvider",
    );
  }
  return value;
}
