"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { isAuthDisabled } from "@/lib/authMode";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (isAuthDisabled()) {
        router.replace("/chat");
        return;
      }
      router.replace(user ? "/chat" : "/login");
    }
  }, [user, loading, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-white" />
    </div>
  );
}
