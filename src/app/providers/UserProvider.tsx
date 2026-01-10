"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type UserLite = {
  id: string;
  email?: string | null;
  provider?: string | null;
} | null;

type Ctx = {
  user: UserLite;
  loading: boolean;
  refresh: () => Promise<void>;
};

const UserContext = createContext<Ctx | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserLite>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/user", { cache: "no-store" });
      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = await res.json().catch(() => ({}));
      const u = data?.user ?? null;
      setUser(
        u
          ? { id: u.id, email: u.email ?? null, provider: u.provider ?? null }
          : null
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // fetch once on mount
    fetchUser();
  }, [fetchUser]);

  const value = useMemo<Ctx>(
    () => ({ user, loading, refresh: fetchUser }),
    [user, loading, fetchUser]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
