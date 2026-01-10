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
    if (mostUpvotedStream?.id) {
      const t = await prismaClient.roomStreamTrending.findUnique({
        where: { id: mostUpvotedStream.id },
      });
      const currentUp = t?.recentUpvotes ?? 0;
      const currentPlays = t?.recentPlays ?? 0;
      const nextPlays = currentPlays + 1;
      const newScore = currentUp * 2 + nextPlays;

      await prismaClient.roomStreamTrending.upsert({
        where: { id: mostUpvotedStream.id },
        update: {
          roomId: user.id,
          streamId: mostUpvotedStream.id,
          extractedId: mostUpvotedStream.extractedId,
          recentPlays: nextPlays,
          trendingScore: newScore,
          lastUpdated: new Date(),
        },
        create: {
          id: mostUpvotedStream.id,
          roomId: user.id,
          streamId: mostUpvotedStream.id,
          extractedId: mostUpvotedStream.extractedId,
          recentUpvotes: 0,
          recentPlays: 1,
          trendingScore: 1,
          lastUpdated: new Date(),
        },
      });
    }
  } catch (err) {
    console.error("Trending update failed on next", err);
  }

  return NextResponse.json({
    stream: mostUpvotedStream,
  });
}
