import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import {
  LayoutDashboard,
  PlusCircle,
  Search,
  Shield,
  Handshake,
  BarChart3,
  FileCheck,
  Zap,
} from "lucide-react";

export const metadata: Metadata = {
  title: "NAPKIN A2A | Agent-to-Agent Ad Agency",
  description:
    "The world's first agent-to-agent ad agency. We don't make ads humans see. We make brands agents choose.",
};

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/brands/new", label: "Create Brand", icon: PlusCircle },
  { href: "/brands", label: "All Brands", icon: Zap },
  { href: "/audit", label: "Visibility Audit", icon: Search },
  { href: "/trust", label: "Trust Layer", icon: Shield },
  { href: "/negotiate", label: "Negotiations", icon: Handshake },
  { href: "/analytics", label: "ASOv Analytics", icon: BarChart3 },
  { href: "/policies", label: "Brand Policies", icon: FileCheck },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex bg-background text-text font-mono">
        {/* Sidebar */}
        <aside className="fixed top-0 left-0 h-full w-56 bg-surface border-r border-border flex flex-col z-50">
          {/* Logo */}
          <Link href="/" className="block px-5 pt-6 pb-4 border-b border-border">
            <div className="font-syne text-xl font-extrabold tracking-tight">
              <span className="text-accent">NAPKIN</span>{" "}
              <span className="text-bright">A2A</span>
            </div>
            <div className="text-[10px] text-dim tracking-[0.2em] uppercase mt-1">
              Agent-to-Agent Ad Agency
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <div className="text-[10px] text-dim tracking-[0.15em] uppercase px-2 mb-3">
              Operations
            </div>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded text-sm text-text/70 hover:text-accent hover:bg-accent/5 transition-colors group"
              >
                <item.icon className="w-4 h-4 text-dim group-hover:text-accent transition-colors" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-border">
            <div className="text-[10px] text-dim">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                System Online
              </div>
              <div className="mt-1 text-dim/60">v0.1.0-alpha</div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="ml-56 flex-1 min-h-screen">{children}</main>
      </body>
    </html>
  );
}
