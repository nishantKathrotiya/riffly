"use client";
import { useMemo } from "react";
import { Card, CardContent } from "@/src/components/ui/card";
import WeekPickerPrebuilt from "@/src/app/components/WeekPicker";
import { AnimatedLineChart } from "./AnimatedLineChart";

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

  const chartData = useMemo(() => {
    return (
      counts?.map((value, index) => ({
        name: labels[index % labels.length],
        value: value || 0,
      })) || []
    );
  }, [counts, labels]);

  return (
    <div className="relative p-6 bg-gradient-to-br from-gray-800 to-gray-900 border-[1px] border-gray-600 rounded-xl shadow-xl overflow-hidden">
      <div className="absolute inset-0 bg-grid-white/[0.05] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white relative z-10">
          Weekly Data
        </h3>

        <div className="flex items-center gap-2 z-10">
          {onPrev && onNext && onPickDate && (
            <WeekPickerPrebuilt
              weekStart={weekStart ? new Date(weekStart) : new Date()}
              canGoNext={!!canGoNext}
              onPrev={onPrev}
              onNext={onNext}
              onPickDate={onPickDate}
              onReset={onReset ?? (() => {})}
            />
          )}
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <AnimatedLineChart title="Weekly Adds" data={chartData} />
      )}
    </div>
  );
}
