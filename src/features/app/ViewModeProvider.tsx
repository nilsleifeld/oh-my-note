import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ViewMode = "notes" | "todos" | "todos-open" | "todos-done";

type ViewModeContextValue = {
  mode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isTodoViewMode: boolean;
  appViewClassName: string;
};

const ViewModeContext = createContext<ViewModeContextValue | null>(null);

export function isTodoViewMode(mode: ViewMode): boolean {
  return mode !== "notes";
}

export function getAppViewClassName(mode: ViewMode): string {
  switch (mode) {
    case "todos":
      return "app app--todos";
    case "todos-open":
      return "app app--todos app--todos-open";
    case "todos-done":
      return "app app--todos app--todos-done";
    default:
      return "app";
  }
}

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ViewMode>("notes");

  const value = useMemo(
    () => ({
      mode,
      setViewMode: setMode,
      isTodoViewMode: isTodoViewMode(mode),
      appViewClassName: getAppViewClassName(mode),
    }),
    [mode],
  );

  return (
    <ViewModeContext.Provider value={value}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode(): ViewModeContextValue {
  const ctx = useContext(ViewModeContext);
  if (!ctx) {
    throw new Error("useViewMode must be used within ViewModeProvider");
  }
  return ctx;
}
