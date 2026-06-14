import type { BlockContentProps } from "../../types/ui";
import { useChangeBlockTitle } from "../../features/blocks/mutations/useChangeBlockTitle";
import { useChangeBlockType } from "../../features/blocks/mutations/useChangeBlockType";
import { usePasteBlockImage } from "../../features/blocks/mutations/usePasteBlockImage";
import { BlockInput } from "./BlockInput";

export function BulletBlock(props: BlockContentProps) {
  const changeTitle = useChangeBlockTitle();
  const changeType = useChangeBlockType();
  const pasteImage = usePasteBlockImage();

  const demoteToText = () => {
    void changeType.mutateAsync({ blockId: props.blockId, type: "text" });
  };

  return (
    <>
      <span className="block__bullet" aria-hidden="true">
        •
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
