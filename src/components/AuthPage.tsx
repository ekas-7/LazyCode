import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AuthForm } from "./AuthForm";
import { BerryIcon } from "./ui/icons";

async function RedirectIfSignedIn({ next }: { next?: string }) {
  await connection(); // request-time render: runs before any DB I/O
  const user = await getCurrentUser();
  if (user) {
    redirect(next && next.startsWith("/") && !next.startsWith("//") ? next : "/world");
  }
  return null;
}

async function Content({
  mode,
  searchParams,
}: {
  mode: "login" | "register";
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const isLogin = mode === "login";
  return (
    <>
      <RedirectIfSignedIn next={next} />
      <div className="mb-6 text-center">
        <div className="mb-3 inline-block">
          <BerryIcon size={52} />
        </div>
        <h1 className="script text-[3.4rem] text-ink">
          {isLogin ? "Welcome back" : "Join the journey"}
        </h1>
        <p className="eyebrow mt-3 !text-[0.6rem] text-muted">
          {isLogin ? "Your berries missed you" : "Free · Gentle · A little bit magical"}
        </p>
      </div>
      <AuthForm mode={mode} next={next} />
    </>
  );
}

export function AuthPage({
  mode,
  searchParams,
}: {
  mode: "login" | "register";
  searchParams: Promise<{ next?: string }>;
}) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 items-center px-5 py-8">
      <div className="panel animate-float-up w-full p-8 sm:p-10">
        <Suspense fallback={<div className="h-80" />}>
          <Content mode={mode} searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
