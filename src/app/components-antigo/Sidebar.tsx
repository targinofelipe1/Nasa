"use client";

import { useState } from "react";
import Link from "next/link";
import { useUser, useAuth } from "@clerk/nextjs";
import {
  BarChart2,
  Building2,
  Globe2,
  LineChart,
  Lightbulb,
  AlertTriangle,
  Users,
  Menu,
  X,
  Settings,
} from "lucide-react";

export default function Sidebar() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const [active, setActive] = useState("Dashboard");
  const [menuOpen, setMenuOpen] = useState(false);

  const menuItems = [
    { name: "Dashboard", icon: <BarChart2 size={18} />, href: "/" },
    { name: "Cidades", icon: <Building2 size={18} />, href: "/cidades" },
    { name: "Métricas", icon: <LineChart size={18} />, href: "/metricas" },
    { name: "Mapa", icon: <Globe2 size={18} />, href: "/mapa" },
    { name: "Iniciativas", icon: <Lightbulb size={18} />, href: "/iniciativas" },
    { name: "Desafios", icon: <AlertTriangle size={18} />, href: "/desafios" },
    { name: "Comunidade", icon: <Users size={18} />, href: "/comunidade" },
    { name: "Configurações", icon: <Settings size={18} />, href: "/config" },
  ];

  return (
    <header className="w-full border-b border-gray-200 bg-white shadow-sm fixed top-0 left-0 z-50">
      {/* 🔹 Top bar principal */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3">
        {/* 🔹 Logo e nome do sistema */}
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-tr from-green-400 to-blue-500 w-9 h-9 flex items-center justify-center rounded-lg">
            <Globe2 size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-gray-900 leading-tight">
              Data Pathways
            </h1>
            <p className="text-xs text-gray-500">
              Healthy Cities and Human Settlements
            </p>
          </div>
        </div>

        {/* 🔹 Botão do menu mobile */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 rounded-md hover:bg-gray-100"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* 🔹 Avatar, nome e botão sair (desktop) */}
        {user && (
          <div className="hidden md:flex items-center space-x-3">
            <img
              src={user.imageUrl}
              alt="User Avatar"
              className="w-9 h-9 rounded-full border"
            />
            <div className="flex flex-col text-right">
              <span className="text-sm font-medium text-gray-800">
                {user.fullName}
              </span>
              <button
                onClick={() => signOut({ redirectUrl: "/auth/sign-in" })}
                className="text-xs text-red-600 hover:text-red-800 font-medium transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 🔹 Menu horizontal (desktop) */}
      <nav className="hidden md:flex justify-center border-t border-gray-100 py-2 bg-white">
        <div className="flex items-center space-x-6">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setActive(item.name)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                active === item.name
                  ? "text-emerald-700 bg-emerald-100 border border-emerald-200"
                  : "text-gray-600 hover:text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* 🔹 Menu mobile colapsável */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white shadow-inner animate-slide-down">
          <nav className="flex flex-col py-3 space-y-2 px-4">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => {
                  setActive(item.name);
                  setMenuOpen(false);
                }}
                className={`flex items-center gap-3 px-2 py-2 rounded-md text-sm font-medium transition-all ${
                  active === item.name
                    ? "text-emerald-700 bg-emerald-100 border border-emerald-200"
                    : "text-gray-700 hover:text-emerald-700 hover:bg-emerald-50"
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            ))}

            {/* 🔹 Avatar, nome e botão sair (mobile) */}
            {user && (
              <div className="flex items-center gap-3 mt-3 border-t pt-3 border-gray-100">
                <img
                  src={user.imageUrl}
                  alt="User Avatar"
                  className="w-9 h-9 rounded-full border"
                />
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-gray-800">
                    {user.fullName}
                  </p>
                  <button
                    onClick={() => signOut({ redirectUrl: "/auth/sign-in" })}
                    className="text-xs text-red-600 hover:text-red-800 font-medium transition-colors"
                  >
                    Sair
                  </button>
                </div>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
