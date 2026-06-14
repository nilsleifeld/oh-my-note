import type { RefObject } from "react";

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={["skeleton", className].filter(Boolean).join(" ")}
      aria-hidden="true"
    />
  );
}

type DaySectionSkeletonProps = {
  date?: string;
  isToday?: boolean;
  sectionRef?: RefObject<HTMLElement | null>;
};

export function DaySectionSkeleton({
  date,
  isToday = false,
  sectionRef,
}: DaySectionSkeletonProps) {
  return (
    <section
      ref={sectionRef}
      className={isToday ? "day day--today day--loading" : "day day--loading"}
      data-date={date}
    >
      <div className="day__inner">
        <header className="day__header">
          <div className="day__header-line">
            <span className="day__divider" aria-hidden="true" />
            <Skeleton className="skeleton--date" />
            <span className="day__divider" aria-hidden="true" />
          </div>
        </header>
        <div className="day__blocks">
          <Skeleton className="skeleton--block" />
          <Skeleton className="skeleton--block" />
          <Skeleton className="skeleton--block skeleton--block-short" />
        </div>
      </div>
    </section>
  );
}
