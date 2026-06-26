import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type SearchModalContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const SearchModalContext = createContext<SearchModalContextValue | null>(null);

function isTextEntryTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;

  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") {
    return !target.classList.contains("block__input");
  }

  return false;
}

export function SearchModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTextEntryTarget(event.target)) return;

      const mod = event.metaKey || event.ctrlKey;
      if (!mod || event.key.toLowerCase() !== "k") return;

      event.preventDefault();
      setIsOpen(true);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const value = useMemo(() => ({ isOpen, open, close }), [close, isOpen, open]);

  return (
    <SearchModalContext.Provider value={value}>
      {children}
    </SearchModalContext.Provider>
  );
}

export function useSearchModal(): SearchModalContextValue {
  const value = useContext(SearchModalContext);
  if (!value) {
    throw new Error("useSearchModal must be used within SearchModalProvider");
  }
  return value;
}

export function isSearchModalOpen(): boolean {
  return document.querySelector(".search-modal--open") !== null;
}
