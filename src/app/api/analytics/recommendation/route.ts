import { prismaClient } from "@/src/app/lib/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

// Windows
const NOT_PLAYED_RECENT_MS = 20 * 60 * 1000; // 20 minutes
const TIME_SIMILARITY_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    const user = await prismaClient.user.findFirst({
      where: { email: session?.user?.email ?? "" },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ message: "Unauthenticated" }, { status: 403 });
    }

    const roomId = req.nextUrl.searchParams.get("roomId");
    if (!roomId) {
      return NextResponse.json(
        { message: "roomId is required" },
        { status: 400 }
      );
    }

    const now = Date.now();
    const notPlayedSince = new Date(now - NOT_PLAYED_RECENT_MS);
    const timeSimStart = new Date(now - TIME_SIMILARITY_WINDOW_MS);

    // Exclude: currently in queue and recently played
    const [queued, recentlyPlayed] = await Promise.all([
      prismaClient.stream.findMany({
        where: { userId: roomId, played: false },
        select: { extractedId: true },
      }),
      prismaClient.stream.findMany({
        where: { userId: roomId, playedTs: { gte: notPlayedSince } },
        select: { extractedId: true },
      }),
    ]);

    const excluded = new Set<string>([
      ...queued.map((s) => s.extractedId),
      ...recentlyPlayed.map((s) => s.extractedId),
    ]);

    // Candidate pool: top trending + user's historically successful adds (in this room)
    const [trendingRows, userOwnedUps, sampleStreams, timeSimPlays] =
      await Promise.all([
        prismaClient.roomStreamTrending.findMany({
          where: { roomId },
          orderBy: [{ trendingScore: "desc" }, { lastUpdated: "desc" }],
          take: 50,
          select: { extractedId: true, trendingScore: true },
        }),
        prismaClient.upvote.findMany({
          where: { stream: { userId: roomId, addedById: user.id } },
          select: { stream: { select: { extractedId: true } } },
        }),
        prismaClient.stream.findMany({
          where: { userId: roomId },
          orderBy: { createAt: "desc" },
          take: 200,
          select: {
            extractedId: true,
            title: true,
            smallImg: true,
            bigImg: true,
          },
        }),
        prismaClient.stream.findMany({
          where: { userId: roomId, playedTs: { gte: timeSimStart } },
          select: { extractedId: true },
        }),
      ]);

    const sampleByEx = new Map(sampleStreams.map((s) => [s.extractedId, s]));

    // Aggregate user success (likes got on user's songs) per extractedId
    const userSuccess = new Map<string, number>();
    for (const u of userOwnedUps) {
      const ex = u.stream?.extractedId;
      if (!ex) continue;
      userSuccess.set(ex, (userSuccess.get(ex) ?? 0) + 1);
    }

    // Aggregate trending score per extractedId (max in room)
    const roomContext = new Map<string, number>();
    for (const t of trendingRows) {
      if (!t.extractedId) continue;
      roomContext.set(
        t.extractedId,
        Math.max(roomContext.get(t.extractedId) ?? 0, t.trendingScore ?? 0)
      );
    }

    // Aggregate time similarity counts per extractedId
    const timeSimCounts = new Map<string, number>();
    for (const p of timeSimPlays) {
      timeSimCounts.set(
        p.extractedId,
        (timeSimCounts.get(p.extractedId) ?? 0) + 1
      );
    }

    // Build candidate set from trending and userSuccess keys
    const candidateSet = new Set<string>();
    Array.from(roomContext.keys()).forEach((k) => candidateSet.add(k));
    Array.from(userSuccess.keys()).forEach((k) => candidateSet.add(k));

    // Remove excluded candidates
    const candidates = Array.from(candidateSet).filter(
      (ex) => ex && !excluded.has(ex)
    );

    // Score candidates
    type Scored = {
      extractedId: string;
      score: number;
      parts: { user: number; room: number; time: number };
    };
    const scored: Scored[] = candidates.map((ex) => {
      const userScore = userSuccess.get(ex) ?? 0; // likes you got on this exId
      const roomScore = roomContext.get(ex) ?? 0; // trending score now
      const timeScore = timeSimCounts.get(ex) ?? 0; // recent plays count

      const score = userScore * 0.5 + roomScore * 0.3 + timeScore * 0.2;
      return {
        extractedId: ex,
        score,
        parts: { user: userScore, room: roomScore, time: timeScore },
      };
    });

    scored.sort((a, b) => b.score - a.score);
    const best = scored[0] || null;

    const payload = best
      ? {
          extractedId: best.extractedId,
          score: best.score,
          parts: best.parts,
          sample: sampleByEx.get(best.extractedId) || null,
        }
      : null;

    return NextResponse.json({ roomId, recommendation: payload });
  } catch (e) {
    console.error("/api/analytics/recommendation error", e);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}
