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

    const streams = await prismaClient.stream.findMany({
      where: { userId: roomId, addedById: user.id },
      select: { createAt: true },
    });

    const counts = Array(7).fill(0) as number[];
    for (const s of streams) {
      const d = new Date(s.createAt);
      const dow = d.getUTCDay();
      counts[dow] += 1;
    }

    return NextResponse.json({ roomId, counts });
  } catch (e) {
    console.error("/api/analytics/weekly-adds error", e);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}
