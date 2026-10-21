import { createFileRoute, Outlet } from "@tanstack/react-router";
import { LayoutDashboard, Boxes, Link2, Lock, ShieldAlert, Plug } from "lucide-react";
import { GateLoading, OperatorShell, useRoleGate, type NavItem } from "@/components/sr/AppShell";

export const Route = createFileRoute("/partner")({
  head: () => ({ meta: [{ name: "robots", content: "noindex" }] }),
  component: PartnerLayout,
});

const nav: NavItem[] = [
  { to: "/partner", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/partner/jobs", label: "Custody Jobs", icon: Boxes },
  { to: "/partner/ledger", label: "Custody Ledger", icon: Link2 },
  { to: "/partner/seals", label: "Smart-Seal Inventory", icon: Lock },
  { to: "/partner/anomalies", label: "Anomaly Review", icon: ShieldAlert },
  { to: "/partner/integration", label: "Integration & Usage", icon: Plug },
];

function PartnerLayout() {
  const session = useRoleGate("partner_operator");
  if (!session) return <GateLoading />;
  return (
    <OperatorShell nav={nav} session={session}>
      <Outlet />
    </OperatorShell>
  );
}
