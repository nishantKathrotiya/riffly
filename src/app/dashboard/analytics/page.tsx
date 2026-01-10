"use client";
import { useEffect, useMemo, useState } from "react";
import { Appbar } from "@/src/app/components/Appbar";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useAnalytics } from "@/src/app/dashboard/analytics/useAnalytics";
import StatsTiles from "@/src/app/dashboard/analytics/components/StatsTiles";
import WeeklyAddsChart from "@/src/app/dashboard/analytics/components/WeeklyAddsChart";
import ListCard from "@/src/app/dashboard/analytics/components/ListCard";
import { ListStart, RotateCw } from "lucide-react";

function ChartCard({
  title,
  counts,
  loading,
}: {
  title: string;
  counts: number[];
  loading: boolean;
}) {
  const max = useMemo(
    () => (counts.length ? Math.max(...counts) : 0),
    [counts]
  );
  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold">{title}</h3>
        </div>
        <div className="grid grid-cols-7 gap-3 items-end h-48">
          {labels.map((label, i) => {
            const v = counts[i] ?? 0;
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

export default function AnalyticsPage() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    // data
    stats,
    weekly,
    trending,
    likesGiven,
    youAddMost,
    yourTopLiked,
    rec,
    // loading
    statsLoading,
    weeklyLoading,
    trendingLoading,
    likesGivenLoading,
    youAddMostLoading,
    yourTopLikedLoading,
    recLoading,
    addLoading,
    // actions
    loadRecommendation,
    addRecommendationToQueue,
    refreshAll,
    loadStats,
    loadWeekly,
    loadTrending,
    loadLikesGiven,
    loadYouAdd,
    loadYourTop,
  } = useAnalytics(roomId);

  useEffect(() => {
    let cancelled = false;
    async function fetchUser() {
      try {
        const res = await fetch("/api/user");
        const json = await res.json();
        if (!cancelled) setRoomId(json.user?.id || null);
      } catch {
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchUser();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[rgb(10,10,10)] text-gray-200">
      <Appbar />
      <div className="w-full max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Room</span>
            <span className="px-2 py-1 rounded bg-gray-900 border border-gray-800 text-white text-sm min-w-40 text-center">
              {loading ? "Loading..." : roomId ?? "Unknown"}
            </span>
          </div>
        </div>

        <StatsTiles
          loading={statsLoading || !stats}
          totalAdded={stats?.totalAdded ?? 0}
          totalLikesGot={stats?.totalLikesGot ?? 0}
          totalLikesGiven={stats?.totalLikesGiven ?? 0}
          avgLikes={stats?.avgLikes ?? 0}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <WeeklyAddsChart counts={weekly} loading={weeklyLoading} />
          </div>
          <ListCard
            title="Trending Now"
            items={trending}
            loading={trendingLoading}
            onRefresh={() => loadTrending()}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ListCard
            title="You Like Most"
            items={likesGiven}
            loading={likesGivenLoading}
            onRefresh={() => loadLikesGiven()}
          />
          <ListCard
            title="You Add Most"
            items={youAddMost}
            loading={youAddMostLoading}
            onRefresh={() => loadYouAdd()}
          />
          <ListCard
            title="Your Songs with Most Likes"
            items={yourTopLiked}
            loading={yourTopLikedLoading}
            onRefresh={() => loadYourTop()}
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                {rec?.img ? (
                  <img
                    src={rec.img}
                    alt=""
                    className="w-16 h-16 object-cover rounded"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-800 rounded" />
                )}
                <div className="min-w-0">
                  <p className="text-white font-semibold">
                    Best Song to Add Now
                  </p>
                  <p className="text-gray-300 text-sm truncate">
                    {recLoading
                      ? "Loading..."
                      : rec
                      ? rec.title
                      : "No recommendation right now"}
                  </p>
                  {rec?.parts ? (
                    <p className="text-gray-500 text-xs mt-1">
                      Score {rec.score.toFixed(2)} • user {rec.parts.user ?? 0}{" "}
                      • room {rec.parts.room ?? 0} • time {rec.parts.time ?? 0}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => loadRecommendation()}
                  disabled={recLoading}
                  className="p-2 aspect-square bg-purple-700 hover:bg-purple-800 text-white"
                >
                  <RotateCw
                    className={`w-4 h-4 transition-transform duration-500 ${
                      recLoading
                        ? "animate-spin [animation-duration:1.8s] ease-in-out"
                        : ""
                    }`}
                  />
                </Button>
                <Button
                  onClick={() =>
                    rec?.extractedId &&
                    addRecommendationToQueue(rec.extractedId)
                  }
                  disabled={addLoading || !rec}
                  className="p-2 aspect-square bg-green-600 hover:bg-green-700 text-white"
                >
                  {addLoading ? (
                    <RotateCw
                      className={`w-4 h-4 transition-transform duration-500 ${
                        addLoading
                          ? "animate-spin [animation-duration:1.8s] ease-in-out"
                          : ""
                      }`}
                    />
                  ) : (
                    <ListStart className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
    </div>
  );
}
