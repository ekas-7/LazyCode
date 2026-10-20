import type { Metadata } from "next";
import { AuthPage } from "@/components/AuthPage";

export const metadata: Metadata = { title: "Join" };

export default function RegisterPage({ searchParams }: PageProps<"/register">) {
  return <AuthPage mode="register" searchParams={searchParams as Promise<{ next?: string }>} />;
}
