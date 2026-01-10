"use client";
import { useMemo } from "react";
import { Card, CardContent } from "@/src/components/ui/card";

export default function WeeklyAddsChart({
  counts,
  loading,
}: {
  counts: number[];
  loading: boolean;
}) {
  const max = useMemo(
    () => (counts?.length ? Math.max(...counts) : 0),
    [counts]
  );
  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold">Weekly Adds</h3>
        </div>
        <div className="grid grid-cols-7 gap-3 items-end h-48">
          {labels.map((label, i) => {
            const v = counts?.[i] ?? 0;
            const h = max > 0 ? Math.max(6, Math.round((v / max) * 140)) : 6;
            return (
              <div key={i} className="flex flex-col items-center gap-2">
                <div
                  className={`w-8 rounded ${
                    loading ? "bg-purple-700/30 animate-pulse" : "bg-purple-700"
                  }`}
                  style={{ height: `${h}px` }}
                  title={`${label}: ${v}`}
                />
                <div className="text-xs text-gray-400">{label}</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
