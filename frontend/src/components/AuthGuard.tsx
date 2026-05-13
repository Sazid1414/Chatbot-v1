"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { isAuthDisabled } from "@/lib/authMode";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthDisabled()) return;
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (isAuthDisabled()) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-white" />
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
