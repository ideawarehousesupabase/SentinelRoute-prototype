import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  Inbox,
  Loader2,
  FlaskConical,
  Lock,
  LockOpen,
  ShieldAlert,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { JobStatus, SealStatus, VerificationStatus } from "@/lib/types";

export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <Link
      to="/"
      className={cn("flex items-center gap-2 font-display font-semibold tracking-tight", className)}
    >
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-success text-success-foreground">
        <ShieldCheck className="h-5 w-5" />
      </span>
      <span className={light ? "text-navy-foreground" : "text-foreground"}>
        Sentinel<span className="text-success">Route</span>
      </span>
    </Link>
  );
}

export function PrototypeBanner(_props?: { className?: string }) {
  return null;
}

export { PasswordInput } from "@/components/ui/password-input";

type Tone = "neutral" | "info" | "success" | "warning" | "danger";
const tones: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground border-border",
  info: "bg-primary/10 text-primary border-primary/20",
  success: "bg-success/12 text-success border-success/25",
  warning: "bg-warning/15 text-warning-foreground border-warning/40",
  danger: "bg-destructive/10 text-destructive border-destructive/25",
};

export function Pill({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      <Circle className="h-1.5 w-1.5 fill-current" />
      {children}
    </span>
  );
}

const jobTone: Record<JobStatus, Tone> = {
  Booked: "neutral",
  "Awaiting Collection": "info",
  Collected: "info",
  "In Transit": "info",
  "At Delivery": "warning",
  Completed: "success",
  Flagged: "danger",
};
export const JobStatusBadge = ({ status }: { status: JobStatus }) => (
  <Pill tone={jobTone[status]}>{status}</Pill>
);

const verTone: Record<VerificationStatus, Tone> = {
  Pending: "neutral",
  Verified: "success",
  Flagged: "danger",
  "Review Cleared": "warning",
};
export const VerificationBadge = ({ status }: { status: VerificationStatus }) => (
  <Pill tone={verTone[status]}>{status}</Pill>
);

const sealTone: Record<SealStatus, Tone> = {
  Available: "neutral",
  Paired: "info",
  Active: "success",
  "Breach Detected": "danger",
  Retired: "neutral",
};
export function SealIndicator({ status, id }: { status: SealStatus; id?: string | null }) {
  const Icon =
    status === "Breach Detected"
      ? ShieldAlert
      : status === "Available" || status === "Retired"
        ? LockOpen
        : Lock;
  return (
    <span className="inline-flex items-center gap-2">
      <Icon
        className={cn(
          "h-4 w-4",
          status === "Breach Detected"
            ? "text-destructive"
            : status === "Active"
              ? "text-success"
              : "text-muted-foreground",
        )}
      />
      {id && <span className="font-mono text-xs">{id}</span>}
      <Pill tone={sealTone[status]}>{status}</Pill>
    </span>
  );
}

export function MetricCard({
  label,
  value,
  icon,
  tone = "info",
  hint,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  tone?: Tone;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className={cn("grid h-9 w-9 place-items-center rounded-lg border", tones[tone])}>
          {icon}
        </span>
      </div>
      <p className="mt-3 font-display text-3xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border bg-card shadow-card", className)}>
      {title && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3.5">
          <h2 className="text-base font-semibold">{title}</h2>
          {action}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold md:text-3xl">{title}</h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-10 text-center">
      <Inbox className="h-8 w-8 text-muted-foreground" />
      <p className="mt-3 font-medium">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export const Spinner = ({ className }: { className?: string }) => (
  <Loader2 className={cn("h-4 w-4 animate-spin", className)} />
);

export function Field({
  label,
  error,
  children,
  hint,
}: {
  label: string;
  error?: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && !error && <span className="block text-xs text-muted-foreground">{hint}</span>}
      {error && <span className="block text-xs text-destructive">{error}</span>}
    </label>
  );
}

export const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  });
