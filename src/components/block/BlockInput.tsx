import { useEffect, useRef, useState } from "react";
import type { Block } from "../../types/models";
import { blockPlaceholders } from "../../data/blocks";
import { readImageFromPasteEvent } from "../../utils/clipboardImage";
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
  onSaveTitle,
  onPasteImage,
  onTitleInput,
}: BlockInputProps) {
  const [title, setTitle] = useState(block.properties.title);
  const titleOnFocusRef = useRef(block.properties.title);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setTitle(block.properties.title);
  }, [block.id, block.properties.title]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    if (multiline && el instanceof HTMLTextAreaElement) {
      resizeTextarea(el);
    }
    focusInput(el, shouldFocus, onFocused);
  }, [block.id, multiline, onFocused, shouldFocus]);

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

  const commonProps = {
    className: inputClass,
    value: title,
    placeholder: blockPlaceholders[block.type],
    onFocus: () => {
      titleOnFocusRef.current = block.properties.title;
    },
    onPaste,
    onKeyDown: (e: React.KeyboardEvent) => {
      onTabIndentOutdent(e, onIndent, onOutdent);
    },
  };

  if (multiline) {
    return (
      <textarea
        {...commonProps}
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        rows={1}
        onChange={(e) => {
          const next = updateTitle(e.target.value);
          setTitle(next);
          resizeTextarea(e.target);
        }}
        onBlur={(e) => saveTitle(e.target.value)}
        onKeyDown={(e) => {
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
    );
  }

  return (
    <input
      {...commonProps}
      ref={inputRef as React.RefObject<HTMLInputElement>}
      type="text"
      onChange={(e) => setTitle(updateTitle(e.target.value))}
      onBlur={(e) => saveTitle(e.target.value)}
      onKeyDown={(e) => {
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
  );
}
