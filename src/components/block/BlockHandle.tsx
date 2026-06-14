import { useRef } from "react";
import type { Block, BlockType } from "../../types/models";
import { blockTypeOptions } from "../../data/blocks";
import { useChangeBlockType } from "../../features/blocks/mutations/useChangeBlockType";
import { Select } from "../ui/Select";

type BlockHandleProps = {
  blockId: string;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
};

export function BlockHandle({
  blockId,
  onDragStart,
  onDragEnd,
}: BlockHandleProps) {
  const didDragRef = useRef(false);

  return (
    <div className="block__handle-wrap">
      <button
        className="block__handle"
        type="button"
        title="Drag to move"
        draggable
        onDragStart={(e) => {
          didDragRef.current = true;
          e.dataTransfer?.setData("text/plain", blockId);
          if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
          onDragStart(blockId);
        }}
        onDragEnd={() => {
          onDragEnd();
          requestAnimationFrame(() => {
            didDragRef.current = false;
          });
        }}
        onClick={() => {
          if (didDragRef.current) return;
        }}
      >
        ⠿
      </button>
    </div>
  );
}

type BlockTypeSelectProps = {
  block: Block;
  blockId: string;
};

export function BlockTypeSelect({ block, blockId }: BlockTypeSelectProps) {
  const changeType = useChangeBlockType();

  return (
    <Select
      className="block__type-select"
      title="Block type"
      searchable
      searchPlaceholder="Search type…"
      options={blockTypeOptions}
      value={block.type}
      onChange={(value) => {
        if (value === block.type) return;
        void changeType.mutateAsync({
          blockId,
          type: value as BlockType,
        });
      }}
    />
  );
}
