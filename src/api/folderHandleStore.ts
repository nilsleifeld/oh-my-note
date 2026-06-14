export async function ensureFolderPermission(
  handle: FileSystemDirectoryHandle,
  mode: FileSystemPermissionMode = "readwrite",
): Promise<boolean> {
  if ((await handle.queryPermission({ mode })) === "granted") {
    return true;
  }

  return (await handle.requestPermission({ mode })) === "granted";
}

export function isFolderPickerSupported(): boolean {
  return typeof window.showDirectoryPicker === "function";
}
