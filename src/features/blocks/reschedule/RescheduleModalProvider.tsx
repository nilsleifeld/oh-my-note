import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useBlockNavigation } from "../navigation/BlockNavigationProvider";
import {
  isBlockEditTarget,
  isTextEntryTarget,
} from "../navigation/blockNavigationUtils";

type RescheduleModalContextValue = {
  isOpen: boolean;
  blockId: string | null;
  openForBlock: (blockId: string) => void;
  close: () => void;
};

const RescheduleModalContext =
  createContext<RescheduleModalContextValue | null>(null);

function isPopoverOpen(): boolean {
  return document.querySelector(".popover--open") !== null;
}

function isSearchModalOpen(): boolean {
  return document.querySelector("dialog.search-modal[open]") !== null;
}

export function RescheduleModalProvider({ children }: { children: ReactNode }) {
  const { selectedBlockId } = useBlockNavigation();
  const [isOpen, setIsOpen] = useState(false);
  const [blockId, setBlockId] = useState<string | null>(null);

  const openForBlock = useCallback((nextBlockId: string) => {
    setBlockId(nextBlockId);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setBlockId(null);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isOpen) return;

      const target = event.target;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isBlockEditTarget(target)) return;
      if (isTextEntryTarget(target) || isPopoverOpen() || isSearchModalOpen()) {
        return;
      }
      if (event.key.toLowerCase() !== "w") return;
      if (!selectedBlockId) return;

      event.preventDefault();
      openForBlock(selectedBlockId);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, openForBlock, selectedBlockId]);

  const value = useMemo(
    () => ({ isOpen, blockId, openForBlock, close }),
    [blockId, close, isOpen, openForBlock],
  );

  return (
    <RescheduleModalContext.Provider value={value}>
      {children}
    </RescheduleModalContext.Provider>
  );
}

export function useRescheduleModal(): RescheduleModalContextValue {
  const value = useContext(RescheduleModalContext);
  if (!value) {
    throw new Error(
      "useRescheduleModal must be used within RescheduleModalProvider",
    );
  }
  return value;
}

export function isRescheduleModalOpen(): boolean {
  return document.querySelector("dialog.reschedule-modal[open]") !== null;
}
