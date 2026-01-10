/*
 Backfill analytics tables from existing Stream and Upvote data.
 NOTE: Current Upvote model has no createdAt timestamp, so `recentUpvotes`
 is computed as total upvotes per stream. `recentPlays` uses playedTs within window.
 Adjust in a future migration if per-upvote timestamps are added.
*/

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Trending window in milliseconds (3 hours)
const TRENDING_WINDOW_MS = 3 * 60 * 60 * 1000;

async function getAllRoomIds() {
  const rows = await prisma.stream.findMany({
    distinct: ["userId"],
    select: { userId: true },
  });
  return rows.map((r) => r.userId);
}

async function getParticipantsForRoom(roomId) {
  // Users who added songs in the room
  const streams = await prisma.stream.findMany({
    where: { userId: roomId },
    select: { addedById: true },
  });
  const adders = new Set(streams.map((s) => s.addedById));

  // Users who upvoted in the room
  const upvoters = new Set();
  const upvoteStreams = await prisma.stream.findMany({
    where: { userId: roomId },
    select: { id: true },
  });
  const streamIds = upvoteStreams.map((s) => s.id);
  if (streamIds.length > 0) {
    const ups = await prisma.upvote.findMany({
      where: { streamId: { in: streamIds } },
      select: { userId: true },
    });
    ups.forEach((u) => upvoters.add(u.userId));
  }

  const all = new Set([...adders, ...upvoters]);
  return Array.from(all);
}

async function computeUserStatsForRoom(roomId, userId) {
  const totalAdded = await prisma.stream.count({
    where: { userId: roomId, addedById: userId },
  });

  const totalLikesGot = await prisma.upvote.count({
    where: { stream: { userId: roomId, addedById: userId } },
  });

  const totalLikesGiven = await prisma.upvote.count({
    where: { userId, stream: { userId: roomId } },
  });

  return { totalAdded, totalLikesGot, totalLikesGiven };
}

async function backfillUserRoomStats(roomId) {
  const participants = await getParticipantsForRoom(roomId);
  const now = new Date();

  for (const userId of participants) {
    const { totalAdded, totalLikesGot, totalLikesGiven } =
      await computeUserStatsForRoom(roomId, userId);

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
        lastUpdated: now,
      },
    });
  }
}

async function backfillRoomTrending(roomId) {
  const windowStart = new Date(Date.now() - TRENDING_WINDOW_MS);

  // Pull candidate streams for this room
  const streams = await prisma.stream.findMany({
    where: { userId: roomId },
    select: { id: true, extractedId: true, playedTs: true },
  });

  // Preload total upvotes per stream (no createdAt on Upvote yet)
  const streamIds = streams.map((s) => s.id);
  const upvotesByStream = new Map();
  if (streamIds.length > 0) {
    const ups = await prisma.upvote.groupBy({
      by: ["streamId"],
      where: { streamId: { in: streamIds } },
      _count: { streamId: true },
    });
    ups.forEach((row) =>
      upvotesByStream.set(row.streamId, row._count.streamId)
    );
  }

  const rows = [];
  for (const s of streams) {
    const recentUpvotes = upvotesByStream.get(s.id) || 0;
    const recentPlays = s.playedTs && s.playedTs >= windowStart ? 1 : 0;
    const trendingScore = recentUpvotes * 2 + recentPlays;

    // Only store rows with some signal
    if (trendingScore > 0) {
      rows.push({
        roomId,
        streamId: s.id,
        extractedId: s.extractedId,
        recentUpvotes,
        recentPlays,
        trendingScore,
        lastUpdated: new Date(),
      });
    }
  }

  // Replace existing trending rows for the room (idempotent backfill)
  await prisma.roomStreamTrending.deleteMany({ where: { roomId } });
  if (rows.length > 0) {
    // createMany for efficiency
    await prisma.roomStreamTrending.createMany({ data: rows });
  }
}

async function main() {
  const rooms = await getAllRoomIds();
  console.log(`Found ${rooms.length} room(s).`);

  for (const roomId of rooms) {
    console.log(`Backfilling room ${roomId} ...`);
    await prisma.$transaction(async (tx) => {
      // Use tx for future per-room transactional consistency if desired
      // For now, use prisma directly for simplicity within this scope
      await backfillUserRoomStats(roomId);
      await backfillRoomTrending(roomId);
    });
  }

  console.log("Backfill complete.");
}

main()
  .catch((e) => {
    console.error("Backfill failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
