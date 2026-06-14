import type { BlockContentProps } from "../../types/ui";
import { useChangeBlockTitle } from "../../features/blocks/mutations/useChangeBlockTitle";
import { useChangeBlockType } from "../../features/blocks/mutations/useChangeBlockType";
import { usePasteBlockImage } from "../../features/blocks/mutations/usePasteBlockImage";
import { useToggleBlockOpen } from "../../features/blocks/mutations/useToggleBlockOpen";
import { useBlockTitleShortcuts } from "../../features/blocks/useBlockTitleShortcuts";
import { BlockInput } from "./BlockInput";
import { onTabIndentOutdent } from "./utils";

function ToggleIcon() {
  return (
    <svg
      className="block__toggle-icon"
      viewBox="0 0 12 12"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M2.25 4.5 6 8.25 9.75 4.5Z" />
    </svg>
  );
}

export function ToggleBlock(props: BlockContentProps) {
  const changeTitle = useChangeBlockTitle();
  const changeType = useChangeBlockType();
  const pasteImage = usePasteBlockImage();
  const toggleOpen = useToggleBlockOpen();
  const onTitleInput = useBlockTitleShortcuts(
    props.blockId,
    props.onRequestFocus,
  );
  const open = props.block.properties.open;

  const demoteToText = () => {
    void changeType.mutateAsync({ blockId: props.blockId, type: "text" });
  };

  return (
    <>
      <button
        className={[
          "block__marker",
          "block__toggle",
          open ? "block__toggle--open" : "block__toggle--closed",
        ].join(" ")}
        type="button"
        title={open ? "Collapse" : "Expand"}
        aria-label={open ? "Collapse children" : "Expand children"}
        aria-expanded={open}
        onKeyDown={(e) =>
          onTabIndentOutdent(e, props.onIndent, props.onOutdent)
        }
        onClick={() => {
          void toggleOpen.mutateAsync({
            blockId: props.blockId,
            open: !open,
          });
        }}
      >
        <ToggleIcon />
      </button>
      <BlockInput
        block={props.block}
        multiline
        inputClass="block__input block__input--multiline"
        onEnter={props.onEnter}
        onBackspaceEmpty={demoteToText}
        onBackspaceAtStart={demoteToText}
        onIndent={props.onIndent}
        onOutdent={props.onOutdent}
        shouldFocus={props.shouldFocus}
        onFocused={props.onFocused}
        onRequestFocus={props.onRequestFocus}
        onTitleInput={onTitleInput}
        onSaveTitle={(title, previousTitle) => {
          void changeTitle.mutateAsync({
            blockId: props.blockId,
            title,
            previousTitle,
          });
        }}
        onPasteImage={(imageData) => {
          void pasteImage.mutateAsync({ blockId: props.blockId, imageData });
        }}
      />
    </>
  );
}
