import { Link, useNavigate, type LinkProps } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { LogOut, Menu, RotateCcw, X, UserCog } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Logo, Spinner } from "./primitives";
import { clearSession, useSession, type DemoSession } from "@/lib/session";
import { useDemo } from "@/state/demo-store";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface NavItem {
  to: NonNullable<LinkProps["to"]>;
  label: string;
  icon: typeof Menu;
  exact?: boolean;
}

/** Client-side role gate for the demo. Not server-enforced authorisation. */
export function useRoleGate(role: Role): DemoSession | null {
  const { session, ready } = useSession();
  const navigate = useNavigate();
  useEffect(() => {
    if (!ready) return;
    if (!session) navigate({ to: "/login" });
    else if (session.role !== role)
      navigate({ to: session.role === "partner_operator" ? "/partner" : "/driver" });
  }, [ready, session, role, navigate]);
  return ready && session?.role === role ? session : null;
}

function SignOut({ className }: { className?: string }) {
  const navigate = useNavigate();
  return (
    <button
      className={cn("flex items-center gap-2 text-sm", className)}
      onClick={() => {
        clearSession();
        navigate({ to: "/login" });
      }}
    >
      <LogOut className="h-4 w-4" /> Sign out
    </button>
  );
}

export function ResetDemoButton({ className }: { className?: string }) {
  const { resetDemo } = useDemo();
  return (
    <button
      className={cn("flex items-center gap-2 text-sm", className)}
      onClick={() => {
        if (confirm("Restore the original demonstration dataset?")) {
          resetDemo();
          toast.success("Demo data restored");
        }
      }}
    >
      <RotateCcw className="h-4 w-4" /> Reset demo data
    </button>
  );
}

export function GateLoading() {
  return (
    <div className="grid min-h-screen place-items-center">
      <Spinner className="h-6 w-6 text-muted-foreground" />
    </div>
  );
}

export function OperatorShell({
  nav,
  session,
  children,
}: {
  nav: NavItem[];
  session: DemoSession;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const links = (
    <nav className="space-y-1">
      {nav.map((n) => (
        <Link
          key={n.to}
          to={n.to}
          activeOptions={{ exact: n.exact }}
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          activeProps={{
            className: "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
          }}
        >
          <n.icon className="h-4 w-4" /> {n.label}
        </Link>
      ))}
    </nav>
  );
  const footer = (
    <div className="space-y-3 border-t border-sidebar-border pt-4 text-sidebar-foreground">
      <div className="text-xs">
        <p className="font-medium text-sidebar-accent-foreground">{session.fullName}</p>
        <p className="opacity-70">Partner operator{session.offline ? " · offline demo" : ""}</p>
      </div>
      <Link
        to="/partner/account"
        className="flex items-center gap-2 text-sm hover:text-sidebar-accent-foreground"
        onClick={() => setOpen(false)}
      >
        <UserCog className="h-4 w-4" /> Account
      </Link>
      <ResetDemoButton className="hover:text-sidebar-accent-foreground" />
      <SignOut className="hover:text-sidebar-accent-foreground" />
    </div>
  );
  return (
    <div className="min-h-screen bg-background md:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col justify-between bg-sidebar p-4 md:flex">
        <div className="space-y-6">
          <div className="px-2 pt-1">
            <Logo light />
          </div>
          {links}
        </div>
        {footer}
      </aside>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-card px-4 py-3 md:hidden">
        <Logo />
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu />
        </Button>
      </header>
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-navy/60" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col justify-between bg-sidebar p-4">
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <Logo light />
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="text-sidebar-foreground"
                >
                  <X />
                </button>
              </div>
              {links}
            </div>
            {footer}
          </div>
        </div>
      )}
      <main className="mx-auto max-w-7xl p-4 md:p-8">{children}</main>
    </div>
  );
}

export function DriverShell({ session, children }: { session: DemoSession; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-navy text-navy-foreground">
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-3">
          <Logo light />
          <div className="flex items-center gap-3 text-xs">
            <Link to="/driver/account" className="opacity-80 hover:opacity-100">
              {session.fullName.split(" ")[0]}
            </Link>
            <SignOut className="opacity-80 hover:opacity-100" />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-xl p-4 pb-16">{children}</main>
    </div>
  );
}
