import type { BlockContentProps } from "../../types/ui";
import { useChangeBlockTitle } from "../../features/blocks/mutations/useChangeBlockTitle";
import { usePasteBlockImage } from "../../features/blocks/mutations/usePasteBlockImage";
import { useToggleTodo } from "../../features/blocks/mutations/useToggleTodo";
import { BlockInput } from "./BlockInput";
import { onTabIndentOutdent } from "./utils";

export function TodoBlock(props: BlockContentProps) {
  const changeTitle = useChangeBlockTitle();
  const pasteImage = usePasteBlockImage();
  const toggleTodo = useToggleTodo();

  return (
    <>
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
