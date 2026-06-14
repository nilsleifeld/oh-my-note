import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { DragState } from "../../../types/ui";

type DragContextValue = DragState & {
  getDraggingId: () => string | null;
  getOverId: () => string | null;
  onDragStart: (id: string) => void;
  onDragOver: (id: string) => void;
  onDragEnd: () => void;
};

const DragContext = createContext<DragContextValue | null>(null);

export function DragProvider({ children }: { children: ReactNode }) {
  const draggingIdRef = useRef<string | null>(null);
  const overIdRef = useRef<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const onDragStart = useCallback((id: string) => {
    draggingIdRef.current = id;
    overIdRef.current = null;
    setDraggingId(id);
    setOverId(null);
  }, []);

  const onDragOver = useCallback((id: string) => {
    if (draggingIdRef.current && draggingIdRef.current !== id) {
      overIdRef.current = id;
      setOverId(id);
    }
  }, []);

  const onDragEnd = useCallback(() => {
    draggingIdRef.current = null;
    overIdRef.current = null;
    setDraggingId(null);
    setOverId(null);
  }, []);

  const getDraggingId = useCallback(() => draggingIdRef.current, []);
  const getOverId = useCallback(() => overIdRef.current, []);

  const value = useMemo(
    () => ({
      draggingId,
      overId,
      getDraggingId,
      getOverId,
      onDragStart,
      onDragOver,
      onDragEnd,
    }),
    [
      draggingId,
      getDraggingId,
      getOverId,
      onDragEnd,
      onDragOver,
      onDragStart,
      overId,
    ],
  );

  return <DragContext.Provider value={value}>{children}</DragContext.Provider>;
}

export function useDrag(): DragContextValue {
  const ctx = useContext(DragContext);
  if (!ctx) {
    throw new Error("useDrag must be used within DragProvider");
  }
  return ctx;
}
