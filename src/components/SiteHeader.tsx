import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { levelForXp, titleForLevel } from "@/lib/game";
import { BerryIcon, HeartIcon } from "./ui/icons";
import { LogoutButton } from "./LogoutButton";
import { NavLinks, NavLinksFallback } from "./NavLinks";

async function HeaderUser() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login" className="btn btn-ghost !py-2 !text-[0.62rem]">
          Sign in
        </Link>
        <Link href="/register" className="btn btn-berry !py-2 !text-[0.62rem]">
          Join
        </Link>
      </div>
    );
  }

  const level = levelForXp(user.xp);
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <Link
        href="/profile"
        className="pill hidden transition hover:-translate-y-px sm:inline-flex"
        title={`${user.username} · ${titleForLevel(level)}`}
      >
        <span className="font-semibold text-berry">Lv {level}</span>
        <span className="max-w-24 truncate text-muted">{user.username}</span>
      </Link>
      <span className="pill" title="Berries">
        <BerryIcon size={20} />
        <b className="font-medium">{user.berries.toLocaleString()}</b>
      </span>
      <span className="pill" title={`${user.streak} day streak`}>
        <HeartIcon size={18} />
        <b className="font-medium">{user.streak}</b>
      </span>
      <LogoutButton />
    </div>
  );
}

function HeaderUserFallback() {
  return <div className="h-9 w-40 animate-pulse rounded-full bg-white/50" />;
}

export function SiteHeader() {
  return (
    <header className="relative z-20 mx-auto flex w-full max-w-[1500px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-4 sm:px-10">
      <Link href="/" className="group flex items-center gap-3">
        <span className="transition-transform group-hover:-rotate-6">
          <BerryIcon size={40} />
        </span>
        <span className="leading-tight">
          <span className="title-serif block text-[1.55rem] leading-none">
            Berry Quest
          </span>
          <span className="eyebrow mt-1 block !text-[0.56rem] !tracking-[0.3em] text-muted">
            Code adventures &amp; little wins
          </span>
        </span>
      </Link>

      <Suspense fallback={<NavLinksFallback />}>
        <NavLinks />
      </Suspense>

      <Suspense fallback={<HeaderUserFallback />}>
        <HeaderUser />
      </Suspense>
    </header>
  );
}
