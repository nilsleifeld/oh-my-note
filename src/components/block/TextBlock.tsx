import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { BlockContentProps } from "../../types/ui";
import { buildBulletShortcutChange } from "../../features/blocks/changes/buildBlockChanges";
import { getBlock } from "../../features/blocks/cache/blockCache";
import { useApplyBlockMutation } from "../../features/blocks/mutations/useApplyBlockMutation";
import { useChangeBlockTitle } from "../../features/blocks/mutations/useChangeBlockTitle";
import { usePasteBlockImage } from "../../features/blocks/mutations/usePasteBlockImage";
import { BlockInput } from "./BlockInput";

export function TextBlock(props: BlockContentProps) {
  const queryClient = useQueryClient();
  const { apply } = useApplyBlockMutation();
  const changeTitle = useChangeBlockTitle();
  const pasteImage = usePasteBlockImage();

  const onTitleInput = useCallback(
    (value: string) => {
      if (!value.startsWith("- ")) return value;

      const title = value.slice(2);
      const current = getBlock(queryClient, props.blockId);
      if (current) {
        void apply(buildBulletShortcutChange(current, title));
      }
      return title;
    },
    [apply, props.blockId, queryClient],
  );

  return (
    <BlockInput
      block={props.block}
      multiline
      inputClass="block__input block__input--multiline"
      onEnter={props.onEnter}
      onBackspaceEmpty={props.onBackspaceEmpty}
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
  );
}
