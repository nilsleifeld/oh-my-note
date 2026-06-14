function readFileAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function readImageFromFile(file: Blob): Promise<string> {
  return readFileAsDataUrl(file);
}

export async function readImageFromPasteEvent(
  e: React.ClipboardEvent | ClipboardEvent,
): Promise<string | null> {
  const items = e.clipboardData?.items;
  if (!items) return null;

  for (const item of items) {
    if (!item.type.startsWith("image/")) continue;
    const file = item.getAsFile();
    if (!file) continue;
    return readFileAsDataUrl(file);
  }

  return null;
}
