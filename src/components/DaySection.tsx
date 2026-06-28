import { useEffect, useRef, useState } from "react";
import { useDayRootBlocks } from "../features/days/queries/useDayRootBlocks";
import { useBlockTree } from "../features/blocks/useBlockTree";
import { useDrag } from "../features/blocks/drag/DragProvider";
import { formatDayTitle } from "../utils/date";
import { BlockRow } from "./block/BlockRow";
import { DaySectionSkeleton } from "./ui/Skeleton";

type DaySectionProps = {
  date: string;
  isToday: boolean;
  isFuture: boolean;
  forceExpanded?: boolean;
};

export function DaySection({
  date,
  isToday,
  isFuture,
  forceExpanded = false,
}: DaySectionProps) {
  const [visible, setVisible] = useState(isToday);
  const [expanded, setExpanded] = useState(
    isToday || (isFuture && forceExpanded),
  );
  const sectionRef = useRef<HTMLElement>(null);
  const drag = useDrag();

  const isExpanded = isToday || (isFuture ? expanded : visible);

  const rootBlocksQuery = useDayRootBlocks(date, {
    enabled: isExpanded,
  });
  const { rowProps, addChild, getRootIds } = useBlockTree({
    date,
    rootBlocksQuery,
  });

  useEffect(() => {
    if (forceExpanded) setExpanded(true);
  }, [forceExpanded]);

  const toggleExpanded = () => setExpanded((current) => !current);

  const dayHeader = (collapsible: boolean, isHeaderExpanded: boolean) => (
    <header
      className={
        collapsible && !isHeaderExpanded
          ? "day__header day__header--collapsed"
          : "day__header"
      }
    >
      {collapsible ? (
        <button
          type="button"
          className="day__header-toggle"
          aria-expanded={isHeaderExpanded}
          onClick={toggleExpanded}
        >
          <span className="day__header-line">
            <span className="day__divider" aria-hidden="true" />
            <time className="day__date" dateTime={date}>
              {formatDayTitle(date)}
            </time>
            <span className="day__divider" aria-hidden="true" />
          </span>
        </button>
      ) : (
        <div className="day__header-line">
          <span className="day__divider" aria-hidden="true" />
          <time className="day__date" dateTime={date}>
            {formatDayTitle(date)}
          </time>
          <span className="day__divider" aria-hidden="true" />
        </div>
      )}
    </header>
  );

  useEffect(() => {
    if (isToday || isFuture || visible) return;

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
  }, [isFuture, isToday, visible]);

  if (isFuture && !expanded) {
    return (
      <section
        ref={sectionRef}
        className="day day--future day--collapsed"
        data-date={date}
      >
        <div className="day__inner">{dayHeader(true, false)}</div>
      </section>
    );
  }

  if (!isToday && !isFuture && !visible) {
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

  const blockIds = getRootIds();

  return (
    <section
      ref={sectionRef}
      className={
        isToday ? "day day--today" : isFuture ? "day day--future" : "day"
      }
      data-date={date}
    >
      <div className="day__inner">
        {dayHeader(isFuture, true)}
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
