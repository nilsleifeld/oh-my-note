import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  clearApiClient,
  createFolderApiClient,
  getApiClientKind,
  setApiClient,
} from "../../api/client";
import {
  ensureFolderPermission,
  isFolderPickerSupported,
} from "../../api/folderHandleStore";
import { FolderGate } from "../../components/FolderGate";
import { useBlockHistory } from "../blocks/history/BlockHistoryProvider";

type FolderStatus = "needs-folder" | "ready" | "unsupported" | "error";

type FolderContextValue = {
  folderName: string | null;
  changeFolder: () => Promise<void>;
  closeFolder: () => Promise<void>;
};

const FolderContext = createContext<FolderContextValue | null>(null);

function resolveInitialStatus(skipFolderGate: boolean): FolderStatus {
  if (skipFolderGate) return "ready";
  if (!isFolderPickerSupported()) return "unsupported";
  return "needs-folder";
}

async function connectFolder(handle: FileSystemDirectoryHandle) {
  const allowed = await ensureFolderPermission(handle);
  if (!allowed) {
    throw new Error("Folder permission was not granted.");
  }

  const client = createFolderApiClient(handle);
  await client.waitUntilReady();
  setApiClient(client);
  return client;
}

export function FolderProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { resetHistory } = useBlockHistory();
  const clientKind = getApiClientKind();
  const skipFolderGate = clientKind === "mock";
  const [status, setStatus] = useState<FolderStatus>(() =>
    resolveInitialStatus(skipFolderGate),
  );
  const [folderName, setFolderName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activateFolder = useCallback(
    async (handle: FileSystemDirectoryHandle) => {
      const client = await connectFolder(handle);
      setFolderName(client.folderName);
      setError(null);
      setStatus("ready");
      resetHistory();
      await queryClient.resetQueries();
    },
    [queryClient, resetHistory],
  );

  const pickFolder = useCallback(async () => {
    if (!isFolderPickerSupported()) {
      setStatus("unsupported");
      return;
    }

    try {
      const handle = await window.showDirectoryPicker({ mode: "readwrite" });
      await activateFolder(handle);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      setError(
        error instanceof Error ? error.message : "Could not open folder.",
      );
      setStatus("error");
    }
  }, [activateFolder]);

  const changeFolder = useCallback(async () => {
    await pickFolder();
  }, [pickFolder]);

  const closeFolder = useCallback(async () => {
    setStatus("needs-folder");
    setFolderName(null);
    setError(null);
    clearApiClient();
    resetHistory();
    await queryClient.resetQueries();
  }, [queryClient, resetHistory]);

  const value = useMemo(
    () => ({
      folderName,
      changeFolder,
      closeFolder,
    }),
    [changeFolder, closeFolder, folderName],
  );

  if (skipFolderGate) {
    return (
      <FolderContext.Provider value={value}>{children}</FolderContext.Provider>
    );
  }

  if (status === "needs-folder") {
    return <FolderGate state="pick" onSelectFolder={() => void pickFolder()} />;
  }

  if (status === "unsupported") {
    return (
      <FolderGate
        state="unsupported"
        onSelectFolder={() => void pickFolder()}
      />
    );
  }

  if (status === "error") {
    return (
      <FolderGate
        state="error"
        message={error ?? undefined}
        onSelectFolder={() => void pickFolder()}
      />
    );
  }

  return (
    <FolderContext.Provider value={value}>{children}</FolderContext.Provider>
  );
}

export function useNotesFolder(): FolderContextValue {
  const ctx = useContext(FolderContext);
  if (!ctx) {
    throw new Error("useNotesFolder must be used within FolderProvider");
  }
  return ctx;
}
