"use client";

import dynamic from "next/dynamic";
import { BerryIcon } from "@/components/ui/icons";

const HeroScene = dynamic(() => import("./HeroScene"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center">
      <div className="animate-bounce">
        <BerryIcon size={48} />
      </div>
    </div>
  ),
});

export function HeroStage() {
  return <HeroScene />;
}
