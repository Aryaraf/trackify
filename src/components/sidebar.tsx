"use client";

import Link from "next/link";
import { usePathname } from "next/navigation"; 
import { LayoutDashboard, Wallet, FolderKanban, Settings } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

export function Sidebar() {
  const pathname = usePathname(); 

 
  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Finance", href: "/finance", icon: Wallet },
    { name: "Projects", href: "/projects", icon: FolderKanban },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-50 h-screen flex-col hidden md:flex font-mono">
      <div className="p-6">
        <h2 className="text-2xl font-bold tracking-tight text-white">Trackify.</h2>
        <p className="text-xs text-slate-400 mt-1">Personal Assistant</p>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md font-medium transition-colors ${isActive
                  ? "bg-primary text-primary-foreground" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white" 
                }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 mt-auto flex items-center justify-between">
        <Link href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-md text-slate-400 hover:bg-slate-800 hover:text-white transition-colors flex-1">
          <Settings className="h-5 w-5" />
          <span>Pengaturan</span>
        </Link>

        <div className="pl-2">
          <UserButton />
        </div>
      </div>
    </aside>
  );
}