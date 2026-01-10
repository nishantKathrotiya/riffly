export type UserLite = {
  id: string;
  email?: string | null;
  provider?: string | null;
} | null;

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

export async function getUser(): Promise<UserLite> {
  const res = await fetch(`/api/user`, { cache: "no-store" });
  const data = await jsonOrThrow(res);
  const u = data?.user ?? null;
  return u
    ? { id: u.id, email: u.email ?? null, provider: u.provider ?? null }
    : null;
}
