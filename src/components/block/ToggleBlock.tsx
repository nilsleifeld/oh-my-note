import type { BlockContentProps } from "../../types/ui";
import { useChangeBlockTitle } from "../../features/blocks/mutations/useChangeBlockTitle";
import { usePasteBlockImage } from "../../features/blocks/mutations/usePasteBlockImage";
import { useToggleBlockOpen } from "../../features/blocks/mutations/useToggleBlockOpen";
import { BlockInput } from "./BlockInput";
import { onTabIndentOutdent } from "./utils";

export function ToggleBlock(props: BlockContentProps) {
  const changeTitle = useChangeBlockTitle();
  const pasteImage = usePasteBlockImage();
  const toggleOpen = useToggleBlockOpen();
  const open = props.block.properties.open;

  return (
    <>
      <button
        className={[
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
        <span className="block__toggle-icon" aria-hidden="true">
          ▾
        </span>
      </button>
      <BlockInput
        block={props.block}
        multiline={false}
        inputClass="block__input"
        onEnter={props.onEnter}
        onBackspaceEmpty={props.onBackspaceEmpty}
        onIndent={props.onIndent}
        onOutdent={props.onOutdent}
        shouldFocus={props.shouldFocus}
        onFocused={props.onFocused}
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
