"use client";

import Link from "next/link";
import { useUser, useAuth } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import {
  BarChart2,
  Building2,
  Globe2,
  LineChart,
  Lightbulb,
  AlertTriangle,
  Users,
  Settings,
  Home,
  Coins,
  Menu,
  X,
} from "lucide-react";
import React, { useState } from "react";
import { RewardCoins } from "@/components/ui/RewardCoins";

export default function Sidebar() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const menuItems = [
    { name: "Home", icon: <Home size={18} />, href: "/" },
    { name: "Dashboard", icon: <BarChart2 size={18} />, href: "/dash" },
    { name: "Cidades", icon: <Building2 size={18} />, href: "/cidades" },
    { name: "Métricas", icon: <LineChart size={18} />, href: "/metricas" },
    { name: "Mapa", icon: <Globe2 size={18} />, href: "/mapa" },
    { name: "Relatos", icon: <Lightbulb size={18} />, href: "/relatos" },
    { name: "Contribuições", icon: <AlertTriangle size={18} />, href: "/contribuicoes" },
    { name: "Empreendimentos", icon: <Users size={18} />, href: "/empreendimentos" },
    { name: "Recompensas", icon: <Coins size={18} />, href: "/recompensas" },
    { name: "Configurações", icon: <Settings size={18} />, href: "/config" },
  ];

  return (
    <header
      style={{
        width: "100%",
        borderBottom: "1px solid #E0E0E0",
        backgroundColor: "#FFFFFF",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 50,
      }}
    >
      {/* 🔹 Cabeçalho superior */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
        }}
      >
        {/* Logo e nome */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img
            src="/img/logonasa.png"
            alt="Logo"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
            }}
          />
          <div>
            <h1
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "#2E7D32",
                lineHeight: 1.1,
                whiteSpace: "nowrap",
              }}
            >
              GlobalLifeCities
            </h1>
            <p
              style={{
                fontSize: "12px",
                color: "#0277BD",
                fontWeight: 500,
                whiteSpace: "nowrap",
              }}
            >
              Dados para um futuro sustentável
            </p>
          </div>
        </div>

      <div style={{ flex: 1 }}></div>

        {/* 🔹 Botão menu mobile */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="sm:hidden"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "6px",
          }}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* 🔹 Usuário (desktop) */}
        {user && (
          <div
            className="hidden sm:flex"
            style={{
              alignItems: "center",
              gap: "10px",
              minWidth: "200px",
              justifyContent: "flex-end",
            }}
          >
            <img
              src={user.imageUrl}
              alt="User Avatar"
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                border: "2px solid #A5D6A7",
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#2E7D32" }}>
                {user.fullName}
              </span>
              <div style={{ margin: "4px 0" }}>
                <RewardCoins />
              </div>
              <button
                onClick={() => signOut({ redirectUrl: "/auth/sign-in" })}
                style={{
                  fontSize: "12px",
                  color: "#0277BD",
                  fontWeight: 500,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Sair
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 🔹 Navegação completa — só no DESKTOP */}
      <nav
        className="hidden sm:flex"
        style={{
          display: "flex",
          justifyContent: "center",
          borderTop: "1px solid #E0E0E0",
          padding: "8px 0",
          backgroundColor: "#FFFFFF",
        }}
      >
        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 10px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: isActive ? "#2E7D32" : "#555",
                  backgroundColor: isActive ? "#A5D6A7" : "transparent",
                  border: isActive ? "1px solid #2E7D32" : "none",
                  transition: "all 0.2s",
                }}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* 🔹 Menu MOBILE (abre com botão) */}
      {menuOpen && (
        <div
          className="sm:hidden"
          style={{
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#fff",
            borderTop: "1px solid #E0E0E0",
          }}
        >
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 16px",
                  color: isActive ? "#2E7D32" : "#333",
                  backgroundColor: isActive ? "#A5D6A7" : "transparent",
                  borderBottom: "1px solid #F0F0F0",
                  fontSize: "14px",
                }}
              >
                {item.icon}
                {item.name}
              </Link>
            );
          })}

          {/* 🔹 Usuário no mobile */}
          {user && (
            <div style={{ padding: "12px 16px", borderTop: "1px solid #EEE" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <img
                  src={user.imageUrl}
                  alt="Avatar"
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    border: "2px solid #A5D6A7",
                  }}
                />
                <div>
                  <strong style={{ fontSize: "14px", color: "#2E7D32" }}>
                    {user.fullName}
                  </strong>
                  <div>
                    <RewardCoins />
                  </div>
                  <button
                    onClick={() => signOut({ redirectUrl: "/auth/sign-in" })}
                    style={{
                      fontSize: "12px",
                      color: "#0277BD",
                      border: "none",
                      background: "none",
                      padding: 0,
                      cursor: "pointer",
                    }}
                  >
                    Sair
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
