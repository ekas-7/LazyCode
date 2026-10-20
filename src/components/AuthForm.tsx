"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function AuthForm({
  mode,
  next,
}: {
  mode: "login" | "register";
  next?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isLogin = mode === "login";

  // Only allow same-site relative redirects.
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/world";

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const payload = isLogin
      ? { identifier: form.get("identifier"), password: form.get("password") }
      : { username: form.get("username"), email: form.get("email"), password: form.get("password") };

    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setBusy(false);
        return;
      }
      router.push(safeNext);
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Check your connection.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {isLogin ? (
        <Field label="Username or email" name="identifier" autoComplete="username" />
      ) : (
        <>
          <Field label="Username" name="username" autoComplete="username" hint="3–20 letters, numbers or _" />
          <Field label="Email" name="email" type="email" autoComplete="email" />
        </>
      )}
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete={isLogin ? "current-password" : "new-password"}
        hint={isLogin ? undefined : "At least 8 characters"}
      />

      {error && (
        <p role="alert" className="rounded-2xl bg-berry-soft px-4 py-3 text-sm text-berry-deep">
          {error}
        </p>
      )}

      <button type="submit" disabled={busy} className="btn btn-berry w-full">
        {busy ? "One moment…" : isLogin ? "Sign in" : "Start my journey"}
      </button>

      <p className="text-center text-sm text-muted">
        {isLogin ? (
          <>
            New here?{" "}
            <Link href={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-berry underline underline-offset-2">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-berry underline underline-offset-2">
              Sign in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  autoComplete,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="eyebrow !text-[0.62rem]">{label}</span>
      <input name={name} type={type} autoComplete={autoComplete} required className="field mt-1.5" />
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}
