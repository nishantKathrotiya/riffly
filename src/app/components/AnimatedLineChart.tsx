// src/app/components/AnimatedLineChart.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import WeekPickerPrebuilt from "./WeekPicker";

interface AnimatedLineChartProps {
  title: string;
  data: { name: string; value: number }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900/90 backdrop-blur-sm text-white p-3 rounded-lg shadow-xl border border-gray-700">
        <p className="font-medium">{label}</p>
        <p className="text-pink-400">{payload[0].value} songs</p>
      </div>
    );
  }
  return null;
};

export function AnimatedLineChart({ title, data }: AnimatedLineChartProps) {
  const [isVisible, setIsVisible] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (chartRef.current) {
      observer.observe(chartRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={chartRef} className="relative p-6 overflow-hidden">
      <div className="h-64 relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={isVisible ? data : []}
            margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              strokeOpacity={0.1}
              vertical={false}
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9ca3af" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9ca3af" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#ec4899"
              strokeWidth={2}
              dot={{ r: 4, fill: "#ec4899" }}
              activeDot={{ r: 6, fill: "#ec4899" }}
              strokeDasharray={isVisible ? "0" : "1000"}
              strokeDashoffset={isVisible ? "0" : "1000"}
              style={{
                transition: "stroke-dashoffset 1.5s ease-in-out",
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
