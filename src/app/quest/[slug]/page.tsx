import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getPublicQuest, getRegion } from "@/server/queries";
import { QuestWorkspace } from "@/components/quest/QuestWorkspace";
import { BerryIcon, LockIcon } from "@/components/ui/icons";

export const metadata: Metadata = { title: "Quest" };

async function Quest({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/quest/${slug}`)}`);

  const found = await getPublicQuest(user._id, slug);
  if (!found) notFound();

  if (!found.unlocked) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 items-center px-5 py-10">
        <div className="panel animate-float-up w-full p-10 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-cream-2 text-muted">
            <LockIcon size={26} />
          </div>
          <h1 className="script text-[3rem]">Not just yet</h1>
          <p className="mt-3 text-muted">
            <b className="font-medium text-ink">{found.quest.title}</b> is still locked. Finish the quests before
            it on the map to open this stone.
          </p>
          <Link href="/world" className="btn btn-teal mt-6">
            Back to the map
          </Link>
        </div>
      </main>
    );
  }

  const region = await getRegion(found.quest.regionId);
  return (
    <QuestWorkspace
      quest={found.quest}
      regionName={region?.name ?? "The Journey"}
      userId={user._id}
      berries={user.berries}
    />
  );
}

function Loading() {
  return (
    <div className="grid flex-1 place-items-center">
      <div className="animate-bounce">
        <BerryIcon size={44} />
      </div>
    </div>
  );
}

export default function QuestPage({ params }: PageProps<"/quest/[slug]">) {
  return (
    <Suspense fallback={<Loading />}>
      <Quest params={params} />
    </Suspense>
  );
}
