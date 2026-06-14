import type { BlockContentProps } from "../../types/ui";
import { useChangeBlockTitle } from "../../features/blocks/mutations/useChangeBlockTitle";
import { useChangeBlockType } from "../../features/blocks/mutations/useChangeBlockType";
import { usePasteBlockImage } from "../../features/blocks/mutations/usePasteBlockImage";
import { useBlockTitleShortcuts } from "../../features/blocks/useBlockTitleShortcuts";
import { BlockInput } from "./BlockInput";

function BulletIcon() {
  return (
    <svg
      className="block__bullet-icon"
      viewBox="0 0 6 6"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="3" cy="3" r="3" />
    </svg>
  );
}

export function BulletBlock(props: BlockContentProps) {
  const changeTitle = useChangeBlockTitle();
  const changeType = useChangeBlockType();
  const pasteImage = usePasteBlockImage();
  const onTitleInput = useBlockTitleShortcuts(
    props.blockId,
    props.onRequestFocus,
  );

  const demoteToText = () => {
    void changeType.mutateAsync({ blockId: props.blockId, type: "text" });
  };

  return (
    <>
      <span className="block__marker block__bullet" aria-hidden="true">
        <BulletIcon />
      </span>
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
