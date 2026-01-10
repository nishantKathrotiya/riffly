"use client";
import { Appbar } from "@/src/app/components/Appbar";
import { useAnalytics } from "@/src/app/dashboard/analytics/useAnalytics";
import StatsTiles from "@/src/app/dashboard/analytics/components/StatsTiles";
import WeeklyAddsChart from "@/src/app/dashboard/analytics/components/WeeklyAddsChart";
import ListCard from "@/src/app/dashboard/analytics/components/ListCard";
import { Button } from "@/src/components/ui/button";
import { ToastContainer } from "react-toastify";
import { ListStart, RotateCw } from "lucide-react";

export default function RoomAnalyticsPage({
  params,
}: {
  params: { roomId: string };
}) {
  const roomId = params.roomId || null;
  const {
    stats,
    weekly,
    trending,
    likesGiven,
    youAddMost,
    yourTopLiked,
    rec,
    statsLoading,
    weeklyLoading,
    trendingLoading,
    likesGivenLoading,
    youAddMostLoading,
    yourTopLikedLoading,
    recLoading,
    addLoading,
    loadRecommendation,
    addRecommendationToQueue,
    loadTrending,
    loadLikesGiven,
    loadYouAdd,
    loadYourTop,
  } = useAnalytics(roomId);

  return (
    <div className="flex flex-col min-h-screen bg-[rgb(10,10,10)] text-gray-200">
      <Appbar />
      <div className="w-full max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
          <span className="px-2 py-1 rounded bg-gray-900 border border-gray-800 text-white text-sm">
            {roomId}
          </span>
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
          <div className="bg-gray-900 border border-gray-800 rounded p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              {rec?.img ? (
                <img src={rec.img} className="w-16 h-16 object-cover rounded" />
              ) : (
                <div className="w-16 h-16 bg-gray-800 rounded" />
              )}
              <div className="min-w-0">
                <p className="text-white font-semibold">Best Song to Add Now</p>
                <p className="text-gray-300 text-sm truncate">
                  {recLoading
                    ? "Loading..."
                    : rec
                    ? rec.title
                    : "No recommendation right now"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => loadRecommendation()}
                disabled={recLoading}
                className="p-2 aspect-square bg-purple-700 hover:bg-purple-800 text-white"
              >
                <RotateCw
                  className={`w-4 h-4 ${
                    recLoading ? "animate-spin [animation-duration:1.8s]" : ""
                  }`}
                />
              </Button>
              <Button
                onClick={() =>
                  rec?.extractedId && addRecommendationToQueue(rec.extractedId)
                }
                disabled={addLoading || !rec}
                className="p-2 aspect-square bg-green-600 hover:bg-green-700 text-white"
              >
                {addLoading ? (
                  <RotateCw className="w-4 h-4 animate-spin [animation-duration:1.8s]" />
                ) : (
                  <ListStart className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
    </div>
  );
}
