"use client";

import React from "react";
import { Coins } from "lucide-react";

const RewardContext = React.createContext<{
  coins: number;
  addCoins: (n: number) => void;
  removeCoins: (n: number) => void;
} | null>(null);

export function RewardProvider({ children }: { children: React.ReactNode }) {
  const [coins, setCoins] = React.useState(120); // valor inicial (pode vir da API ou metadata do usuário)

  const addCoins = (n: number) => setCoins((prev) => prev + n);
  const removeCoins = (n: number) => setCoins((prev) => Math.max(0, prev - n));

  return (
    <RewardContext.Provider value={{ coins, addCoins, removeCoins }}>
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
  const { coins } = useReward();

  return (
    <div
      className="flex items-center bg-[var(--color-verde-claro)] text-[var(--color-verde-floresta)]
      px-3 py-1.5 rounded-full text-xs font-medium shadow-sm border border-[var(--color-verde-floresta)]
      cursor-default select-none"
    >
      <Coins size={16} className="mr-1 text-[var(--color-amarelo-solar)]" />
      <span>{coins}</span>
    </div>
  );
}
