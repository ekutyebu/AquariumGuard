"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, TrendingUp, AlertTriangle, Settings } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "DASHBOARD", href: "/", icon: LayoutGrid },
    { name: "ANALYTICS", href: "/analytics", icon: TrendingUp },
    { name: "ALERTS", href: "/alerts", icon: AlertTriangle },
    { name: "SETTINGS", href: "/settings", icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-xl z-50">
      <div className="max-w-md mx-auto flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center w-20 h-full transition-all space-y-1 ${
                isActive
                  ? "bg-[#0f3d4a] text-white"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[9px] font-bold tracking-wider">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
