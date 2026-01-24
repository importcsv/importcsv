"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { features } from "@/lib/features";
import { signOut } from "@/lib/auth";
import {
  LayoutDashboard,
  FileSpreadsheet,
  History,
  CreditCard,
  Settings,
  LogOut,
} from "lucide-react";
import { OnboardingChecklist } from "./OnboardingChecklist";

const nav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Importers", href: "/importers", icon: FileSpreadsheet },
  { name: "Import History", href: "/imports", icon: History },
];

const settingsNav = [
  {
    name: "Billing",
    href: "/settings/billing",
    icon: CreditCard,
    cloudOnly: true,
  },
  { name: "Settings", href: "/settings", icon: Settings, cloudOnly: false },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <div className="flex flex-col w-64 bg-zinc-900 text-white min-h-screen">
      <div className="p-6">
        <h1 className="text-lg font-semibold">ImportCSV</h1>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {nav.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              isActive(item.href)
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </Link>
        ))}

        <div className="pt-6 pb-2">
          <p className="px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Settings
          </p>
        </div>

        {settingsNav.map((item) => {
          if (item.cloudOnly && !features.billing) return null;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Onboarding checklist - shows until complete */}
      <OnboardingChecklist />

      <div className="p-4 border-t border-zinc-800">
        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
