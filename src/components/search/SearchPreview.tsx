import { useEffect, useRef } from "react";
import type { Block } from "../../types/models";
import { blockTypeOptions } from "../../data/blocks";
import { isHeadingBlockType } from "../../data/blocks";
import { useSearchDayPreview } from "../../features/search/useSearchDayPreview";
import { childBlockIds, orderedListIndex } from "../../utils/blockTree";
import { formatDayTitle } from "../../utils/date";
import { highlightMatches } from "../../utils/highlightMatches";

type SearchPreviewProps = {
  day: string;
  highlightBlockId: string;
  matchIndices: readonly [number, number][];
};

function blockTypeLabel(type: Block["type"]): string {
  return (
    blockTypeOptions.find((option) => option.value === type)?.label ?? type
  );
}

function isAncestorOfBlock(
  ancestorId: string,
  blockId: string,
  blocks: Block[],
): boolean {
  let current = blocks.find((block) => block.id === blockId);
  while (current?.parentId) {
    if (current.parentId === ancestorId) return true;
    current = blocks.find((block) => block.id === current!.parentId);
  }
  return false;
}

function PreviewBlockRow({
  block,
  blocks,
  day,
  highlightBlockId,
  matchIndices,
}: {
  block: Block;
  blocks: Block[];
  day: string;
  highlightBlockId: string;
  matchIndices: readonly [number, number][];
}) {
  const isHighlighted = block.id === highlightBlockId;
  const childIds = childBlockIds(blocks, block.id);
  const showChildren =
    childIds.length > 0 &&
    (block.type !== "toggle" ||
      block.properties.open ||
      isAncestorOfBlock(block.id, highlightBlockId, blocks));

  let className = `block block--${block.type} search-modal__preview-block`;
  if (block.type === "todo" && block.properties.checked) {
    className += " block--todo-checked";
  }
  if (isHighlighted) {
    className += " search-modal__preview-block--match";
  }

  const title = block.properties.title;
  const titleContent =
    isHighlighted && matchIndices.length
      ? highlightMatches(title, matchIndices)
      : title;

  return (
    <div className={className} data-block-id={block.id}>
      <div className="block__line">
        <div className="block__row search-modal__preview-row">
          {block.type === "bullet" ? (
            <span className="block__bullet" aria-hidden="true">
              •
            </span>
          ) : null}
          {block.type === "ordered" ? (
            <span className="block__ordered" aria-hidden="true">
              {orderedListIndex(block.id, blocks, day)}.
            </span>
          ) : null}
          {block.type === "todo" ? (
            <span
              className={
                block.properties.checked
                  ? "block__checkbox block__checkbox--checked"
                  : "block__checkbox"
              }
              aria-hidden="true"
            />
          ) : null}
          {block.type === "toggle" ? (
            <span
              className={
                block.properties.open
                  ? "block__toggle block__toggle--open"
                  : "block__toggle"
              }
              aria-hidden="true"
            />
          ) : null}
          {block.type === "code" ? (
            <div className="search-modal__preview-code">
              <span className="search-modal__preview-code-lang">
                {blockTypeLabel(block.type)}
                {block.properties.language
                  ? ` · ${block.properties.language}`
                  : ""}
              </span>
              <pre className="search-modal__preview-code-pre">
                <code>{titleContent}</code>
              </pre>
            </div>
          ) : block.type === "image" ? (
            block.properties.imageData ? (
              <img
                className="block__image search-modal__preview-image"
                src={block.properties.imageData}
                alt=""
              />
            ) : (
              <span className="search-modal__preview-placeholder">Image</span>
            )
          ) : isHeadingBlockType(block.type) ? (
            <div className="block__input search-modal__preview-text">
              {titleContent}
            </div>
          ) : (
            <div className="block__input search-modal__preview-text">
              {titleContent}
            </div>
          )}
        </div>
      </div>
      {showChildren ? (
        <div className="block__children">
          {childIds.map((childId) => {
            const child = blocks.find((entry) => entry.id === childId);
            if (!child) return null;
            return (
              <PreviewBlockRow
                key={childId}
                block={child}
                blocks={blocks}
                day={day}
                highlightBlockId={highlightBlockId}
                matchIndices={childId === highlightBlockId ? matchIndices : []}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function SearchPreview({
  day,
  highlightBlockId,
  matchIndices,
}: SearchPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const dayPreviewQuery = useSearchDayPreview(day, true);
  const dayBlocks = dayPreviewQuery.data ?? [];
  const rootIds = childBlockIds(dayBlocks, null, day);

  useEffect(() => {
    const container = previewRef.current;
    if (!container) return;

    const match = container.querySelector(
      `.search-modal__preview-block--match`,
    );
    match?.scrollIntoView({ block: "center" });
  }, [highlightBlockId, day]);

  return (
    <div className="search-modal__preview">
      <div className="search-modal__preview-header">
        <span className="search-modal__preview-day">{formatDayTitle(day)}</span>
      </div>
      <div ref={previewRef} className="search-modal__preview-body">
        {dayPreviewQuery.isLoading ? (
          <p className="search-modal__status">Loading preview…</p>
        ) : dayPreviewQuery.isError ? (
          <p className="search-modal__status search-modal__status--error">
            Could not load preview.
          </p>
        ) : (
          rootIds.map((blockId) => {
            const block = dayBlocks.find((entry) => entry.id === blockId);
            if (!block) return null;
            return (
              <PreviewBlockRow
                key={blockId}
                block={block}
                blocks={dayBlocks}
                day={day}
                highlightBlockId={highlightBlockId}
                matchIndices={blockId === highlightBlockId ? matchIndices : []}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
