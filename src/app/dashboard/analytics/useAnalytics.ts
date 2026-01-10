"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  type Recommendation,
} from "@/src/app/dashboard/analytics/integration";

export function useAnalytics(roomId: string | null) {
  // Stats
  const [statsLoading, setStatsLoading] = useState(false);
  const [stats, setStats] = useState<{
    totalAdded: number;
    totalLikesGot: number;
    totalLikesGiven: number;
    avgLikes: number;
  } | null>(null);

  // Weekly chart
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [weekly, setWeekly] = useState<number[]>(Array(7).fill(0));

  // Lists
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [trending, setTrending] = useState<ListItem[]>([]);

  const [likesGivenLoading, setLikesGivenLoading] = useState(false);
  const [likesGiven, setLikesGiven] = useState<ListItem[]>([]);

  const [youAddMostLoading, setYouAddMostLoading] = useState(false);
  const [youAddMost, setYouAddMost] = useState<ListItem[]>([]);

  const [yourTopLikedLoading, setYourTopLikedLoading] = useState(false);
  const [yourTopLiked, setYourTopLiked] = useState<ListItem[]>([]);

  // Recommendation
  const [recLoading, setRecLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [rec, setRec] = useState<Recommendation>(null);

  // Loaders
  const loadStats = useCallback(async () => {
    if (!roomId) return;
    setStatsLoading(true);
    try {
      const data = await getStats(roomId);
      setStats({
        totalAdded: data.totalAdded ?? 0,
        totalLikesGot: data.totalLikesGot ?? 0,
        totalLikesGiven: data.totalLikesGiven ?? 0,
        avgLikes: data.avgLikes ?? 0,
      });
    } finally {
      setStatsLoading(false);
    }
  }, [roomId]);

  const loadWeekly = useCallback(async () => {
    if (!roomId) return;
    setWeeklyLoading(true);
    try {
      const data = await getWeeklyAdds(roomId);
      setWeekly(
        Array.isArray(data.counts) && data.counts.length === 7
          ? data.counts
          : Array(7).fill(0)
      );
    } finally {
      setWeeklyLoading(false);
    }
  }, [roomId]);

  const loadTrending = useCallback(async () => {
    if (!roomId) return;
    setTrendingLoading(true);
    try {
      const items = await getTrending(roomId, 10);
      setTrending(items);
    } finally {
      setTrendingLoading(false);
    }
  }, [roomId]);

  const loadLikesGiven = useCallback(async () => {
    if (!roomId) return;
    setLikesGivenLoading(true);
    try {
      const items = await getLikesGivenTop(roomId, 10);
      setLikesGiven(items);
    } finally {
      setLikesGivenLoading(false);
    }
  }, [roomId]);

  const loadYouAdd = useCallback(async () => {
    if (!roomId) return;
    setYouAddMostLoading(true);
    try {
      const items = await getYouAddMost(roomId, 10);
      setYouAddMost(items);
    } finally {
      setYouAddMostLoading(false);
    }
  }, [roomId]);

  const loadYourTop = useCallback(async () => {
    if (!roomId) return;
    setYourTopLikedLoading(true);
    try {
      const items = await getYourTopLiked(roomId, 10);
      setYourTopLiked(items);
    } finally {
      setYourTopLikedLoading(false);
    }
  }, [roomId]);

  const loadRecommendation = useCallback(async () => {
    if (!roomId) return;
    setRecLoading(true);
    try {
      const r = await getRecommendation(roomId);
      setRec(r);
    } finally {
      setRecLoading(false);
    }
  }, [roomId]);

  const addRecommendationToQueue = useCallback(
    async (extractedId: string) => {
      if (!roomId || !extractedId) return;
      setAddLoading(true);
      try {
        await addToQueue(roomId, extractedId);
        await loadRecommendation();
      } finally {
        setAddLoading(false);
      }
    },
    [roomId, loadRecommendation]
  );

  const refreshAll = useCallback(async () => {
    await Promise.all([
      loadStats(),
      loadWeekly(),
      loadTrending(),
      loadLikesGiven(),
      loadYouAdd(),
      loadYourTop(),
      loadRecommendation(),
    ]);
  }, [
    loadStats,
    loadWeekly,
    loadTrending,
    loadLikesGiven,
    loadYouAdd,
    loadYourTop,
    loadRecommendation,
  ]);

  // Initial load on room change
  useEffect(() => {
    if (!roomId) return;
    refreshAll();
  }, [roomId, refreshAll]);

  return {
    // Data
    stats,
    weekly,
    trending,
    likesGiven,
    youAddMost,
    yourTopLiked,
    rec,
    // Loading
    statsLoading,
    weeklyLoading,
    trendingLoading,
    likesGivenLoading,
    youAddMostLoading,
    yourTopLikedLoading,
    recLoading,
    addLoading,
    // Actions
    loadStats,
    loadWeekly,
    loadTrending,
    loadLikesGiven,
    loadYouAdd,
    loadYourTop,
    loadRecommendation,
    addRecommendationToQueue,
    refreshAll,
  };
}
