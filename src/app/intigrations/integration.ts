export type ListItem = {
  id: string;
  title: string;
  img?: string | null;
  right: string | number;
};

async function jsonOrThrow(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (data && (data.message || data.error)) ||
      `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data as any;
}

export async function getStats(roomId: string) {
  const res = await fetch(`/api/analytics/stats?roomId=${roomId}`);
  return jsonOrThrow(res);
}

export async function getWeeklyAdds(
  roomId: string,
  weekStartISO?: string
): Promise<{
  roomId: string;
  counts: number[];
  weekStart: string;
  weekEnd: string;
}> {
  const qs = new URLSearchParams({ roomId });
  if (weekStartISO) qs.set("weekStart", weekStartISO);
  const res = await fetch(`/api/analytics/weekly-adds?${qs.toString()}`, {
    cache: "no-store",
  });
  return jsonOrThrow(res);
}

export async function getTrending(roomId: string, limit = 10) {
  const res = await fetch(
    `/api/analytics/trending?roomId=${roomId}&limit=${limit}`
  );
  const data = await jsonOrThrow(res);
  const items: ListItem[] = Array.isArray(data.items)
    ? data.items.map((r: any) => ({
        id: r.streamId ?? r.id,
        title: r.stream?.title ?? r.extractedId ?? "Unknown",
        img: r.stream?.smallImg ?? null,
        right:
          typeof r.trendingScore === "number"
            ? r.trendingScore.toFixed(1)
            : "0",
      }))
    : [];
  return items;
}

export async function getLikesGivenTop(roomId: string, limit = 10) {
  const res = await fetch(
    `/api/analytics/likes-given-top?roomId=${roomId}&limit=${limit}`
  );
  const data = await jsonOrThrow(res);
  const items: ListItem[] = Array.isArray(data.items)
    ? data.items.map((r: any) => ({
        id: r.extractedId,
        title: r.title ?? r.extractedId,
        img: r.smallImg ?? null,
        right: r.count ?? 0,
      }))
    : [];
  return items;
}

export async function getYouAddMost(roomId: string, limit = 10) {
  const res = await fetch(
    `/api/analytics/you-add-most?roomId=${roomId}&limit=${limit}`
  );
  const data = await jsonOrThrow(res);
  const items: ListItem[] = Array.isArray(data.items)
    ? data.items.map((r: any) => ({
        id: r.extractedId,
        title: r.title ?? r.extractedId,
        img: r.smallImg ?? null,
        right: r.count ?? 0,
      }))
    : [];
  return items;
}

export async function getYourTopLiked(roomId: string, limit = 10) {
  const res = await fetch(
    `/api/analytics/your-top-liked?roomId=${roomId}&limit=${limit}`
  );
  const data = await jsonOrThrow(res);
  const items: ListItem[] = Array.isArray(data.items)
    ? data.items.map((r: any) => ({
        id: r.extractedId,
        title: r.title ?? r.extractedId,
        img: r.smallImg ?? null,
        right: r.count ?? 0,
      }))
    : [];
  return items;
}

export type Recommendation = {
  extractedId: string;
  title: string;
  img?: string | null;
  score: number;
  parts?: { user: number; room: number; time: number };
};

export async function getRecommendation(
  roomId: string
): Promise<Recommendation[]> {
  const res = await fetch(`/api/analytics/recommendation?roomId=${roomId}`);
  const data = await jsonOrThrow(res);
  const arr = Array.isArray(data?.recommendations) ? data.recommendations : [];
  return arr.map((r: any) => ({
    extractedId: r.extractedId,
    title: r.sample?.title ?? r.extractedId,
    img: r.sample?.smallImg ?? r.sample?.bigImg ?? null,
    score: typeof r.score === "number" ? r.score : 0,
    parts: r.parts ?? undefined,
  }));
}

export async function addToQueue(roomId: string, extractedId: string) {
  const url = `https://www.youtube.com/watch?v=${extractedId}`;
  const res = await fetch("/api/streams/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creatorId: roomId, url }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (data && (data.message || data.error)) || `Failed to add (${res.status})`;
    throw new Error(msg);
  }
  return data;
}
