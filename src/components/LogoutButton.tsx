"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      disabled={busy}
      className="eyebrow rounded-full px-3 py-2 text-[0.62rem] text-muted transition hover:text-berry disabled:opacity-50"
      title="Sign out"
    >
      Sign out
    </button>
  );
}
