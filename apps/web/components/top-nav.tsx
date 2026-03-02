"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
};

const navItems: NavItem[] = [
  { href: "/projects", label: "Projects" },
  { href: "/login", label: "Login" },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header style={{ padding: "16px 24px 0" }}>
      <div className="panel" style={{ padding: 14, display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ fontWeight: 700, letterSpacing: "0.04em" }}>WONKEY</div>
        <div style={{ display: "flex", gap: 8 }}>
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`button ${active ? "button-primary" : "button-soft"}`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
