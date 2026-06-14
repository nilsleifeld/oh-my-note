import { useEffect, useRef, useState } from "react";
import { useDayRootBlocks } from "../features/days/queries/useDayRootBlocks";
import { useBlockTree } from "../features/blocks/useBlockTree";
import { useDrag } from "../features/blocks/drag/DragProvider";
import { formatDayTitle } from "../utils/date";
import { uniqueIds } from "../utils/list";
import { BlockRow } from "./block/BlockRow";
import { DaySectionSkeleton } from "./ui/Skeleton";

type DaySectionProps = {
  date: string;
  isToday: boolean;
};

export function DaySection({ date, isToday }: DaySectionProps) {
  const [visible, setVisible] = useState(isToday);
  const sectionRef = useRef<HTMLElement>(null);
  const drag = useDrag();

  const rootBlocksQuery = useDayRootBlocks(date, {
    enabled: isToday || visible,
  });
  const { rowProps, addChild, getRootIds } = useBlockTree({
    date,
    rootBlocksQuery,
  });

  useEffect(() => {
    if (isToday || visible) return;

    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isToday, visible]);

  if (!isToday && !visible) {
    return (
      <section ref={sectionRef} className="day" data-date={date}>
        <div className="day__placeholder">{formatDayTitle(date)}</div>
      </section>
    );
  }

  if (rootBlocksQuery.isLoading) {
    return (
      <DaySectionSkeleton
        date={date}
        isToday={isToday}
        sectionRef={sectionRef}
      />
    );
  }

  if (rootBlocksQuery.isError) {
    return (
      <section
        ref={sectionRef}
        className={isToday ? "day day--today" : "day"}
        data-date={date}
      >
        <div className="day__error">Could not load day.</div>
      </section>
    );
  }

  const blockIds = uniqueIds(
    rowProps.pendingContent?.(rowProps.rootKey) ?? getRootIds(),
  );

  return (
    <section
      ref={sectionRef}
      className={isToday ? "day day--today" : "day"}
      data-date={date}
    >
      <div className="day__inner">
        <header className="day__header">
          <div className="day__header-line">
            <span className="day__divider" aria-hidden="true" />
            <time className="day__date" dateTime={date}>
              {formatDayTitle(date)}
            </time>
            <span className="day__divider" aria-hidden="true" />
          </div>
        </header>
        <div
          className="day__blocks"
          onDragOver={(e) => {
            e.preventDefault();
            const row = (e.target as Element).closest("[data-block-id]");
            const id = row?.getAttribute("data-block-id");
            if (id) {
              drag.onDragOver(id);
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            const draggedId = drag.getDraggingId();
            const targetId = drag.getOverId();
            if (!draggedId || !targetId || draggedId === targetId) {
              drag.onDragEnd();
              return;
            }
            rowProps.onDrop(targetId);
          }}
        >
          {!blockIds.length ? (
            <button
              type="button"
              className="day__empty block block--placeholder"
              onClick={() => void addChild("text")}
            >
              <div className="block__row">
                <span className="day__empty__icon" aria-hidden="true">
                  <svg
                    className="day__empty__icon-svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                </span>
                <span className="day__empty__label">Block</span>
              </div>
            </button>
          ) : (
            blockIds.map((blockId) => (
              <BlockRow key={blockId} {...rowProps} blockId={blockId} />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
