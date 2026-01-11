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
        select: {
          userId: true, // roomId
          addedById: true, // song owner
          extractedId: true,
        },
      });

      if (!stream) return;

      const roomId = stream.userId;
      const ownerId = stream.addedById;
      const extractedId = stream.extractedId;
      const now = new Date();

      // Fetch current trending stats for this song in this room
      const trending = await prismaClient.roomStreamTrending.findUnique({
        where: {
          roomId_extractedId: {
            roomId,
            extractedId,
          },
        },
        select: {
          recentUpvotes: true,
          recentPlays: true,
        },
      });

      const currentUpvotes = trending?.recentUpvotes ?? 0;
      const currentPlays = trending?.recentPlays ?? 0;

      const nextUpvotes = Math.max(0, currentUpvotes - 1);
      const newScore = nextUpvotes * 2 + currentPlays;

      await Promise.all([
        // User who downvoted
        prismaClient.userRoomStats.upsert({
          where: {
            userId_roomId: { userId: user.id, roomId },
          },
          update: {
            totalLikesGiven: { decrement: 1 },
            lastUpdated: now,
          },
          create: {
            userId: user.id,
            roomId,
            totalAdded: 0,
            totalLikesGot: 0,
            totalLikesGiven: 0,
            lastUpdated: now,
          },
        }),

        // Song owner
        prismaClient.userRoomStats.upsert({
          where: {
            userId_roomId: { userId: ownerId, roomId },
          },
          update: {
            totalLikesGot: { decrement: 1 },
            lastUpdated: now,
          },
          create: {
            userId: ownerId,
            roomId,
            totalAdded: 0,
            totalLikesGot: 0,
            totalLikesGiven: 0,
            lastUpdated: now,
          },
        }),

        // Trending aggregation (song-level)
        prismaClient.roomStreamTrending.upsert({
          where: {
            roomId_extractedId: {
              roomId,
              extractedId,
            },
          },
          update: {
            recentUpvotes: nextUpvotes,
            trendingScore: newScore,
            lastUpdated: now,
          },
          create: {
            roomId,
            extractedId,
            recentUpvotes: 0,
            recentPlays: 0,
            trendingScore: 0,
            lastUpdated: now,
          },
        }),
      ]);
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
