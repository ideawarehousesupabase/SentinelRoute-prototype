import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DriverShell, GateLoading, useRoleGate } from "@/components/sr/AppShell";

export const Route = createFileRoute("/driver")({
  head: () => ({ meta: [{ name: "robots", content: "noindex" }] }),
  component: DriverLayout,
});

function DriverLayout() {
  const session = useRoleGate("driver");
  if (!session) return <GateLoading />;
  return (
    <DriverShell session={session}>
      <Outlet />
    </DriverShell>
  );
}
