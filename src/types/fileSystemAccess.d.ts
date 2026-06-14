export {};

declare global {
  type FileSystemPermissionMode = "read" | "readwrite";

  interface FileSystemHandlePermissionDescriptor {
    mode?: FileSystemPermissionMode;
  }

  interface FileSystemCreateWritableOptions {
    keepExistingData?: boolean;
  }

  interface FileSystemGetFileOptions {
    create?: boolean;
  }

  interface FileSystemRemoveOptions {
    recursive?: boolean;
  }

  interface FileSystemDirectoryHandle {
    readonly name: string;
    queryPermission(
      descriptor?: FileSystemHandlePermissionDescriptor,
    ): Promise<PermissionState>;
    requestPermission(
      descriptor?: FileSystemHandlePermissionDescriptor,
    ): Promise<PermissionState>;
    values(): AsyncIterableIterator<FileSystemHandle>;
    getFileHandle(
      name: string,
      options?: FileSystemGetFileOptions,
    ): Promise<FileSystemFileHandle>;
    removeEntry(name: string, options?: FileSystemRemoveOptions): Promise<void>;
  }

  interface FileSystemFileHandle {
    createWritable(
      options?: FileSystemCreateWritableOptions,
    ): Promise<FileSystemWritableFileStream>;
    getFile(): Promise<File>;
  }

  interface Window {
    showDirectoryPicker(options?: {
      id?: string;
      mode?: FileSystemPermissionMode;
      startIn?:
        | FileSystemHandle
        | "desktop"
        | "documents"
        | "downloads"
        | "music"
        | "pictures"
        | "videos";
    }): Promise<FileSystemDirectoryHandle>;
  }
}
