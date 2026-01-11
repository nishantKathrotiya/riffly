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
} from "@/src/app/intigrations/integration";

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
  const [rec, setRec] = useState<Recommendation[]>([]);

  // Use LOCAL timezone for week computations so UI picker and initial state align
  function sundayOf(date: Date) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dow = d.getDay();
    d.setDate(d.getDate() - dow); // move to local Sunday
    d.setHours(0, 0, 0, 0); // local midnight
    return d;
  }
  function iso(d: Date) {
    return d.toISOString();
  }
  function addDays(d: Date, n: number) {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  }
  // const setWeek = useCallback((d: Date) => setWeekStart(d), []);

  // In useAnalytics.ts, update the setWeek function:
  const setWeek = useCallback((d: Date) => {
    console.log("Setting week to:", d);
    setWeekStart(d);
  }, []);

  // state: selected week
  const [weekStart, setWeekStart] = useState<Date>(() => sundayOf(new Date()));
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);

  // prevent going to future weeks
  const canGoNext = useMemo(() => {
    const currentWeekStart = sundayOf(new Date());
    return weekStart < currentWeekStart;
  }, [weekStart]);

  // navigation actions
  const prevWeek = useCallback(() => setWeekStart((d) => addDays(d, -7)), []);
  const nextWeek = useCallback(
    () => setWeekStart((d) => (canGoNext ? addDays(d, 7) : d)),
    [canGoNext]
  );
  const resetToCurrentWeek = useCallback(
    () => setWeekStart(sundayOf(new Date())),
    []
  );

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

  // modify loadWeekly to pass weekStart
  const loadWeekly = useCallback(async () => {
    if (!roomId) return;
    setWeeklyLoading(true);
    try {
      const data = await getWeeklyAdds(roomId, iso(weekStart));
      setWeekly(
        Array.isArray(data.counts) && data.counts.length === 7
          ? data.counts
          : Array(7).fill(0)
      );
    } finally {
      setWeeklyLoading(false);
    }
  }, [roomId, weekStart]);

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
      setRec(Array.isArray(r) ? r : []);
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
    // Intentionally exclude loadWeekly so week changes don't retrigger all APIs.
    await Promise.all([
      loadStats(),
      loadTrending(),
      loadLikesGiven(),
      loadYouAdd(),
      loadYourTop(),
      loadRecommendation(),
    ]);
  }, [
    loadStats,
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

  // trigger weekly reload when week changes
  useEffect(() => {
    if (roomId) loadWeekly();
  }, [roomId, weekStart, loadWeekly]);

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

    weekStart,
    weekEnd,
    canGoNext,
    prevWeek,
    nextWeek,
    resetToCurrentWeek,
    setWeek,
  };
}
