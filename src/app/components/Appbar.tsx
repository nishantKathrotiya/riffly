"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/src/components/ui/button";
import { useUser } from "@/src/app/providers/UserProvider";
import { RotateCw } from "lucide-react";

export function Appbar() {
  const { user, loading } = useUser();

  return (
    <div className="flex justify-between px-20 pt-4">
      <div className="text-lg font-bold flex flex-col justify-center text-white">
        Riffly
      </div>
      <div>
        <Button
          className="bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2"
          disabled={loading}
          onClick={() => {
            if (user) {
              signOut();
            } else {
              signIn("google", { callbackUrl: "/dashboard" });
            }
          }}
        >
          {loading ? (
            <RotateCw className="w-4 h-4 animate-spin [animation-duration:1.8s] ease-in-out" />
          ) : (
            <>{user ? "Logout" : "Signin"}</>
          )}
        </Button>
      </div>
    </div>
  );
}
