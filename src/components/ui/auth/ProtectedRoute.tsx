"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      // Adiciona um ID para o toast para evitar duplicatas
      toast.error("Você precisa estar logado para acessar esta página.", { id: 'auth-error' });
      router.replace("/auth/sign-in");
      return;
    }

    if (allowedRoles && allowedRoles.length > 0) {
      const userRole = user?.publicMetadata?.role as string;
      if (userRole && allowedRoles.includes(userRole)) {
        setIsAuthorized(true);
      } else {
        // Adiciona um ID para o toast para evitar duplicatas
        toast.error("Você não tem permissão para acessar esta página.", { id: 'permission-error' });
        router.replace("/");
        return;
      }
    } else {
      setIsAuthorized(true);
    }
  }, [isLoaded, isSignedIn, user, allowedRoles, router]);

  if (!isLoaded || !isAuthorized) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}