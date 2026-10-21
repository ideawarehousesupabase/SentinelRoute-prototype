import { createFileRoute } from "@tanstack/react-router";
import { AccountPanel } from "@/components/sr/AccountPanel";
import { PageHeader } from "@/components/sr/primitives";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/partner/account")({
  head: () => ({
    meta: [
      { title: "Account — SentinelRoute" },
      { name: "description", content: "Manage your demo account." },
      { property: "og:title", content: "Account — SentinelRoute" },
      { property: "og:description", content: "Manage your demo account." },
    ],
  }),
  component: () => {
    const { session } = useSession();
    return (
      <>
        <PageHeader title="Account" />
        {session && <AccountPanel session={session} />}
      </>
    );
  },
});
