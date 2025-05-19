"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (isLoaded) {
      if (!isSignedIn) {
        router.replace("/auth/sign-in");
      } else {
        setChecking(false);
      }
    }
  }, [isSignedIn, isLoaded, router]);

  if (checking) return null; // 🔹 NÃO renderiza nada enquanto verifica a autenticação

  return <>{children}</>;
}
