"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, TrendingUp, AlertTriangle, Settings, Fish, Radio } from "lucide-react";

export default function SidebarNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "DASHBOARD", href: "/", icon: LayoutGrid },
    { name: "ANALYTICS", href: "/analytics", icon: TrendingUp },
    { name: "ALERTS", href: "/alerts", icon: AlertTriangle },
    { name: "SETTINGS", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col justify-between w-64 bg-white border-r border-slate-200 h-screen fixed left-0 top-0 z-30">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-200 flex items-center space-x-3">
          {/* <div className="bg-[#0f3d4a]/5 p-2 rounded-xl text-[#0f3d4a]">
            <Fish className="h-6 w-6" />
          </div> */}
          <div>
            <h1 className="font-extrabold text-base text-slate-800 leading-tight">WaterQualityMonitor</h1>
            <span className="text-[9px] text-slate-400 font-black tracking-widest block uppercase">POND SYSTEM</span>
          </div>
        </div>

        {/* Sidebar Links */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all ${isActive
                  ? "bg-[#0f3d4a] text-white shadow-md shadow-slate-900/10"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-bold tracking-wider">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Connectivity Info */}
      <div className="p-4 border-t border-slate-200">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center space-x-3">
          <div className="relative">
            <Radio className="h-5 w-5 text-[#0f3d4a] animate-pulse" />
            <span className="absolute bottom-0 right-0 block h-1.5 w-1.5 rounded-full bg-teal-500 ring-2 ring-white"></span>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Local Network</p>
            <p className="text-[9px] text-slate-400 font-bold">Offline Sync</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
