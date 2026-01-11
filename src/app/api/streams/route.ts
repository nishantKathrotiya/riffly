import { prismaClient } from "@/src/app/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
//@ts-ignore
import youtubesearchapi from "youtube-search-api";
import { YT_REGEX } from "@/src/app/lib/utils";
import { getServerSession } from "next-auth";

const CreateStreamSchema = z.object({
  creatorId: z.string(),
  url: z.string(),
});

const MAX_QUEUE_LEN = 20;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
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

    const data = CreateStreamSchema.parse(await req.json());

    if (!data.url.trim()) {
      return NextResponse.json(
        {
          message: "YouTube link cannot be empty",
        },
        {
          status: 400,
        }
      );
    }

    const isYt = data.url.match(YT_REGEX);
    if (!isYt) {
      return NextResponse.json(
        {
          message: "Invalid YouTube URL format",
        },
        {
          status: 400,
        }
      );
    }

    const extractedId = isYt ? isYt[1] : null;
    if (!extractedId) {
      return NextResponse.json(
        {
          message: "Invalid YouTube Video ID",
        },
        {
          status: 400,
        }
      );
    }

    // const res = await youtubesearchapi.GetVideoDetails(extractedId);
    const res = await getVideoInfo(extractedId);

    //Check Time slots
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

    //Find Recent Stream in less than 10 minutes
    const recentStreams = await prismaClient.stream.findMany({
      where: {
        userId: data.creatorId,
        createAt: {
          gte: tenMinutesAgo,
        },
      },
    });

    // Check for duplicate song in the last 10 minutes
    const duplicateSong = recentStreams.find(
      (stream) => stream.extractedId === extractedId
    );
    if (duplicateSong) {
      return NextResponse.json(
        {
          message: "This song was already added in the last 10 minutes",
        },
        {
          status: 429,
        }
      );
    }

    // Check if the user is not the creator
    if (user.id !== data.creatorId) {
      // Rate limiting checks for non-creator users
      const userStreams = recentStreams.filter(
        (stream) => stream.userId === user.id
      );
      const streamsLastTwoMinutes = userStreams.filter(
        (stream) => stream.createAt >= twoMinutesAgo
      );

      if (streamsLastTwoMinutes.length >= 2) {
        return NextResponse.json(
          {
            message:
              "Rate limit exceeded: You can only add 2 songs per 2 minutes",
          },
          {
            status: 429,
          }
        );
      }

      if (userStreams.length >= 10) {
        return NextResponse.json(
          {
            message:
              "Rate limit exceeded: You can only add 10 songs per 10 minutes",
          },
          {
            status: 429,
          }
        );
      }
    }

    const thumbnails = res?.thumbnails;
    thumbnails.sort((a: { width: number }, b: { width: number }) =>
      a.width < b.width ? -1 : 1
    );

    const existingActiveStreams = await prismaClient.stream.count({
      where: {
        userId: data.creatorId,
        played: false,
      },
    });

    if (existingActiveStreams >= MAX_QUEUE_LEN) {
      return NextResponse.json(
        {
          message: "Queue is full",
        },
        {
          status: 429,
        }
      );
    }

    const stream = await prismaClient.stream.create({
      data: {
        userId: data.creatorId,
        url: data.url,
        extractedId,
        type: "Youtube",
        title: res?.title ?? "Can't find video",
        smallImg:
          (thumbnails.length > 1 ? thumbnails[2].url : thumbnails[2].url) ??
          "https://cdn.pixabay.com/photo/2024/02/28/07/42/european-shorthair-8601492_640.jpg",
        bigImg:
          thumbnails[2].url ??
          "https://cdn.pixabay.com/photo/2024/02/28/07/42/european-shorthair-8601492_640.jpg",
        addedById: user.id,
      },
    });

    // Event-driven analytics updates (non-blocking best-effort)
    try {
      const now = new Date();
      // 1) Increment totalAdded for the user in this room
      await prismaClient.userRoomStats.upsert({
        where: {
          userId_roomId: {
            userId: user.id,
            roomId: data.creatorId,
          },
        },
        update: {
          totalAdded: { increment: 1 },
          lastUpdated: now,
        },
        create: {
          userId: user.id,
          roomId: data.creatorId,
          totalAdded: 1,
          totalLikesGot: 0,
          totalLikesGiven: 0,
          lastUpdated: now,
        },
      });

      // 2) Initialize trending row for this stream
      await prismaClient.roomStreamTrending.upsert({
        where: {
          roomId_extractedId: {
            roomId: data.creatorId,
            extractedId,
          },
        },
        update: {
          trendingScore: { increment: 1 },
        },
        create: {
          roomId: data.creatorId,
          extractedId,
          trendingScore: 1,
        },
      });
    } catch (err) {
      console.error("Analytics init failed for stream add", err);
    }

    return NextResponse.json({
      ...stream,
      hasUpvoted: false,
      upvotes: 0,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      {
        message: "Error while adding a stream",
      },
      {
        status: 500,
      }
    );
  }
}

export async function GET(req: NextRequest) {
  const creatorId = req.nextUrl.searchParams.get("creatorId");
  const session = await getServerSession();
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

  if (!creatorId) {
    return NextResponse.json(
      {
        message: "Error",
      },
      {
        status: 411,
      }
    );
  }

  const [streams, activeStream] = await Promise.all([
    prismaClient.stream.findMany({
      where: {
        userId: creatorId,
        played: false,
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
        addedBy: {
          select: {
            email: true,
          },
        },
        _count: {
          select: {
            upvotes: true,
          },
        },
        upvotes: {
          where: {
            userId: user.id,
          },
        },
      },
      orderBy: [
        { upvotes: { _count: "desc" } }, // Sort by the count of upvotes
        { createAt: "asc" }, // Then by creation date
      ],
    }),
    prismaClient.currentStream.findFirst({
      where: {
        userId: creatorId,
      },
      include: {
        stream: {
          include: {
            addedBy: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const isCreator = user.id === creatorId;
  console.log(JSON.stringify(activeStream, null, 2));
  return NextResponse.json({
    streams: streams.map(({ _count, ...rest }) => ({
      ...rest,
      upvotes: _count.upvotes,
      haveUpvoted: rest.upvotes.length ? true : false,
    })),
    activeStream,
    creatorId,
    isCreator,
  });
}

async function getVideoInfo(videoId: string) {
  const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
  const response = await fetch(oEmbedUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch oEmbed data: ${response.statusText}`);
  }

  const data = await response.json();

  const baseThumbUrl = `https://img.youtube.com/vi/${videoId}`;

  return {
    title: data.title,
    thumbnails: [
      { url: `${baseThumbUrl}/default.jpg`, width: 120 },
      { url: data.thumbnail_url, width: 480 },
      { url: `${baseThumbUrl}/maxresdefault.jpg`, width: 1280 },
    ],
    channel_name: data.author_name,
    channel_url: data.author_url,
  };
}
