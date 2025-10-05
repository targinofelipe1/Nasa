"use client";

import { ContribuicoesPage } from "@/components/ContribuicoesPage";
import { Toaster } from "@/components/ui/sonner";
import { AppProvider } from "../dash/AppContext";
import Sidebar from "../components-antigo/Sidebar";
import ProtectedRoute from "@/components/ui/auth/ProtectedRoute";
import { RelatosPage } from "@/components/RelatosPage";

export default function App() {
  return (
    <ProtectedRoute>
      <Sidebar />

      <AppProvider>
        <div className="min-h-screen bg-background text-foreground pt-28 px-4 md:px-8">
          <RelatosPage />
          <Toaster />
        </div>
      </AppProvider>
    </ProtectedRoute>
  );
}
