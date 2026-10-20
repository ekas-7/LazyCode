"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/world", label: "Journey" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/profile", label: "Journal" },
];

export function NavLinks() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href) || (href === "/world" && pathname.startsWith("/quest"));

  return (
    <nav className="flex items-center gap-5 sm:gap-9" aria-label="Main">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="eyebrow relative py-2 transition-opacity hover:opacity-70"
          style={{ fontSize: "0.68rem" }}
          aria-current={isActive(l.href) ? "page" : undefined}
        >
          {l.label}
          {isActive(l.href) && (
            <span className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-berry" />
          )}
        </Link>
      ))}
    </nav>
  );
}

export function NavLinksFallback() {
  return <div className="h-8 w-72" />;
}
