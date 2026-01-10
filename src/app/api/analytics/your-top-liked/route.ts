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

    // Upvotes on streams owned by the user in this room, grouped by extractedId
    const ups = await prismaClient.upvote.findMany({
      where: { stream: { userId: roomId, addedById: user.id } },
      select: {
        stream: { select: { extractedId: true, title: true, smallImg: true } },
      },
    });

    const counter = new Map<
      string,
      { count: number; title?: string | null; smallImg?: string | null }
    >();
    for (const u of ups) {
      const ex = u.stream?.extractedId;
      if (!ex) continue;
      const prev = counter.get(ex) || {
        count: 0,
        title: u.stream?.title,
        smallImg: u.stream?.smallImg,
      };
      counter.set(ex, {
        count: prev.count + 1,
        title: prev.title ?? u.stream?.title,
        smallImg: prev.smallImg ?? u.stream?.smallImg,
      });
    }

    const items = Array.from(counter.entries())
      .map(([extractedId, v]) => ({
        extractedId,
        count: v.count,
        title: v.title ?? null,
        smallImg: v.smallImg ?? null,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return NextResponse.json({ roomId, items });
  } catch (e) {
    console.error("/api/analytics/your-top-liked error", e);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}
