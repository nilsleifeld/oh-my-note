import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./features/app/ThemeProvider";
import { ViewModeProvider, useViewMode } from "./features/app/ViewModeProvider";
import { BlockHistoryProvider } from "./features/blocks/history/BlockHistoryProvider";
import { FolderProvider } from "./features/folder/FolderProvider";
import { BlockNavigationProvider } from "./features/blocks/navigation/BlockNavigationProvider";
import { DragProvider } from "./features/blocks/drag/DragProvider";
import { App } from "./components/App";
import { AppFooter } from "./components/AppFooter";
import { AppHeader } from "./components/AppHeader";
import { SearchModal } from "./components/search/SearchModal";
import { RescheduleModal } from "./components/reschedule/RescheduleModal";
import { FeedJumpProvider } from "./features/search/FeedJumpProvider";
import { SearchModalProvider } from "./features/search/SearchModalProvider";
import { RescheduleModalProvider } from "./features/blocks/reschedule/RescheduleModalProvider";
import "./css/main.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      retry: false,
    },
  },
});

function AppShell() {
  const { appViewClassName } = useViewMode();

  return (
    <FeedJumpProvider>
      <SearchModalProvider>
        <RescheduleModalProvider>
          <div className={appViewClassName}>
            <AppHeader />
            <App />
            <AppFooter />
            <SearchModal />
            <RescheduleModal />
          </div>
        </RescheduleModalProvider>
      </SearchModalProvider>
    </FeedJumpProvider>
  );
}

const root = document.getElementById("app");
if (!root) {
  throw new Error("App element not found");
}

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ViewModeProvider>
          <BlockHistoryProvider>
            <DragProvider>
              <BlockNavigationProvider>
                <div className="app-layout">
                  <FolderProvider>
                    <AppShell />
                  </FolderProvider>
                </div>
              </BlockNavigationProvider>
            </DragProvider>
          </BlockHistoryProvider>
        </ViewModeProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
