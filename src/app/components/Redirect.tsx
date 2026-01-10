"use client";

import { useUser } from "@/src/app/providers/UserProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function Redirect() {
  const { user, loading } = useUser();
  const router = useRouter();
  useEffect(() => {
    if (loading) return;
    router.replace(user ? "/dashboard" : "/");
  }, [loading, user, router]);
  return null;
}
