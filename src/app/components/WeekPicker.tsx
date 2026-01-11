"use client";

import { useMemo, useRef } from "react";
import { Button } from "@/src/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { Calendar } from "@/src/components/ui/calendar";
function sundayOf(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dow = d.getDay();
  d.setDate(d.getDate() - dow);
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function formatWeekRange(start: Date) {
  const end = addDays(start, 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
}

export default function WeekPickerPrebuilt({
  weekStart,
  canGoNext,
  onPrev,
  onNext,
  onPickDate,
  onReset,
}: {
  weekStart: Date;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onPickDate: (sunday: Date) => void;
  onReset: () => void;
}) {
  const label = useMemo(() => formatWeekRange(weekStart), [weekStart]);
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);

  // matcher: mark all days in the currently selected week
  const inSelectedWeek = (d: Date) => {
    const t = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    return (
      t >=
        new Date(
          weekStart.getFullYear(),
          weekStart.getMonth(),
          weekStart.getDate()
        ).getTime() &&
      t <=
        new Date(
          weekEnd.getFullYear(),
          weekEnd.getMonth(),
          weekEnd.getDate()
        ).getTime()
    );
  };

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="text-xs text-gray-400 hover:text-white hover:bg-transparent"
            title="Select week"
          >
            {label}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 bg-gray-900 border border-gray-800">
          <Calendar
            mode="single"
            className="bg-gray-900 text-gray-100"
            // highlight the whole week
            modifiers={{ selectedWeek: inSelectedWeek }}
            modifiersClassNames={{
              selectedWeek: "bg-purple-900/30 text-white",
            }}
            selected={weekStart}
            onSelect={(d) => {
              if (!d) return;
              onPickDate(sundayOf(d));
            }}
            ISOWeek={false}
            weekStartsOn={0}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
