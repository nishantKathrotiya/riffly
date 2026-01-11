"use client";
import { useMemo } from "react";
import { Card, CardContent } from "@/src/components/ui/card";
import WeekPickerPrebuilt from "@/src/app/components/WeekPicker";

export default function WeeklyAddsChart({
  counts,
  loading,
  weekStart,
  weekEnd,
  canGoNext,
  onPrev,
  onNext,
  onPickDate,
  onReset,
}: {
  counts: number[];
  loading: boolean;
  weekStart?: string; // ISO optional, for header context
  weekEnd?: string;
  canGoNext?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  onPickDate?: (sunday: Date) => void;
  onReset?: () => void;
}) {
  const max = useMemo(
    () => (counts?.length ? Math.max(...counts) : 0),
    [counts]
  );
  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const rangeLabel = useMemo(() => {
    if (!weekStart || !weekEnd) return null;
    const s = new Date(weekStart);
    const e = new Date(weekEnd);
    const fmt = (d: Date) =>
      d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return `${fmt(s)} – ${fmt(e)}`;
  }, [weekStart, weekEnd]);

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold">Weekly Adds</h3>
          {/* Inline week picker */}
          {onPrev && onNext && onPickDate && (
            <WeekPickerPrebuilt
              weekStart={weekStart ? new Date(weekStart) : new Date()}
              canGoNext={!!canGoNext}
              onPrev={onPrev}
              onNext={onNext}
              onPickDate={onPickDate}
              onReset={onReset || (() => {})}
            />
          )}
        </div>
        <div className="grid grid-cols-7 gap-3 items-end h-48">
          {labels.map((label, i) => {
            const v = counts?.[i] ?? 0;
            const h = max > 0 ? Math.max(6, Math.round((v / max) * 140)) : 6;
            return (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="relative group">
                  <div
                    className={`w-8 rounded ${
                      loading
                        ? "bg-purple-700/30 animate-pulse"
                        : "bg-purple-700"
                    }`}
                    style={{ height: `${h}px` }}
                    aria-label={`${label}: ${v}`}
                  />
                  {!loading && (
                    <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-150">
                      <div className="px-2 py-1 text-xs rounded bg-black/85 text-white border border-white/10 shadow whitespace-nowrap">
                        {v} {v === 1 ? "song" : "songs"}
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-400">{label}</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
