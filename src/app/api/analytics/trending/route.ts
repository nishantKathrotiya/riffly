import { prismaClient } from "@/src/app/lib/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

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
    const limitParam = req.nextUrl.searchParams.get("limit");
    const limit = Math.min(
      Math.max(parseInt(limitParam || "10", 10) || 10, 1),
      25
    );

    if (!roomId) {
      return NextResponse.json(
        { message: "roomId is required" },
        { status: 400 }
      );
    }

    const rows = await prismaClient.roomStreamTrending.findMany({
      where: { roomId },
      orderBy: [{ trendingScore: "desc" }, { lastUpdated: "desc" }],
      take: limit,
    });

    const streamIds = rows.map((r) => r.streamId).filter(Boolean);
    const streams = streamIds.length
      ? await prismaClient.stream.findMany({
          where: { id: { in: streamIds } },
          select: {
            id: true,
            extractedId: true,
            title: true,
            smallImg: true,
            bigImg: true,
            addedById: true,
          },
        })
      : [];

    const byId = new Map(streams.map((s) => [s.id, s]));
    const data = rows.map((r) => ({
      ...r,
      stream: byId.get(r.streamId) || null,
    }));

    return NextResponse.json({ roomId, items: data });
  } catch (e) {
    console.error("/api/analytics/trending error", e);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}
