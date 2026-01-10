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
    if (!roomId) {
      return NextResponse.json(
        { message: "roomId is required" },
        { status: 400 }
      );
    }

    const stats = await prismaClient.userRoomStats.findUnique({
      where: { userId_roomId: { userId: user.id, roomId } },
    });

    const totalAdded = stats?.totalAdded ?? 0;
    const totalLikesGot = stats?.totalLikesGot ?? 0;
    const totalLikesGiven = stats?.totalLikesGiven ?? 0;
    const avgLikes = totalAdded > 0 ? totalLikesGot / totalAdded : 0;

    return NextResponse.json({
      roomId,
      totalAdded,
      totalLikesGot,
      totalLikesGiven,
      avgLikes,
      lastUpdated: stats?.lastUpdated ?? null,
    });
  } catch (e) {
    console.error("/api/analytics/stats error", e);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}
