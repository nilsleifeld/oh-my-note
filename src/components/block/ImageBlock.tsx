import { useEffect, useRef } from "react";
import type { BlockContentProps } from "../../types/ui";
import { useBlockNavigation } from "../../features/blocks/navigation/BlockNavigationProvider";
import { usePasteBlockImage } from "../../features/blocks/mutations/usePasteBlockImage";
import {
  readImageFromFile,
  readImageFromPasteEvent,
} from "../../utils/clipboardImage";
import { focusInput } from "./utils";

export function ImageBlock(props: BlockContentProps) {
  const { notifyBlockInputFocus } = useBlockNavigation();
  const pasteImage = usePasteBlockImage();
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveImage = (imageData: string) => {
    void pasteImage.mutateAsync({ blockId: props.blockId, imageData });
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    void readImageFromFile(file).then(saveImage);
  };

  useEffect(() => {
    const el = containerRef.current;
    if (el) focusInput(el, props.shouldFocus, props.onFocused);
  }, [props.blockId, props.onFocused, props.shouldFocus]);

  return (
    <div
      ref={containerRef}
      className="block__image"
      tabIndex={0}
      onFocus={() => {
        notifyBlockInputFocus(props.blockId);
        const el = containerRef.current;
        if (el) focusInput(el, props.shouldFocus, props.onFocused);
      }}
      onPaste={async (e) => {
        const dataUrl = await readImageFromPasteEvent(e);
        if (!dataUrl) return;
        e.preventDefault();
        saveImage(dataUrl);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          props.onEnter();
        }
        if (e.key === "Backspace" && !props.block.properties.imageData) {
          e.preventDefault();
          props.onBackspaceEmpty();
        }
      }}
    >
      {props.block.properties.imageData ? (
        <img
          className="block__image-img"
          src={props.block.properties.imageData}
          alt=""
          draggable={false}
        />
      ) : (
        <div className="block__image-placeholder">
          <p className="block__image-placeholder-hint">Paste image (⌘V)</p>
          <button
            type="button"
            className="block__image-pick"
            onClick={() => fileInputRef.current?.click()}
          >
            Choose image
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="block__image-file-input"
            onChange={onFileChange}
          />
        </div>
      )}
    </div>
  );
}
