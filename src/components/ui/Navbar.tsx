"use client";

import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  // Definir o título baseado na rota
  let title = "Dashboard";

  if (pathname === "/dashboard-estadual") {
    title = "Dashboard Estadual";
  } else if (pathname === "/dashboard-municipal") {
    title = "Dashboard Municipal";
  }

  return (
    <nav className="w-full bg-gray-100 p-4 shadow-md">
      <h1 className="text-lg font-bold text-gray-800">{title}</h1>
    </nav>
  );
}
