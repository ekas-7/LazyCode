import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getWorld } from "@/server/queries";
import { WorldView } from "@/components/world/WorldView";
import { BerryIcon } from "@/components/ui/icons";

export const metadata: Metadata = { title: "The Journey" };

async function World() {
  await connection(); // request-time render: runs before any DB I/O
  const user = await getCurrentUser();
  const world = await getWorld(user?._id ?? null);
  return (
    <WorldView
      regions={world.regions}
      quests={world.quests}
      userId={user?._id ?? null}
      username={user?.username ?? null}
    />
  );
}

function Loading() {
  return (
    <div className="mx-auto w-full max-w-[1500px] flex-1 px-4 pb-2 sm:px-8">
      <div className="panel grid h-[calc(100svh-150px)] min-h-[640px] place-items-center !rounded-[34px]">
        <div className="flex flex-col items-center gap-3 text-muted">
          <div className="animate-bounce">
            <BerryIcon size={44} />
          </div>
          <p className="font-serif italic">Unrolling the map…</p>
        </div>
      </div>
    </div>
  );
}

export default function WorldPage() {
  return (
    <Suspense fallback={<Loading />}>
      <World />
    </Suspense>
  );
}
