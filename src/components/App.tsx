import { useCallback, useEffect, useRef, useState } from "react";
import { useDayList } from "../features/days/queries/useDayList";
import { useFeedJumpRegistration } from "../features/search/FeedJumpProvider";
import { todayISO } from "../utils/date";
import { DaySection } from "./DaySection";
import { DaySectionSkeleton } from "./ui/Skeleton";

export function App() {
  const dayList = useDayList();
  const { registerFeedController } = useFeedJumpRegistration();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [extraDays, setExtraDays] = useState<Set<string>>(() => new Set());

  const ensureDayVisible = useCallback(
    async (day: string) => {
      setExtraDays((previous) => {
        if (previous.has(day)) return previous;
        const next = new Set(previous);
        next.add(day);
        return next;
      });

      let attempts = 0;
      while (attempts < 100) {
        const loaded = dayList.data ?? [];
        if (loaded.includes(day)) break;
        if (!dayList.hasNextPage) break;
        await dayList.fetchNextPage();
        attempts += 1;
      }

      document
        .querySelector(`[data-date="${day}"]`)
        ?.scrollIntoView({ block: "start" });

      await new Promise((resolve) => window.setTimeout(resolve, 150));
    },
    [dayList],
  );

  useEffect(() => {
    registerFeedController({ ensureDayVisible });
    return () => registerFeedController(null);
  }, [ensureDayVisible, registerFeedController]);

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
  const dates = new Set([today, ...(dayList.data ?? []), ...extraDays]);
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
