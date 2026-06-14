import type { ApiClient } from "../types/models";
import { FolderApiClient } from "./folderClient";
import { MockApiClient } from "./mockClient";

export type ApiClientKind = "mock" | "folder";

let client: ApiClient | null = null;

function resolveApiClientKind(): ApiClientKind {
  const value = import.meta.env.VITE_API_CLIENT;
  if (value === "mock") return "mock";
  return "folder";
}

const apiClientKind = resolveApiClientKind();

export function setApiClient(instance: ApiClient): void {
  client = instance;
}

export function clearApiClient(): void {
  if (apiClientKind === "folder") {
    client = null;
  }
}

/** Returns the shared API client singleton. */
export function getApiClient(): ApiClient {
  if (!client) {
    throw new Error(
      apiClientKind === "folder"
        ? "API client not initialized. Select a notes folder first."
        : "API client not initialized.",
    );
  }
  return client;
}

export function isApiClientInitialized(): boolean {
  return client !== null;
}

export function getApiClientKind(): ApiClientKind {
  return apiClientKind;
}

export function createFolderApiClient(
  handle: FileSystemDirectoryHandle,
): FolderApiClient {
  return new FolderApiClient(handle);
}

if (apiClientKind === "mock") {
  const mockClient = new MockApiClient();
  setApiClient(mockClient);

  if (typeof window !== "undefined" && navigator.webdriver) {
    window.__omnE2e = {
      getBlocks: () => mockClient.getBlocksSnapshot(),
    };
  }
}
