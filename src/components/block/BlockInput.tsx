import { useEffect, useRef, useState } from "react";
import type { Block } from "../../types/models";
import { useBlockTypeSlashMenu } from "../../features/blocks/useBlockTypeSlashMenu";
import { readImageFromPasteEvent } from "../../utils/clipboardImage";
import { BlockTypeSlashMenu } from "./BlockTypeSlashMenu";
import { useBlockNavigation } from "../../features/blocks/navigation/BlockNavigationProvider";
import { focusInput, onTabIndentOutdent, resizeTextarea } from "./utils";

type BlockInputProps = {
  block: Block;
  multiline: boolean;
  inputClass: string;
  onEnter: () => void;
  onBackspaceEmpty: () => void;
  onBackspaceAtStart?: () => void;
  onIndent: () => void;
  onOutdent: () => void;
  shouldFocus: boolean;
  onFocused: () => void;
  onRequestFocus?: (blockId: string) => void;
  onSaveTitle: (title: string, previousTitle: string) => void;
  onPasteImage?: (imageData: string) => void;
  onTitleInput?: (value: string) => string;
};

export function BlockInput({
  block,
  multiline,
  inputClass,
  onEnter,
  onBackspaceEmpty,
  onBackspaceAtStart,
  onIndent,
  onOutdent,
  shouldFocus,
  onFocused,
  onRequestFocus,
  onSaveTitle,
  onPasteImage,
  onTitleInput,
}: BlockInputProps) {
  const { notifyBlockInputFocus } = useBlockNavigation();
  const [title, setTitle] = useState(block.properties.title);
  const titleOnFocusRef = useRef(block.properties.title);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const slashMenu = useBlockTypeSlashMenu(block.id, block.type, onRequestFocus);

  useEffect(() => {
    setTitle(block.properties.title);
    slashMenu.syncFromTitle(block.properties.title);
  }, [block.id, block.properties.title, slashMenu.syncFromTitle]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    if (multiline && el instanceof HTMLTextAreaElement) {
      resizeTextarea(el);
    }
    focusInput(el, shouldFocus, onFocused);
  }, [block.id, block.type, multiline, onFocused, shouldFocus]);

  const saveTitle = (next: string) => {
    if (next === titleOnFocusRef.current) return;
    onSaveTitle(next, titleOnFocusRef.current);
    titleOnFocusRef.current = next;
  };

  const onPaste = async (e: React.ClipboardEvent) => {
    if (!onPasteImage) return;
    const dataUrl = await readImageFromPasteEvent(e);
    if (!dataUrl) return;
    e.preventDefault();
    onPasteImage(dataUrl);
  };

  const updateTitle = (value: string) =>
    onTitleInput ? onTitleInput(value) : value;

  const onTitleChange = (value: string) => {
    const next = updateTitle(value);
    setTitle(next);
    slashMenu.syncFromTitle(next);
    return next;
  };

  const commonProps = {
    className: inputClass,
    value: title,
    onFocus: () => {
      titleOnFocusRef.current = block.properties.title;
      notifyBlockInputFocus(block.id);
    },
    onPaste,
    onKeyDown: (e: React.KeyboardEvent) => {
      onTabIndentOutdent(e, onIndent, onOutdent);
    },
  };

  const slashMenuPanel = (
    <BlockTypeSlashMenu
      open={slashMenu.open}
      filtered={slashMenu.filtered}
      highlight={slashMenu.highlight}
      currentType={slashMenu.currentType}
      listRef={slashMenu.listRef}
      onHighlight={slashMenu.setHighlight}
      onSelect={slashMenu.selectType}
    />
  );

  if (multiline) {
    return (
      <div className="block-input-wrap">
        <textarea
          {...commonProps}
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          rows={1}
          onChange={(e) => {
            onTitleChange(e.target.value);
            resizeTextarea(e.target);
          }}
          onBlur={(e) => saveTitle(e.target.value)}
          onKeyDown={(e) => {
            if (slashMenu.handleKeyDown(e)) return;
            commonProps.onKeyDown(e);
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              saveTitle(e.currentTarget.value);
              onEnter();
            }
            if (e.key === "Backspace") {
              const el = e.currentTarget;
              const atStart = el.selectionStart === 0 && el.selectionEnd === 0;
              if (atStart && el.value !== "" && onBackspaceAtStart) {
                e.preventDefault();
                onBackspaceAtStart();
                return;
              }
              if (el.value === "") {
                e.preventDefault();
                onBackspaceEmpty();
              }
            }
          }}
        />
        {slashMenuPanel}
      </div>
    );
  }

  return (
    <div className="block-input-wrap">
      <input
        {...commonProps}
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        onChange={(e) => onTitleChange(e.target.value)}
        onBlur={(e) => saveTitle(e.target.value)}
        onKeyDown={(e) => {
          if (slashMenu.handleKeyDown(e)) return;
          commonProps.onKeyDown(e);
          if (e.key === "Enter") {
            e.preventDefault();
            saveTitle(e.currentTarget.value);
            onEnter();
          }
          if (e.key === "Backspace") {
            const el = e.currentTarget;
            const atStart = el.selectionStart === 0 && el.selectionEnd === 0;
            if (atStart && el.value !== "" && onBackspaceAtStart) {
              e.preventDefault();
              onBackspaceAtStart();
              return;
            }
            if (el.value === "") {
              e.preventDefault();
              onBackspaceEmpty();
            }
          }
        }}
      />
      {slashMenuPanel}
    </div>
  );
}
