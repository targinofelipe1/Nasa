"use client";

import { HomePage } from "@/components/HomePage";
import { Toaster } from "@/components/ui/sonner";
import { AppProvider } from "./dash/AppContext";
import Sidebar from "./components-antigo/Sidebar";
import ProtectedRoute from "@/components/ui/auth/ProtectedRoute";

export default function App() {
  return (

    <ProtectedRoute>
                <Sidebar />
    <AppProvider>
        <Sidebar />
      <div className="min-h-screen bg-background text-foreground">
        {/* Renderiza a página inicial */}
        <HomePage />
        <Toaster />
      </div>
    </AppProvider>

     </ProtectedRoute>
  );
}
