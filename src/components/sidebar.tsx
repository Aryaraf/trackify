import Link from "next/link";
import { LayoutDashboard, Wallet, FolderKanban, Settings } from "lucide-react";
import { UserButton } from "@clerk/nextjs"; // Import tombol profil dari Clerk

export function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 text-slate-50 h-screen flex-col hidden md:flex font-mono">
      <div className="p-6">
        <h2 className="text-2xl font-bold tracking-tight text-white">Trackify.</h2>
        <p className="text-xs text-slate-400 mt-1">Personal Assistant</p>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-md bg-primary text-primary-foreground font-medium transition-colors">
          <LayoutDashboard className="h-5 w-5" />
          <span>Dashboard</span>
        </Link>
        
        <Link href="/finance" className="flex items-center gap-3 px-3 py-2.5 rounded-md text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
          <Wallet className="h-5 w-5" />
          <span>Finance</span>
        </Link>
        
        <Link href="/projects" className="flex items-center gap-3 px-3 py-2.5 rounded-md text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
          <FolderKanban className="h-5 w-5" />
          <span>Projects</span>
        </Link>
      </nav>

      {/* Bagian Bawah: Pengaturan & Profil User */}
      <div className="p-4 border-t border-slate-800 mt-auto flex items-center justify-between">
        <Link href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-md text-slate-400 hover:bg-slate-800 hover:text-white transition-colors flex-1">
          <Settings className="h-5 w-5" />
          <span>Pengaturan</span>
        </Link>
        
        {/* Ini dia tombol profil otomatis dari Clerk */}
        <div className="pl-2">
          <UserButton />
        </div>
      </div>
    </aside>
  );
}