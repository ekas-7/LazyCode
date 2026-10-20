import type { Metadata } from "next";
import { AuthPage } from "@/components/AuthPage";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return <AuthPage mode="login" searchParams={searchParams as Promise<{ next?: string }>} />;
}
