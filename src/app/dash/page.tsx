"use client"

import { ContribuicoesPage } from "@/components/ContribuicoesPage";
import { Dashboard } from "@/components/Dashboard";
import { HomePage } from "@/components/HomePage";
import { MetricasPage } from "@/components/MetricasPAge";
import { RecompensasPage } from "@/components/RecompensasPage";
import { RelatosPage } from "@/components/RelatosPage";
import { useState, useEffect } from "react";
import { AppProvider } from "./AppContext";
import { Navbar } from "@/components/NavBar";
import { Toaster } from "@/components/ui/sonner";


export default function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [darkMode, setDarkMode] = useState(false);

  // Aplicar classe dark no documento quando darkMode está ativo
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
  };

  const handleDarkModeToggle = () => {
    setDarkMode(!darkMode);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "home":
        return <HomePage onPageChange={handlePageChange} />;
      case "dashboard":
        return <Dashboard />;
      case "metricas":
        return <MetricasPage />;
      case "contribuicoes":
        return <ContribuicoesPage />;
      case "relatos":
        return <RelatosPage />;
      case "recompensas":
        return <RecompensasPage />;
      default:
        return <HomePage onPageChange={handlePageChange} />;
    }
  };

  return (
    <AppProvider>
      <div className="min-h-screen bg-background text-foreground">
        <Navbar
          currentPage={currentPage}
          onPageChange={handlePageChange}
          darkMode={darkMode}
          onDarkModeToggle={handleDarkModeToggle}
        />

        <main>{renderCurrentPage()}</main>
        <Toaster />
      </div>
    </AppProvider>
  );
}