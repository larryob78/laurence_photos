"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Eye,
  Search,
  Shield,
  Handshake,
  Swords,
  Scale,
  Megaphone,
  Sprout,
  Loader2,
  Activity,
} from "lucide-react";

interface BrandBasic {
  id: number;
  name: string;
  category: string;
}

const tabs = [
  { slug: "", label: "Overview", icon: Eye },
  { slug: "/scout", label: "Scout", icon: Search },
  { slug: "/trust", label: "Trust", icon: Shield },
  { slug: "/dealer", label: "Dealer", icon: Handshake },
  { slug: "/battlefield", label: "Battlefield", icon: Swords },
  { slug: "/governance", label: "Governance", icon: Scale },
  { slug: "/media", label: "Media", icon: Megaphone },
  { slug: "/seeder", label: "Seeder", icon: Sprout },
  { slug: "/monitor", label: "Swarm Monitor", icon: Activity },
];

export default function BrandDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const id = params.id as string;
  const [brand, setBrand] = useState<BrandBasic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/brands/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setBrand({ id: data.id, name: data.name, category: data.category });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const basePath = `/brands/${id}`;

  return (
    <div className="min-h-screen">
      {/* Brand Header */}
      <header className="border-b border-border bg-surface/50 px-8 pt-6 pb-0">
        <div className="flex items-center gap-3 mb-1">
          <div className="text-[10px] text-dim tracking-[0.2em] uppercase">
            Brand Detail
          </div>
          {brand?.category && (
            <>
              <span className="text-dim">/</span>
              <span className="text-[10px] text-infra tracking-widest uppercase">
                {brand.category}
              </span>
            </>
          )}
        </div>
        <h1 className="font-syne text-2xl font-extrabold text-bright mb-5 flex items-center gap-3">
          {loading ? (
            <Loader2 className="w-5 h-5 text-dim animate-spin" />
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-accent" />
              {brand?.name ?? "Unknown Brand"}
            </>
          )}
        </h1>

        {/* Tab Navigation */}
        <nav className="flex gap-0 -mb-px overflow-x-auto">
          {tabs.map((tab) => {
            const href = `${basePath}${tab.slug}`;
            const isActive =
              tab.slug === ""
                ? pathname === basePath || pathname === basePath + "/"
                : pathname.startsWith(href);

            return (
              <Link
                key={tab.slug}
                href={href}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? "border-accent text-accent"
                    : "border-transparent text-dim hover:text-text hover:border-border"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Page Content */}
      <div className="p-8">{children}</div>
    </div>
  );
}
