import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { PopoverControls, SelectOption } from "../../types/ui";
import { filterOptions } from "../../utils/filterOptions";
import { Popover } from "./Popover";

type SelectProps = {
  className?: string;
  title?: string;
  options: readonly SelectOption[];
  value: string;
  onChange: (value: string) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyText?: string;
};

function selectedLabel(options: readonly SelectOption[], value: string) {
  return options.find((option) => option.value === value)?.label ?? value;
}

export function Select({
  className,
  title,
  options,
  value,
  onChange,
  searchable = false,
  searchPlaceholder = "Search…",
  emptyText = "No matches",
}: SelectProps) {
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const controlsRef = useRef<PopoverControls | null>(null);

  const filtered = filterOptions(options, query);

  const reset = () => {
    setQuery("");
    setHighlight(0);
  };

  const scrollHighlight = () => {
    listRef.current
      ?.querySelector(".select__option--highlighted")
      ?.scrollIntoView({ block: "nearest" });
  };

  const moveHighlight = (delta: number) => {
    if (!filtered.length) {
      setHighlight(0);
      return;
    }
    setHighlight(
      (current) => (current + delta + filtered.length) % filtered.length,
    );
    requestAnimationFrame(scrollHighlight);
  };

  const selectValue = (next: string) => {
    onChange(next);
    reset();
    triggerRef.current?.focus();
  };

  const syncHighlight = () => {
    const current = filtered.findIndex((option) => option.value === value);
    setHighlight(Math.max(0, current));
  };

  const onOpen = () => {
    syncHighlight();
    requestAnimationFrame(() => {
      if (searchable) {
        searchRef.current?.focus();
        searchRef.current?.select();
      }
      scrollHighlight();
    });
  };

  const onTriggerKeydown = (
    e: KeyboardEvent<HTMLButtonElement>,
    controls: PopoverControls,
  ) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!controls.open()) controls.toggle();
      moveHighlight(e.key === "ArrowDown" ? 1 : -1);
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      controls.toggle();
    }
    if (e.key === "Escape" && controls.open()) {
      e.preventDefault();
      controls.close();
      reset();
    }
  };

  useEffect(() => {
    setHighlight(0);
  }, [query]);

  return (
    <Popover
      className={["select", className].filter(Boolean).join(" ")}
      onOpen={onOpen}
      onClose={reset}
      trigger={(controls) => {
        controlsRef.current = controls;
        return (
          <button
            ref={triggerRef}
            className="select__trigger"
            type="button"
            title={title}
            aria-haspopup="listbox"
            aria-expanded={controls.open()}
            onClick={controls.toggle}
            onKeyDown={(e) => onTriggerKeydown(e, controls)}
          >
            <span className="select__value">
              {selectedLabel(options, value)}
            </span>
            <span className="select__chevron" aria-hidden="true">
              ▾
            </span>
          </button>
        );
      }}
    >
      <div className="select__content">
        {searchable ? (
          <div className="select__search">
            <input
              ref={searchRef}
              className="select__search-input"
              type="search"
              placeholder={searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  moveHighlight(1);
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  moveHighlight(-1);
                }
                if (e.key === "Home") {
                  e.preventDefault();
                  setHighlight(0);
                  scrollHighlight();
                }
                if (e.key === "End") {
                  e.preventDefault();
                  setHighlight(Math.max(0, filtered.length - 1));
                  scrollHighlight();
                }
                if (e.key === "Enter" && filtered[highlight]) {
                  e.preventDefault();
                  selectValue(filtered[highlight].value);
                  controlsRef.current?.close();
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  controlsRef.current?.close();
                  triggerRef.current?.focus();
                }
                if (e.key === "Tab") controlsRef.current?.close();
              }}
            />
          </div>
        ) : null}
        <ul ref={listRef} className="select__list" role="listbox">
          {!filtered.length ? (
            <li className="select__empty">{emptyText}</li>
          ) : (
            filtered.map((option, index) => (
              <li
                key={option.value}
                className={[
                  "select__option",
                  option.value === value && "select__option--selected",
                  index === highlight && "select__option--highlighted",
                ]
                  .filter(Boolean)
                  .join(" ")}
                role="option"
                aria-selected={option.value === value}
                onMouseEnter={() => setHighlight(index)}
                onClick={(e) => {
                  e.stopPropagation();
                  selectValue(option.value);
                  controlsRef.current?.close();
                }}
              >
                {option.label}
              </li>
            ))
          )}
        </ul>
      </div>
    </Popover>
  );
}
