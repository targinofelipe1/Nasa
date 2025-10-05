// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ClerkProvider } from "@clerk/nextjs";
import ClerkDebugInitializer from "@/components/ui/ClerkDebugInitializer";
import { RewardProvider } from "@/components/ui/RewardCoins"; // ✅ adicione esta linha

// 🔹 fontes do Next
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GlobalLifeCities",
  description: "Plataforma de dados sustentáveis e urbanos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <RewardProvider> {/* ✅ ENVOLVA O APP AQUI */}
        <html lang="pt-BR">
          <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
          >
            <ClerkDebugInitializer />
            <Toaster richColors />
            <main className="pt-24 px-6">{children}</main>
          </body>
        </html>
      </RewardProvider> {/* ✅ FECHA AQUI */}
    </ClerkProvider>
  );
}
