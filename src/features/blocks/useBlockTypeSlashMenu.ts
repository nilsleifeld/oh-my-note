import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { blockTypeOptions } from "../../data/blocks";
import type { BlockType } from "../../types/models";
import type { SelectOption } from "../../types/ui";
import { filterOptions } from "../../utils/filterOptions";
import { buildSlashTypeChange } from "./changes/buildBlockChanges";
import { getBlock } from "./cache/blockCache";
import { useApplyBlockMutation } from "./mutations/useApplyBlockMutation";

function isOptionDisabled(value: string, currentType: BlockType): boolean {
  return value === currentType;
}

function selectableIndexes(
  options: readonly SelectOption[],
  currentType: BlockType,
): number[] {
  return options.reduce<number[]>((indexes, option, index) => {
    if (!isOptionDisabled(option.value, currentType)) indexes.push(index);
    return indexes;
  }, []);
}

function firstSelectableIndex(
  options: readonly SelectOption[],
  currentType: BlockType,
): number {
  return selectableIndexes(options, currentType)[0] ?? 0;
}

function nextSelectableIndex(
  options: readonly SelectOption[],
  current: number,
  delta: number,
  currentType: BlockType,
): number {
  const selectable = selectableIndexes(options, currentType);
  if (!selectable.length) return 0;
  const pos = selectable.indexOf(current);
  const nextPos =
    pos === -1
      ? delta > 0
        ? 0
        : selectable.length - 1
      : (pos + delta + selectable.length) % selectable.length;
  return selectable[nextPos];
}

export function useBlockTypeSlashMenu(
  blockId: string,
  currentType: BlockType,
  onRequestFocus?: (blockId: string) => void,
) {
  const queryClient = useQueryClient();
  const { apply } = useApplyBlockMutation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = useMemo(
    () => filterOptions(blockTypeOptions, query),
    [query],
  );

  const scrollHighlight = useCallback(() => {
    listRef.current
      ?.querySelector(".block-slash-menu__option--highlighted")
      ?.scrollIntoView({ block: "nearest" });
  }, []);

  const syncHighlight = useCallback(() => {
    setHighlight(firstSelectableIndex(filtered, currentType));
    requestAnimationFrame(scrollHighlight);
  }, [currentType, filtered, scrollHighlight]);

  const syncFromTitle = useCallback((title: string) => {
    if (title.startsWith("/")) {
      setOpen(true);
      setQuery(title.slice(1));
      return;
    }
    setOpen(false);
    setQuery("");
    setHighlight(0);
  }, []);

  const selectType = useCallback(
    (type: BlockType) => {
      if (type === currentType) return;
      const current = getBlock(queryClient, blockId);
      if (!current) {
        setOpen(false);
        setQuery("");
        setHighlight(0);
        return;
      }
      onRequestFocus?.(blockId);
      void apply(buildSlashTypeChange(current, type));
      setOpen(false);
      setQuery("");
      setHighlight(0);
    },
    [apply, blockId, currentType, onRequestFocus, queryClient],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): boolean => {
      if (!open) return false;

      const selectable = selectableIndexes(filtered, currentType);

      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (!selectable.length) return true;
        setHighlight((current) =>
          nextSelectableIndex(filtered, current, 1, currentType),
        );
        requestAnimationFrame(scrollHighlight);
        return true;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (!selectable.length) return true;
        setHighlight((current) =>
          nextSelectableIndex(filtered, current, -1, currentType),
        );
        requestAnimationFrame(scrollHighlight);
        return true;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const option = filtered[highlight];
        if (option && !isOptionDisabled(option.value, currentType)) {
          selectType(option.value as BlockType);
        }
        return true;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return true;
      }
      return false;
    },
    [currentType, filtered, highlight, open, scrollHighlight, selectType],
  );

  useEffect(() => {
    if (!open) return;
    syncHighlight();
  }, [open, query, currentType, syncHighlight]);

  return {
    open,
    filtered,
    highlight,
    currentType,
    listRef,
    syncFromTitle,
    selectType,
    setHighlight,
    handleKeyDown,
  };
}
