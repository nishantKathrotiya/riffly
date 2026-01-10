"use client";
import StreamView from "../components/StreamView";
import { useUser } from "@/src/app/providers/UserProvider";

export default function Component() {
  const { user, loading } = useUser();
  const creatorId = user?.id ?? "";
  if (loading) return <div>Loading...</div>;
  return <StreamView creatorId={creatorId} playVideo={true} />;
}
