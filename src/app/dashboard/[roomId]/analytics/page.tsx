"use client";
import { Appbar } from "@/src/app/components/Appbar";
import { useAnalytics } from "@/src/hooks/useAnalytics";
import StatsTiles from "@/src/app/components/StatsTiles";
import WeeklyAddsChart from "@/src/app/components/WeeklyAddsChart";
import ListCard from "@/src/app/components/ListCard";
import { Button } from "@/src/components/ui/button";
import { ToastContainer } from "react-toastify";
import { ListStart, RotateCw, ArrowLeft } from "lucide-react";
import { AnimatedButton } from "@/src/app/components/AnimatedButtonProps";

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
    weekStart,
    weekEnd,
    canGoNext,
    prevWeek,
    nextWeek,
    resetToCurrentWeek,
    setWeek,
  } = useAnalytics(roomId);

  return (
    <div className="flex flex-col min-h-screen bg-[rgb(10,10,10)] text-gray-200">
      <Appbar />
      <div className="w-full max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            {/* Left: Back arrow + title */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => window.history.back()}
                className="p-1 text-gray-200 hover:bg-transparent hover:text-white flex gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                <h1 className="text-xl sm:text-2xl font-bold text-white">
                  Analytics Dashboard
                </h1>
              </Button>
            </div>

            {/* Right: roomId badge */}
            <span className="hidden md:inline px-2 py-1 bg-gradient-to-br from-gray-800 to-gray-900 border-[1px] border-gray-600  rounded-lg text-white text-sm">
              {roomId}
            </span>
          </div>

          <div className="mt-2 md:hidden">
            <span className="px-2 py-1 rounded bg-gray-900 border border-gray-800 text-white text-xs">
              {roomId}
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

        <div className="grid grid-cols-1 gap-4 bg-gradient-to-br from-gray-800 to-gray-900 border-[1px] border-gray-600 rounded-xl">
          <div className=" p-4 space-y-3 rounded-lg">
            <div className="flex items-center justify-between ">
              <p className="text-white text-xl font-semibold">
                Best Songs to Add Now
              </p>
              <AnimatedButton
                variant="purple"
                shine={false}
                tiltOnClick
                cursorFollow
                darkBg={false}
                disabled={recLoading}
                className="mr-4 p-0!"
                onClick={() => loadRecommendation()}
              >
                <RotateCw
                  className={`w-4 h-4 m-0! px-0! py-0! ${
                    recLoading ? "animate-spin [animation-duration:1.8s]" : ""
                  }`}
                />
                Refresh
              </AnimatedButton>
            </div>

            {recLoading ? (
              <div className="grid gap-2">
                <div className="h-12 rounded bg-gray-800 animate-pulse" />
                <div className="h-12 rounded bg-gray-800 animate-pulse" />
                <div className="h-12 rounded bg-gray-800 animate-pulse" />
              </div>
            ) : rec.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No recommendation right now
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scroll-area">
                {rec.map((r) => (
                  <div
                    key={r.extractedId}
                    className="flex items-center gap-3 h-16"
                  >
                    {/* Image with fixed size */}
                    <div className="w-12 h-12 flex-shrink-0">
                      {r.img ? (
                        <img
                          src={r.img}
                          alt=""
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-800 rounded" />
                      )}
                    </div>

                    {/* Details with flex-1 to take remaining space */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{r.title}</p>
                      <p className="text-xs text-gray-400">
                        Score: {r.score.toFixed(1)}
                      </p>
                    </div>

                    {/* 20% action */}
                    <div className="basis-[20%] shrink-0 flex justify-end">
                      <AnimatedButton
                        variant="green"
                        shine={false}
                        tiltOnClick
                        cursorFollow
                        darkBg
                        disabled={addLoading}
                        className="p-2 aspect-square"
                        onClick={() => addRecommendationToQueue(r.extractedId)}
                      >
                        {addLoading ? (
                          <RotateCw className="w-4 h-4 animate-spin [animation-duration:1.8s]" />
                        ) : (
                          <ListStart className="w-4 h-4" />
                        )}
                      </AnimatedButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-2">
            <WeeklyAddsChart
              counts={weekly}
              loading={weeklyLoading}
              weekStart={weekStart?.toISOString()}
              weekEnd={weekEnd?.toISOString()}
              canGoNext={canGoNext}
              onPrev={prevWeek}
              onNext={nextWeek}
              onPickDate={(sunday) => setWeek(sunday)}
              onReset={resetToCurrentWeek}
            />
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
      </div>
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
    </div>
  );
}
