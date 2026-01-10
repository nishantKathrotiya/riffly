"use client";
import { Card, CardContent } from "@/src/components/ui/card";

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
    <Card className="bg-gray-900 border-gray-800">
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
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Tile title="Total Added" value={loading ? "—" : totalAdded} />
      <Tile title="Likes Got" value={loading ? "—" : totalLikesGot} />
      <Tile title="Likes Given" value={loading ? "—" : totalLikesGiven} />
      <Tile
        title="Avg Likes/Song"
        value={loading ? "—" : avgLikes.toFixed(2)}
      />
    </div>
  );
}
