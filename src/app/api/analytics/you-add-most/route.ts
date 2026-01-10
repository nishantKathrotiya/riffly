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

    // Group by extractedId for streams added by the user in this room
    const grouped = await prismaClient.stream.groupBy({
      by: ["extractedId"],
      where: { userId: roomId, addedById: user.id },
      _count: { _all: true },
    });

    const exIds = grouped.map((g) => g.extractedId);
    const samples = exIds.length
      ? await prismaClient.stream.findMany({
          where: { userId: roomId, extractedId: { in: exIds } },
          orderBy: { createAt: "desc" },
          select: { extractedId: true, title: true, smallImg: true },
        })
      : [];

    const sampleMap = new Map(samples.map((s) => [s.extractedId, s]));
    const items = grouped
      .map((g) => ({
        extractedId: g.extractedId,
        count: (g as any)._count?._all ?? 0,
        title: sampleMap.get(g.extractedId)?.title ?? null,
        smallImg: sampleMap.get(g.extractedId)?.smallImg ?? null,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return NextResponse.json({ roomId, items });
  } catch (e) {
    console.error("/api/analytics/you-add-most error", e);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}
