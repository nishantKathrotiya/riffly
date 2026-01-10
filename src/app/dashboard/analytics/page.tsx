"use client";
import { useEffect, useMemo, useState } from "react";
import { Appbar } from "@/src/app/components/Appbar";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
  getStats,
  getWeeklyAdds,
  getTrending,
  getLikesGivenTop,
  getYouAddMost,
  getYourTopLiked,
  getRecommendation,
  addToQueue,
  type ListItem,
} from "@/src/app/dashboard/analytics/integration";

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

function ListCard({
  title,
  items,
  loading,
  onRefresh,
}: {
  title: string;
  items: {
    id: string;
    title: string;
    img?: string | null;
    right: string | number;
  }[];
  loading: boolean;
  onRefresh?: () => void;
}) {
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">{title}</h3>
          {onRefresh ? (
            <Button
              onClick={onRefresh}
              variant="outline"
              className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
            >
              Refresh
            </Button>
          ) : null}
        </div>
        <div className="space-y-3">
          {loading ? (
            <>
              <div className="h-4 rounded bg-gray-800 animate-pulse" />
              <div className="h-4 rounded bg-gray-800 animate-pulse" />
              <div className="h-4 rounded bg-gray-800 animate-pulse" />
            </>
          ) : items.length === 0 ? (
            <p className="text-gray-500 text-sm">No data</p>
          ) : (
            items.map((it) => (
              <div key={it.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  {it.img ? (
                    <img
                      src={it.img}
                      alt=""
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-800 rounded" />
                  )}
                  <p className="text-white text-sm truncate">{it.title}</p>
                </div>
                <span className="text-gray-300 text-sm ml-3">{it.right}</span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

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
  const [statsLoading, setStatsLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);
  const [stats, setStats] = useState<{
    totalAdded: number;
    totalLikesGot: number;
    totalLikesGiven: number;
    avgLikes: number;
  } | null>(null);
  const [weekly, setWeekly] = useState<number[]>(Array(7).fill(0));

  const [trendLoading, setTrendLoading] = useState(false);
  const [trendItems, setTrendItems] = useState<
    { id: string; title: string; img?: string | null; right: string | number }[]
  >([]);
  const [likeMostLoading, setLikeMostLoading] = useState(false);
  const [likeMostItems, setLikeMostItems] = useState<
    { id: string; title: string; img?: string | null; right: string | number }[]
  >([]);
  const [youAddLoading, setYouAddLoading] = useState(false);
  const [youAddItems, setYouAddItems] = useState<
    { id: string; title: string; img?: string | null; right: string | number }[]
  >([]);
  const [yourTopLikedLoading, setYourTopLikedLoading] = useState(false);
  const [yourTopLikedItems, setYourTopLikedItems] = useState<
    { id: string; title: string; img?: string | null; right: string | number }[]
  >([]);

  const [recLoading, setRecLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [rec, setRec] = useState<{
    extractedId: string;
    title: string;
    img?: string | null;
    score: number;
    parts?: { user: number; room: number; time: number };
  } | null>(null);

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

  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;

    async function loadStats() {
      try {
        setStatsLoading(true);
        const data = await getStats(roomId!);
        if (!cancelled) {
          setStats({
            totalAdded: data.totalAdded ?? 0,
            totalLikesGot: data.totalLikesGot ?? 0,
            totalLikesGiven: data.totalLikesGiven ?? 0,
            avgLikes: data.avgLikes ?? 0,
          });
        }
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    }

    async function loadWeekly() {
      try {
        setChartLoading(true);
        const data = await getWeeklyAdds(roomId!);
        if (!cancelled) {
          setWeekly(
            Array.isArray(data.counts) && data.counts.length === 7
              ? data.counts
              : Array(7).fill(0)
          );
        }
      } finally {
        if (!cancelled) setChartLoading(false);
      }
    }

    async function loadTrending() {
      try {
        setTrendLoading(true);
        const items = await getTrending(roomId!, 10);
        if (!cancelled) setTrendItems(items);
      } finally {
        if (!cancelled) setTrendLoading(false);
      }
    }

    async function loadLikesGivenTop() {
      try {
        setLikeMostLoading(true);
        const items = await getLikesGivenTop(roomId!, 10);
        if (!cancelled) setLikeMostItems(items);
      } finally {
        if (!cancelled) setLikeMostLoading(false);
      }
    }

    async function loadYouAddMost() {
      try {
        setYouAddLoading(true);
        const items = await getYouAddMost(roomId!, 10);
        if (!cancelled) setYouAddItems(items);
      } finally {
        if (!cancelled) setYouAddLoading(false);
      }
    }

    async function loadYourTopLiked() {
      try {
        setYourTopLikedLoading(true);
        const items = await getYourTopLiked(roomId!, 10);
        if (!cancelled) setYourTopLikedItems(items);
      } finally {
        if (!cancelled) setYourTopLikedLoading(false);
      }
    }

    async function loadRecommendation() {
      if (!roomId) return;
      try {
        setRecLoading(true);
        const r = await getRecommendation(roomId);
        setRec(r);
      } finally {
        setRecLoading(false);
      }
    }

    loadStats();
    loadWeekly();
    loadTrending();
    loadLikesGivenTop();
    loadYouAddMost();
    loadYourTopLiked();
    loadRecommendation();
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  async function handleRefreshRecommendation() {
    if (!roomId) return;
    // await loadRecommendation();
  }

  async function handleAddRecommendation() {
    if (!roomId || !rec?.extractedId) return;
    try {
      setAddLoading(true);
      await addToQueue(roomId, rec.extractedId);
      toast.success("Added to queue");
      //   await loadRecommendation();
    } catch (e: any) {
      toast.error(e?.message || "Failed to add");
    } finally {
      setAddLoading(false);
    }
  }

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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Tile
            title="Total Added"
            value={statsLoading || !stats ? "—" : stats.totalAdded}
          />
          <Tile
            title="Likes Got"
            value={statsLoading || !stats ? "—" : stats.totalLikesGot}
          />
          <Tile
            title="Likes Given"
            value={statsLoading || !stats ? "—" : stats.totalLikesGiven}
          />
          <Tile
            title="Avg Likes/Song"
            value={statsLoading || !stats ? "—" : stats.avgLikes.toFixed(2)}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <ChartCard
              title="Weekly Adds"
              counts={weekly}
              loading={chartLoading}
            />
          </div>
          <ListCard
            title="Trending Now"
            items={trendItems}
            loading={trendLoading}
            onRefresh={() => setRoomId((v) => (v ? `${v}` : v))}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ListCard
            title="You Like Most"
            items={likeMostItems}
            loading={likeMostLoading}
            onRefresh={() => setRoomId((v) => (v ? `${v}` : v))}
          />
          <ListCard
            title="You Add Most"
            items={youAddItems}
            loading={youAddLoading}
            onRefresh={() => setRoomId((v) => (v ? `${v}` : v))}
          />
          <ListCard
            title="Your Songs with Most Likes"
            items={yourTopLikedItems}
            loading={yourTopLikedLoading}
            onRefresh={() => setRoomId((v) => (v ? `${v}` : v))}
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
                  onClick={handleRefreshRecommendation}
                  disabled={recLoading}
                  className="bg-purple-700 hover:bg-purple-800 text-white"
                >
                  {recLoading ? "Refreshing..." : "Refresh"}
                </Button>
                <Button
                  onClick={handleAddRecommendation}
                  disabled={addLoading || !rec}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {addLoading ? "Adding..." : "Add to Queue"}
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
