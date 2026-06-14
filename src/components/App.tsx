import { useEffect, useRef } from "react";
import { useDayList } from "../features/days/queries/useDayList";
import { todayISO } from "../utils/date";
import { DaySection } from "./DaySection";
import { DaySectionSkeleton } from "./ui/Skeleton";

export function App() {
  const dayList = useDayList();
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (dayList.hasNextPage && !dayList.isFetchingNextPage) {
            void dayList.fetchNextPage();
          }
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [dayList.fetchNextPage, dayList.hasNextPage, dayList.isFetchingNextPage]);

  const today = todayISO();
  const dates = new Set([today, ...(dayList.data ?? [])]);
  const sorted = [...dates].sort((a, b) => b.localeCompare(a));

  return (
    <main className="feed">
      {sorted.map((date) => (
        <DaySection key={date} date={date} isToday={date === today} />
      ))}
      <div ref={sentinelRef} className="feed__sentinel">
        {dayList.isLoading && !dayList.data?.length ? (
          <div className="feed__skeleton">
            <DaySectionSkeleton />
          </div>
        ) : null}
        {dayList.isError ? (
          <p className="feed__status feed__status--error">
            Could not load days.
          </p>
        ) : null}
        {dayList.isFetchingNextPage ? (
          <div className="feed__skeleton">
            <DaySectionSkeleton />
          </div>
        ) : null}
        {!dayList.hasNextPage && (dayList.data?.length ?? 0) > 0 ? (
          <p className="feed__status">All days loaded.</p>
        ) : null}
      </div>
    </main>
  );
}
