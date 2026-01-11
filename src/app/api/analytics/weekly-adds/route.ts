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

    const weekStartParam = req.nextUrl.searchParams.get("weekStart");
    // If client provided weekStart, treat it as the exact UTC boundary for the start of week (already converted from user's local Sunday)
    // Otherwise, default to current UTC week's Sunday.
    let sunday = weekStartParam ? new Date(weekStartParam) : new Date();
    if (!weekStartParam) {
      const base = new Date(
        Date.UTC(
          sunday.getUTCFullYear(),
          sunday.getUTCMonth(),
          sunday.getUTCDate()
        )
      );
      const dow = base.getUTCDay();
      base.setUTCDate(base.getUTCDate() - dow);
      base.setUTCHours(0, 0, 0, 0);
      sunday = base;
    }
    const saturdayEnd = new Date(sunday.getTime() + 7 * 24 * 3600 * 1000); // exclusive

    const streams = await prismaClient.stream.findMany({
      where: {
        userId: roomId,
        addedById: user.id,
        createAt: { gte: sunday, lt: saturdayEnd },
      },
      select: { createAt: true },
    });

    const counts = Array(7).fill(0) as number[];
    const dayMs = 24 * 3600 * 1000;
    for (const s of streams) {
      const t = new Date(s.createAt).getTime();
      // index relative to exact UTC instant provided by client as weekStart
      const idx = Math.floor((t - sunday.getTime()) / dayMs);
      if (idx >= 0 && idx < 7) counts[idx] += 1;
    }

    return NextResponse.json({
      roomId,
      counts,
      weekStart: sunday.toISOString(),
      weekEnd: new Date(saturdayEnd.getTime() - 1).toISOString(), // inclusive end representation
    });
  } catch (e) {
    console.error("/api/analytics/weekly-adds error", e);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}
