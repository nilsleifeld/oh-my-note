import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { BlockChange } from "../../../types/models";
import {
  applyChangeToCache,
  persistChange,
  persistUndo,
  rollbackChange,
} from "../cache/blockCache";

const MAX_HISTORY = 100;

type BlockHistoryContextValue = {
  canUndo: boolean;
  canRedo: boolean;
  busy: boolean;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  pushHistory: (change: BlockChange) => void;
  resetHistory: () => void;
  isApplyingHistory: () => boolean;
};

const BlockHistoryContext = createContext<BlockHistoryContextValue | null>(
  null,
);

let applyingHistory = false;

export function BlockHistoryProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [undoStack, setUndoStack] = useState<BlockChange[]>([]);
  const [redoStack, setRedoStack] = useState<BlockChange[]>([]);
  const [busy, setBusy] = useState(false);

  const pushHistory = useCallback((change: BlockChange) => {
    if (applyingHistory) return;
    setUndoStack((stack) => {
      const next = [...stack, change];
      if (next.length > MAX_HISTORY) {
        next.splice(0, next.length - MAX_HISTORY);
      }
      return next;
    });
    setRedoStack([]);
  }, []);

  const resetHistory = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  const undo = useCallback(async () => {
    if (busy || undoStack.length === 0) return;

    const change = undoStack.at(-1);
    if (!change) return;

    setBusy(true);
    applyingHistory = true;

    try {
      rollbackChange(queryClient, change);
      await persistUndo(change);
      setUndoStack((stack) => stack.slice(0, -1));
      setRedoStack((stack) => [...stack, change]);
    } catch (error) {
      applyChangeToCache(queryClient, change);
      throw error;
    } finally {
      applyingHistory = false;
      setBusy(false);
    }
  }, [busy, queryClient, undoStack]);

  const redo = useCallback(async () => {
    if (busy || redoStack.length === 0) return;

    const change = redoStack.at(-1);
    if (!change) return;

    setBusy(true);
    applyingHistory = true;

    try {
      applyChangeToCache(queryClient, change);
      await persistChange(change);
      setRedoStack((stack) => stack.slice(0, -1));
      setUndoStack((stack) => [...stack, change]);
    } catch (error) {
      rollbackChange(queryClient, change);
      throw error;
    } finally {
      applyingHistory = false;
      setBusy(false);
    }
  }, [busy, queryClient, redoStack]);

  const value = useMemo(
    () => ({
      canUndo: undoStack.length > 0,
      canRedo: redoStack.length > 0,
      busy,
      undo,
      redo,
      pushHistory,
      resetHistory,
      isApplyingHistory: () => applyingHistory,
    }),
    [
      busy,
      pushHistory,
      redo,
      redoStack.length,
      resetHistory,
      undo,
      undoStack.length,
    ],
  );

  return (
    <BlockHistoryContext.Provider value={value}>
      {children}
    </BlockHistoryContext.Provider>
  );
}

export function useBlockHistory(): BlockHistoryContextValue {
  const ctx = useContext(BlockHistoryContext);
  if (!ctx) {
    throw new Error("useBlockHistory must be used within BlockHistoryProvider");
  }
  return ctx;
}
