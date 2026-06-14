import { useEffect, useRef, useState } from "react";
import type { BlockContentProps } from "../../types/ui";
import { blockPlaceholders, codeLanguages } from "../../data/blocks";
import { useChangeBlockLanguage } from "../../features/blocks/mutations/useChangeBlockLanguage";
import { useChangeBlockTitle } from "../../features/blocks/mutations/useChangeBlockTitle";
import { usePasteBlockImage } from "../../features/blocks/mutations/usePasteBlockImage";
import { readImageFromPasteEvent } from "../../utils/clipboardImage";
import { syncCodeHighlight } from "../../utils/highlight";
import { Select } from "../ui/Select";
import { focusInput, onTabIndentOutdent, resizeTextarea } from "./utils";

export function CodeBlock(props: BlockContentProps) {
  const changeTitle = useChangeBlockTitle();
  const changeLanguage = useChangeBlockLanguage();
  const pasteImage = usePasteBlockImage();
  const [title, setTitle] = useState(props.block.properties.title);
  const titleOnFocusRef = useRef(props.block.properties.title);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const codeRef = useRef<HTMLElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    setTitle(props.block.properties.title);
  }, [props.block.id, props.block.properties.title]);

  const syncEditor = () => {
    const textarea = textareaRef.current;
    const codeEl = codeRef.current;
    const preEl = preRef.current;
    if (!textarea || !codeEl || !preEl) return;
    syncCodeHighlight(textarea, codeEl, props.block.properties.language ?? "");
    resizeTextarea(textarea);
    preEl.style.height = `${textarea.offsetHeight}px`;
  };

  useEffect(() => {
    syncEditor();
    const el = textareaRef.current;
    if (el) focusInput(el, props.shouldFocus, props.onFocused);
  }, [
    props.block.id,
    props.block.properties.language,
    props.onFocused,
    props.shouldFocus,
    title,
  ]);

  const saveTitle = (next: string) => {
    if (next === titleOnFocusRef.current) return;
    void changeTitle.mutateAsync({
      blockId: props.blockId,
      title: next,
      previousTitle: titleOnFocusRef.current,
    });
    titleOnFocusRef.current = next;
  };

  const saveLanguage = (language: string) => {
    const previousLanguage = props.block.properties.language ?? "";
    if (language === previousLanguage) return;
    void changeLanguage.mutateAsync({
      blockId: props.blockId,
      language,
      previousLanguage,
    });
  };

  return (
    <div className="block__code">
      <Select
        className="block__code-lang"
        title="Language"
        searchable
        searchPlaceholder="Search language…"
        options={codeLanguages}
        value={props.block.properties.language ?? ""}
        onChange={(language) => {
          saveLanguage(language);
          requestAnimationFrame(syncEditor);
        }}
      />
      <div className="block__code-editor">
        <pre ref={preRef} className="block__code-highlight" aria-hidden="true">
          <code ref={codeRef} />
        </pre>
        <textarea
          ref={textareaRef}
          className="block__input block__input--multiline block__input--code"
          rows={1}
          spellCheck={false}
          value={title}
          placeholder={blockPlaceholders.code}
          onFocus={() => {
            titleOnFocusRef.current = props.block.properties.title;
          }}
          onChange={(e) => {
            setTitle(e.target.value);
            syncEditor();
          }}
          onBlur={(e) => saveTitle(e.target.value)}
          onPaste={async (e) => {
            const dataUrl = await readImageFromPasteEvent(e);
            if (!dataUrl) return;
            e.preventDefault();
            void pasteImage.mutateAsync({
              blockId: props.blockId,
              imageData: dataUrl,
            });
          }}
          onKeyDown={(e) => {
            onTabIndentOutdent(e, props.onIndent, props.onOutdent);
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              saveTitle(e.currentTarget.value);
              props.onEnter();
            }
            if (e.key === "Backspace" && e.currentTarget.value === "") {
              e.preventDefault();
              props.onBackspaceEmpty();
            }
          }}
        />
      </div>
    </div>
  );
}
