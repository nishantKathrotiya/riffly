import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Trending window for plays (3 hours)
const TRENDING_WINDOW_MS = 3 * 60 * 60 * 1000;

async function getAllRooms() {
  const rows = await prisma.stream.findMany({
    distinct: ["userId"],
    select: { userId: true },
  });
  return rows.map((r) => r.userId);
}

async function backfillUserRoomStats(roomId) {
  const now = new Date();

  // All users who interacted in the room
  const streams = await prisma.stream.findMany({
    where: { userId: roomId },
    select: { id: true, addedById: true },
  });

  const participants = new Set();
  streams.forEach((s) => participants.add(s.addedById));

  const streamIds = streams.map((s) => s.id);

  if (streamIds.length > 0) {
    const upvoters = await prisma.upvote.findMany({
      where: { streamId: { in: streamIds } },
      select: { userId: true },
    });
    upvoters.forEach((u) => participants.add(u.userId));
  }

  for (const userId of participants) {
    const [totalAdded, totalLikesGot, totalLikesGiven] = await Promise.all([
      prisma.stream.count({
        where: { userId: roomId, addedById: userId },
      }),
      prisma.upvote.count({
        where: { stream: { userId: roomId, addedById: userId } },
      }),
      prisma.upvote.count({
        where: { userId, stream: { userId: roomId } },
      }),
    ]);

    await prisma.userRoomStats.upsert({
      where: { userId_roomId: { userId, roomId } },
      update: {
        totalAdded,
        totalLikesGot,
        totalLikesGiven,
        lastUpdated: now,
      },
      create: {
        userId,
        roomId,
        totalAdded,
        totalLikesGot,
        totalLikesGiven,
      },
    });
  }
}

async function backfillRoomTrending(roomId) {
  const windowStart = new Date(Date.now() - TRENDING_WINDOW_MS);

  // Load streams in room
  const streams = await prisma.stream.findMany({
    where: { userId: roomId },
    select: {
      id: true,
      extractedId: true,
      playedTs: true,
    },
  });

  // Group streamIds by extractedId
  const streamsBySong = new Map();
  for (const s of streams) {
    if (!streamsBySong.has(s.extractedId)) {
      streamsBySong.set(s.extractedId, []);
    }
    streamsBySong.get(s.extractedId).push(s.id);
  }

  for (const [extractedId, streamIds] of streamsBySong.entries()) {
    const recentPlays = streams.filter(
      (s) =>
        s.extractedId === extractedId && s.playedTs && s.playedTs >= windowStart
    ).length;

    const recentUpvotes = await prisma.upvote.count({
      where: { streamId: { in: streamIds } },
    });

    const trendingScore = recentUpvotes * 2 + recentPlays;

    if (trendingScore === 0) continue;

    await prisma.roomStreamTrending.upsert({
      where: {
        roomId_extractedId: {
          roomId,
          extractedId,
        },
      },
      update: {
        recentUpvotes,
        recentPlays,
        trendingScore,
      },
      create: {
        roomId,
        extractedId,
        recentUpvotes,
        recentPlays,
        trendingScore,
      },
    });
  }
}

async function main() {
  const rooms = await getAllRooms();
  console.log(`Found ${rooms.length} room(s)`);

  for (const roomId of rooms) {
    console.log(`Backfilling room: ${roomId}`);
    await backfillUserRoomStats(roomId);
    await backfillRoomTrending(roomId);
  }

  console.log("✅ Analytics backfill completed");
}

main()
  .catch((e) => {
    console.error("❌ Backfill failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
