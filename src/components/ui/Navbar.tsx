"use client";

import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const title = "Dashboard";

  return (
    <nav className="w-full bg-gray-100 p-4 shadow-sm border-b border-gray-200">
      <div className="container mx-auto flex justify-center items-center">
        <h1 className="text-xl font-bold text-gray-800 tracking-wide">{title}</h1>
      </div>
    </nav>
  );
}