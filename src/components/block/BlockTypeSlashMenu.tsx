import type { RefObject } from "react";
import type { BlockType } from "../../types/models";
import type { SelectOption } from "../../types/ui";

type BlockTypeSlashMenuProps = {
  open: boolean;
  filtered: SelectOption[];
  highlight: number;
  currentType: BlockType;
  listRef: RefObject<HTMLUListElement | null>;
  onHighlight: (index: number) => void;
  onSelect: (type: BlockType) => void;
};

export function BlockTypeSlashMenu({
  open,
  filtered,
  highlight,
  currentType,
  listRef,
  onHighlight,
  onSelect,
}: BlockTypeSlashMenuProps) {
  if (!open) return null;

  return (
    <div className="block-slash-menu" role="listbox" aria-label="Block type">
      <ul ref={listRef} className="block-slash-menu__list">
        {!filtered.length ? (
          <li className="block-slash-menu__empty">No matches</li>
        ) : (
          filtered.map((option, index) => {
            const disabled = option.value === currentType;

            return (
              <li
                key={option.value}
                className={[
                  "block-slash-menu__option",
                  disabled && "block-slash-menu__option--disabled",
                  !disabled &&
                    index === highlight &&
                    "block-slash-menu__option--highlighted",
                ]
                  .filter(Boolean)
                  .join(" ")}
                role="option"
                aria-selected={!disabled && index === highlight}
                aria-disabled={disabled || undefined}
                onMouseEnter={() => {
                  if (!disabled) onHighlight(index);
                }}
                onMouseDown={(e) => {
                  if (disabled) return;
                  e.preventDefault();
                  onSelect(option.value as BlockType);
                }}
              >
                {option.label}
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
