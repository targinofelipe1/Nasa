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
} from "lucide-react";
import React from "react";
import { RewardCoins } from "@/components/ui/RewardCoins";


export default function Sidebar() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const pathname = usePathname();

  const menuItems = [
    { name: "Home", icon: <Home  size={18} />, href: "/" },
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

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 24px",
        }}
      >
      
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "8px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
            }}
          >
            <img src="/img/logonasa.png" alt="Logo" />
          </div>
          <div>
            <h1 style={{ fontSize: "16px", fontWeight: 600, color: "#2E7D32", lineHeight: 1.1 }}>
              GlobalLifeCities
            </h1>
            <p style={{ fontSize: "12px", color: "#0277BD", fontWeight: 500 }}>
              Dados para um futuro sustentável
            </p>
          </div>
        </div>

      
        {user && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
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
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "center",
                lineHeight: 1.3,
              }}
            >
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
                  padding: 0,
                }}
              >
                Sair
              </button>
            </div>
          </div>
        )}
      </div>

      
      <nav
        style={{
          display: "flex",
          justifyContent: "center",
          borderTop: "1px solid #E0E0E0",
          padding: "8px 0",
          backgroundColor: "#FFFFFF",
        }}
        className="hidden md:flex"
      >
        <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
          {menuItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/"); 

            return (
              <Link
                key={item.name}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: isActive ? "#2E7D32" : "#555",
                  backgroundColor: isActive ? "#A5D6A7" : "transparent",
                  border: isActive ? "1px solid #2E7D32" : "none",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#A5D6A7")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = isActive ? "#A5D6A7" : "transparent")
                }
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
