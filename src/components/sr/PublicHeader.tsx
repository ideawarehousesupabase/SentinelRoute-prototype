import { Link } from "@tanstack/react-router";
import { Logo } from "./primitives";
import { Button } from "@/components/ui/button";

const links = [
  { to: "/book", label: "Direct Booking" },
  { to: "/track", label: "Track Delivery" },
  { to: "/certificate", label: "View Certificate" },
] as const;

export function PublicHeader() {
  return (
    <header className="no-print border-b bg-card/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Logo />
        <nav className="flex flex-wrap items-center gap-1 text-sm">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              activeProps={{ className: "bg-muted text-foreground" }}
            >
              {l.label}
            </Link>
          ))}
          <Button asChild size="sm" variant="outline" className="ml-1">
            <Link to="/register">Register</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/login">Sign In</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">{children}</main>
    </div>
  );
}
