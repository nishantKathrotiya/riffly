"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/src/components/ui/button";
import { useUser } from "@/src/app/providers/UserProvider";
import { RotateCw } from "lucide-react";
import { AnimatedButton } from "./AnimatedButtonProps";
export function Appbar() {
  const { user, loading } = useUser();

  return (
    <div className="flex justify-between px-20 pt-4">
      <div className="text-lg font-bold flex flex-col justify-center text-white">
        Riffly
      </div>
      <div>
        <AnimatedButton
          variant="purple"
          shine={false} // no shine effect
          tiltOnClick={true} // no tilt
          floatingIcon={false} // no floating icon
          cursorFollow={true} // no cursor-follow lamp
          darkBg={false} // optional: keep dark background off
          disabled={loading}
          className="flex items-center gap-2 w-full justify-center"
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
  );
}
