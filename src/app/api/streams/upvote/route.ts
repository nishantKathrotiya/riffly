import { prismaClient } from "@/src/app/lib/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const UpvoteSchema = z.object({
  streamId: z.string(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession();

  // TODO: You can get rid of the db call here
  const user = await prismaClient.user.findFirst({
    where: {
      email: session?.user?.email ?? "",
    },
  });

  if (!user) {
    return NextResponse.json(
      {
        message: "Unauthenticated",
      },
      {
        status: 403,
      }
    );
  }

  try {
    const data = UpvoteSchema.parse(await req.json());
    const upvote = await prismaClient.upvote.create({
      data: {
        userId: user.id,
        streamId: data.streamId,
      },
    });

    // Analytics updates (best-effort)
    try {
      const stream = await prismaClient.stream.findUnique({
        where: { id: data.streamId },
        select: { userId: true, addedById: true, id: true, extractedId: true },
      });
      if (stream) {
        const roomId = stream.userId;
        const ownerId = stream.addedById;
        const now = new Date();

        await Promise.all([
          // Increment likes given for voter in this room
          prismaClient.userRoomStats.upsert({
            where: { userId_roomId: { userId: user.id, roomId } },
            update: { totalLikesGiven: { increment: 1 }, lastUpdated: now },
            create: {
              userId: user.id,
              roomId,
              totalAdded: 0,
              totalLikesGot: 0,
              totalLikesGiven: 1,
              lastUpdated: now,
            },
          }),
          // Increment likes got for owner in this room
          prismaClient.userRoomStats.upsert({
            where: { userId_roomId: { userId: ownerId, roomId } },
            update: { totalLikesGot: { increment: 1 }, lastUpdated: now },
            create: {
              userId: ownerId,
              roomId,
              totalAdded: 0,
              totalLikesGot: 1,
              totalLikesGiven: 0,
              lastUpdated: now,
            },
          }),
          // Trending: increment recentUpvotes and recompute score
          prismaClient.roomStreamTrending.upsert({
            where: { id: stream.id },
            update: {
              roomId,
              streamId: stream.id,
              extractedId: stream.extractedId,
              recentUpvotes: { increment: 1 },
              trendingScore: undefined as unknown as number, // placeholder, set below
              lastUpdated: now,
            },
            create: {
              id: stream.id,
              roomId,
              streamId: stream.id,
              extractedId: stream.extractedId,
              recentUpvotes: 1,
              recentPlays: 0,
              trendingScore: 2,
              lastUpdated: now,
            },
          }),
        ]);

        // Recompute trendingScore precisely after upsert (recentUpvotes*2 + recentPlays)
        const t = await prismaClient.roomStreamTrending.findUnique({
          where: { id: stream.id },
        });
        if (t) {
          const newScore = (t.recentUpvotes ?? 0) * 2 + (t.recentPlays ?? 0);
          await prismaClient.roomStreamTrending.update({
            where: { id: stream.id },
            data: { trendingScore: newScore, lastUpdated: now },
          });
        }
      }
    } catch (err) {
      console.error("Analytics update failed on upvote", err);
    }
    return NextResponse.json({
      message: "Done!",
    });
  } catch (e) {
    return NextResponse.json(
      {
        message: "Error while upvoting",
      },
      {
        status: 403,
      }
    );
  }
}
