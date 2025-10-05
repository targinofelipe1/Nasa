"use client";

import { useState } from 'react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { 
  Home, 
  BarChart3, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Gift,
  Leaf,
  Moon,
  Sun,
  Coins
} from 'lucide-react';
import { useApp } from '@/app/dash/AppContext';

interface NavbarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  darkMode: boolean;
  onDarkModeToggle: () => void;
}

export function Navbar({ currentPage, onPageChange, darkMode, onDarkModeToggle }: NavbarProps) {
  const { usuario } = useApp();
  
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'metricas', label: 'Métricas', icon: TrendingUp },
    { id: 'contribuicoes', label: 'Contribuições', icon: Users },
    { id: 'relatos', label: 'Relatos', icon: MessageSquare },
    { id: 'recompensas', label: 'Recompensas', icon: Gift },
  ];

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-green-200 px-6 py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-lg flex items-center justify-center">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-verde-floresta">Cidades Vivas</h1>
            <p className="text-xs text-green-600">Sustentabilidade Urbana</p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={currentPage === item.id ? "default" : "ghost"}
                onClick={() => onPageChange(item.id)}
                className={`flex items-center space-x-2 transition-all duration-200 ${
                  currentPage === item.id 
                    ? 'bg-verde-floresta text-white hover:bg-green-800' 
                    : 'text-verde-floresta hover:bg-green-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Button>
            );
          })}
        </div>

        {/* User Coins & Dark Mode Toggle */}
        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-2 bg-amarelo-solar/10 px-3 py-1 rounded-lg">
            <Coins className="w-4 h-4 text-amarelo-solar" />
            <span className="font-medium text-amarelo-solar">{usuario.coins}</span>
            <Badge variant="secondary" className="text-xs">{usuario.nivel}</Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <Sun className="w-4 h-4 text-yellow-500" />
            <Switch
              checked={darkMode}
              onCheckedChange={onDarkModeToggle}
              className="data-[state=checked]:bg-slate-700"
            />
            <Moon className="w-4 h-4 text-slate-600" />
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden mt-4 flex flex-wrap gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={currentPage === item.id ? "default" : "ghost"}
              size="sm"
              onClick={() => onPageChange(item.id)}
              className={`flex items-center space-x-1 ${
                currentPage === item.id 
                  ? 'bg-verde-floresta text-white' 
                  : 'text-verde-floresta'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span className="text-xs">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}