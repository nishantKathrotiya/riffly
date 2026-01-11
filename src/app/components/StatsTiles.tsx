"use client";
import { Card, CardContent } from "@/src/components/ui/card";
import { AnimatedStatCard } from "./AnimatedStatCard";
import { ArrowUpCircle, BarChart2, Music, ThumbsUp, Users } from "lucide-react";

function Tile({
  title,
  value,
  subtext,
}: {
  title: string;
  value: string | number;
  subtext?: string;
}) {
  return (
    <Card className="bg-gradient-to-br from-gray-800 to-gray-900">
      <CardContent className="p-4">
        <p className="text-gray-400 text-sm">{title}</p>
        <p className="text-2xl font-semibold text-white mt-1">{value}</p>
        {subtext ? (
          <p className="text-xs text-gray-500 mt-1">{subtext}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function StatsTiles({
  loading,
  totalAdded,
  totalLikesGot,
  totalLikesGiven,
  avgLikes,
}: {
  loading: boolean;
  totalAdded: number;
  totalLikesGot: number;
  totalLikesGiven: number;
  avgLikes: number;
}) {
  const stats = [
    {
      title: "Total Added",
      value: totalAdded,
      icon: <Music className="w-5 h-5 text-white" />,
      color: "blue" as const,
      delay: 0.1,
    },
    {
      title: "Likes Got",
      value: totalLikesGot,
      icon: <ThumbsUp className="w-5 h-5 text-white" />,
      color: "pink" as const,
      delay: 0.2,
    },
    {
      title: "Likes Given",
      value: totalLikesGiven,
      icon: <ArrowUpCircle className="w-5 h-5 text-white" />,
      color: "purple" as const,
      delay: 0.3,
    },
    {
      title: "Avg Likes/Song",
      value: avgLikes.toFixed(2),
      icon: <BarChart2 className="w-5 h-5 text-white" />,
      color: "green" as const,
      delay: 0.4,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <AnimatedStatCard
          key={stat.title}
          title={stat.title}
          value={loading ? "—" : stat.value}
          icon={stat.icon}
          color={stat.color}
          delay={stat.delay}
        />
      ))}
    </div>
  );
}
