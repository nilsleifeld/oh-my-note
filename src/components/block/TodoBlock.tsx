import type { BlockContentProps } from "../../types/ui";
import { useChangeBlockTitle } from "../../features/blocks/mutations/useChangeBlockTitle";
import { useChangeBlockType } from "../../features/blocks/mutations/useChangeBlockType";
import { usePasteBlockImage } from "../../features/blocks/mutations/usePasteBlockImage";
import { useToggleTodo } from "../../features/blocks/mutations/useToggleTodo";
import { useBlockTitleShortcuts } from "../../features/blocks/useBlockTitleShortcuts";
import { BlockInput } from "./BlockInput";
import { onTabIndentOutdent } from "./utils";

export function TodoBlock(props: BlockContentProps) {
  const changeTitle = useChangeBlockTitle();
  const changeType = useChangeBlockType();
  const pasteImage = usePasteBlockImage();
  const toggleTodo = useToggleTodo();
  const onTitleInput = useBlockTitleShortcuts(
    props.blockId,
    props.onRequestFocus,
  );

  const demoteToText = () => {
    void changeType.mutateAsync({ blockId: props.blockId, type: "text" });
  };

  return (
    <>
      <span className="block__marker block__marker--checkbox">
        <input
          className="block__checkbox"
          type="checkbox"
          checked={props.block.properties.checked}
          onKeyDown={(e) =>
            onTabIndentOutdent(e, props.onIndent, props.onOutdent)
          }
          onChange={(e) => {
            void toggleTodo.mutateAsync({
              blockId: props.blockId,
              checked: e.target.checked,
            });
          }}
        />
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
