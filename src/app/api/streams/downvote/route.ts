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
    await prismaClient.upvote.delete({
      where: {
        userId_streamId: {
          userId: user.id,
          streamId: data.streamId,
        },
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

        // Fetch current trending row to compute decremented values safely
        const t = await prismaClient.roomStreamTrending.findUnique({
          where: { id: stream.id },
        });
        const currentUp = t?.recentUpvotes ?? 0;
        const currentPlays = t?.recentPlays ?? 0;
        const nextUp = currentUp > 0 ? currentUp - 1 : 0;
        const newScore = nextUp * 2 + currentPlays;

        await Promise.all([
          prismaClient.userRoomStats.upsert({
            where: { userId_roomId: { userId: user.id, roomId } },
            update: { totalLikesGiven: { decrement: 1 }, lastUpdated: now },
            create: {
              userId: user.id,
              roomId,
              totalAdded: 0,
              totalLikesGot: 0,
              totalLikesGiven: 0,
              lastUpdated: now,
            },
          }),
          prismaClient.userRoomStats.upsert({
            where: { userId_roomId: { userId: ownerId, roomId } },
            update: { totalLikesGot: { decrement: 1 }, lastUpdated: now },
            create: {
              userId: ownerId,
              roomId,
              totalAdded: 0,
              totalLikesGot: 0,
              totalLikesGiven: 0,
              lastUpdated: now,
            },
          }),
          prismaClient.roomStreamTrending.upsert({
            where: { id: stream.id },
            update: {
              roomId,
              streamId: stream.id,
              extractedId: stream.extractedId,
              recentUpvotes: nextUp,
              trendingScore: newScore,
              lastUpdated: now,
            },
            create: {
              id: stream.id,
              roomId,
              streamId: stream.id,
              extractedId: stream.extractedId,
              recentUpvotes: 0,
              recentPlays: 0,
              trendingScore: 0,
              lastUpdated: now,
            },
          }),
        ]);
      }
    } catch (err) {
      console.error("Analytics update failed on downvote", err);
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
