"use client";

import React from "react";
import { Coins } from "lucide-react";
import { useUser } from "@clerk/nextjs";

type RewardContextType = {
  coins: number;
  loading: boolean;
  refreshCoins: () => Promise<void>;
  addCoins: (n: number) => void;
  removeCoins: (n: number) => void;
};

const RewardContext = React.createContext<RewardContextType | null>(null);

type ApiResponse = {
  success?: boolean;
  data?: {
    usuario?: {
      coins?: number;
    } | null;
  };
};

export function RewardProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const [coins, setCoins] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  const refreshCoins = React.useCallback(async () => {
    if (!user?.id) {
      setCoins(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`/api/recompensas?userId=${user.id}`, {
        cache: "no-store",
      });

      const data: ApiResponse = await response.json();
      setCoins(Number(data?.data?.usuario?.coins || 0));
    } catch (error) {
      console.error("Erro ao buscar coins:", error);
      setCoins(0);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  React.useEffect(() => {
    if (!isLoaded) return;
    refreshCoins();
  }, [isLoaded, refreshCoins]);

  const addCoins = (n: number) => setCoins((prev) => prev + n);
  const removeCoins = (n: number) => setCoins((prev) => Math.max(0, prev - n));

  return (
    <RewardContext.Provider
      value={{
        coins,
        loading,
        refreshCoins,
        addCoins,
        removeCoins,
      }}
    >
      {children}
    </RewardContext.Provider>
  );
}

export function useReward() {
  const ctx = React.useContext(RewardContext);
  if (!ctx) throw new Error("useReward must be used inside RewardProvider");
  return ctx;
}

export function RewardCoins() {
  const { coins, loading } = useReward();

  return (
    <div
      className="flex items-center bg-[var(--color-verde-claro)] text-[var(--color-verde-floresta)]
      px-3 py-1.5 rounded-full text-xs font-medium shadow-sm border border-[var(--color-verde-floresta)]
      cursor-default select-none"
    >
      <Coins size={16} className="mr-1 text-[var(--color-amarelo-solar)]" />
      <span>{loading ? "..." : coins}</span>
    </div>
  );
}