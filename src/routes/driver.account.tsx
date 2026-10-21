import { createFileRoute } from "@tanstack/react-router";
import { AccountPanel } from "@/components/sr/AccountPanel";
import { PageHeader } from "@/components/sr/primitives";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/driver/account")({
  head: () => ({
    meta: [
      { title: "Driver account — SentinelRoute" },
      { name: "description", content: "Manage your demo driver account." },
      { property: "og:title", content: "Driver account — SentinelRoute" },
      { property: "og:description", content: "Manage your demo driver account." },
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
