import { prismaClient } from "@/src/app/lib/db";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
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
  console.log("before first call");

  const mostUpvotedStream = await prismaClient.stream.findFirst({
    where: {
      userId: user.id,
      played: false,
    },
    orderBy: [
      { upvotes: { _count: "desc" } }, // Sort by count of upvotes (descending)
      { createAt: "asc" }, // Then by creation date (ascending)
    ],
  });
  console.log("after first call");
  console.log(mostUpvotedStream?.id);

  await Promise.all([
    prismaClient.currentStream.upsert({
      where: {
        userId: user.id,
      },
      update: {
        userId: user.id,
        streamId: mostUpvotedStream?.id,
      },
      create: {
        userId: user.id,
        streamId: mostUpvotedStream?.id,
      },
    }),
    prismaClient.stream.update({
      where: {
        id: mostUpvotedStream?.id ?? "",
      },
      data: {
        played: true,
        playedTs: new Date(),
      },
    }),
  ]);

  // Update trending for the played stream

  try {
    if (mostUpvotedStream) {
      await prismaClient.roomStreamTrending.upsert({
        where: {
          roomId_extractedId: {
            roomId: user.id,
            extractedId: mostUpvotedStream.extractedId,
          },
        },
        update: {
          recentPlays: { increment: 1 },
          trendingScore: { increment: 1 },
        },
        create: {
          roomId: user.id,
          extractedId: mostUpvotedStream.extractedId,
          recentPlays: 1,
          trendingScore: 1,
        },
      });
    }
  } catch (err) {
    console.error("Trending update failed on play", err);
  }

  return NextResponse.json({
    stream: mostUpvotedStream,
  });
}
