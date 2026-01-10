export type QueueItem = {
  id: string;
  type: string;
  url: string;
  extractedId: string;
  title: string;
  smallImg: string;
  bigImg: string;
  active: boolean;
  played: boolean;
  playedTs?: string | null;
  createAt: string;
  userId: string;
  addedById: string;
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

export async function getQueue(creatorId: string) {
  const res = await fetch(`/api/streams?creatorId=${creatorId}`);
  return jsonOrThrow(res);
}

export async function addStream(opts: { creatorId: string; url: string }) {
  const res = await fetch(`/api/streams`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creatorId: opts.creatorId, url: opts.url }),
  });
  return jsonOrThrow(res);
}

export async function removeStream(streamId: string) {
  const res = await fetch(`/api/streams/remove`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ streamId }),
  });
  return jsonOrThrow(res);
}

export async function upvoteStream(streamId: string) {
  const res = await fetch(`/api/streams/upvote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ streamId }),
  });
  return jsonOrThrow(res);
}

export async function downvoteStream(streamId: string) {
  const res = await fetch(`/api/streams/downvote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ streamId }),
  });
  return jsonOrThrow(res);
}

export async function nextStream() {
  const res = await fetch(`/api/streams/next`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  return jsonOrThrow(res);
}

export async function emptyQueue(creatorId: string) {
  const res = await fetch(`/api/streams/empty-queue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creatorId }),
  });
  return jsonOrThrow(res);
}
