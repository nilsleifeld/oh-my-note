import type { BlockRowProps } from "../../types/ui";
import { useBlockNavigation } from "../../features/blocks/navigation/BlockNavigationProvider";
import { isHeadingBlockType } from "../../data/blocks";
import { uniqueIds } from "../../utils/list";
import { useBlockQuery } from "../../features/blocks/queries/useBlockQuery";
import { useDeleteBlock } from "../../features/blocks/mutations/useDeleteBlock";
import { BlockHandle, BlockTypeSelect } from "./BlockHandle";
import { BlockCommentsButton } from "./BlockCommentsButton";
import { Skeleton } from "../ui/Skeleton";
import { CodeBlock } from "./CodeBlock";
import { HeadingBlock } from "./HeadingBlock";
import { ImageBlock } from "./ImageBlock";
import { BulletBlock } from "./BulletBlock";
import { TextBlock } from "./TextBlock";
import { TodoBlock } from "./TodoBlock";
import { ToggleBlock } from "./ToggleBlock";

export function BlockRow({
  blockId,
  date,
  rootKey,
  rootIds,
  dragState,
  pendingContent,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  focusId,
  onFocused,
  onRequestFocus,
  onAddBelow,
  onIndent,
  onOutdent,
}: BlockRowProps) {
  const { isNavSelected } = useBlockNavigation();
  const query = useBlockQuery(blockId);
  const deleteBlock = useDeleteBlock(date, () => rootIds);

  if (query.isLoading) {
    return (
      <div className="block block--loading" data-block-id={blockId}>
        <div className="block__row">
          <Skeleton className="skeleton--block-row" />
        </div>
      </div>
    );
  }

  const block = query.data;
  if (!block) return null;

  const remove = () => deleteBlock.mutate(blockId);

  let className = `block block--${block.type}`;
  if (block.type === "todo" && block.properties.checked) {
    className += " block--todo-checked";
  }
  if (dragState.draggingId === blockId) className += " block--dragging";
  if (dragState.overId === blockId) className += " block--over";
  if (isNavSelected(blockId)) className += " block--nav-selected";
  if (block.comments.length > 0) className += " block--has-comments";

  const contentProps = {
    blockId,
    block,
    onEnter: () => onAddBelow(block.type, blockId),
    onBackspaceEmpty: remove,
    onIndent: () => onIndent(blockId),
    onOutdent: () => onOutdent(blockId),
    shouldFocus: focusId === blockId,
    onFocused,
    onRequestFocus,
  };

  const childIds = uniqueIds(pendingContent?.(block.id) ?? block.content);
  const hasChildren = childIds.length > 0;
  const showChildren =
    hasChildren && (block.type !== "toggle" || block.properties.open);

  return (
    <div
      className={className}
      data-block-id={blockId}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDragOver(blockId);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDrop(blockId);
      }}
    >
      <div className="block__line">
        <div className="block__row">
          <BlockHandle
            blockId={blockId}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
          {block.type === "text" ? <TextBlock {...contentProps} /> : null}
          {block.type === "bullet" ? <BulletBlock {...contentProps} /> : null}
          {block.type === "todo" ? <TodoBlock {...contentProps} /> : null}
          {block.type === "toggle" ? <ToggleBlock {...contentProps} /> : null}
          {block.type === "code" ? <CodeBlock {...contentProps} /> : null}
          {block.type === "image" ? (
            <ImageBlock
              {...contentProps}
              onEnter={() => onAddBelow("text", blockId)}
            />
          ) : null}
          {isHeadingBlockType(block.type) ? (
            <HeadingBlock
              {...contentProps}
              onEnter={() => onAddBelow("text", blockId)}
            />
          ) : null}
          <BlockTypeSelect block={block} blockId={blockId} />
          <BlockCommentsButton
            blockId={blockId}
            commentCount={block.comments.length}
          />
        </div>
      </div>
      {showChildren ? (
        <div className="block__children">
          {childIds.map((childId) => (
            <BlockRow
              key={childId}
              blockId={childId}
              date={date}
              rootKey={rootKey}
              rootIds={rootIds}
              dragState={dragState}
              pendingContent={pendingContent}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onDragEnd={onDragEnd}
              focusId={focusId}
              onFocused={onFocused}
              onRequestFocus={onRequestFocus}
              onAddBelow={onAddBelow}
              onIndent={onIndent}
              onOutdent={onOutdent}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
