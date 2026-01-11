"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/src/components/ui/button";
import { useUser } from "@/src/app/providers/UserProvider";
import { RotateCw } from "lucide-react";
import { AnimatedButton } from "./AnimatedButtonProps";
export function Appbar() {
  const { user, loading } = useUser();

  return (
    <div className="sticky top-0 z-40 bg-[rgb(10,10,10)]/80 backdrop-blur supports-[backdrop-filter]:bg-[rgb(10,10,10)]/60">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-20 py-3">
        <div className="text-lg sm:text-2xl font-bold text-white">Riffly</div>
        <div>
          <AnimatedButton
            variant="purple"
            shine={false} // no shine effect
            tiltOnClick={true} // no tilt
            floatingIcon={false} // no floating icon
            cursorFollow={true} // no cursor-follow lamp
            darkBg={false} // optional: keep dark background off
            disabled={loading}
            className="flex items-center gap-2 py-2 px-3 sm:py-2.5 sm:px-5 w-full justify-center"
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
          </AnimatedButton>
        </div>
      </div>
    </div>
  );
}
