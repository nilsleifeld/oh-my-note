import type { BlockContentProps } from "../../types/ui";
import { useChangeBlockTitle } from "../../features/blocks/mutations/useChangeBlockTitle";
import { usePasteBlockImage } from "../../features/blocks/mutations/usePasteBlockImage";
import { useBlockTitleShortcuts } from "../../features/blocks/useBlockTitleShortcuts";
import { BlockInput } from "./BlockInput";

export function HeadingBlock(props: BlockContentProps) {
  const changeTitle = useChangeBlockTitle();
  const pasteImage = usePasteBlockImage();
  const onTitleInput = useBlockTitleShortcuts(
    props.blockId,
    props.onRequestFocus,
  );

  return (
    <BlockInput
      block={props.block}
      multiline={false}
      inputClass="block__input block__input--heading"
      onEnter={props.onEnter}
      onBackspaceEmpty={props.onBackspaceEmpty}
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
  );
}
