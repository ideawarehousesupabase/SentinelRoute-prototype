import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { AlertCircle, CheckCircle2, Building2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Field, Spinner } from "@/components/sr/primitives";
import { AuthLayout } from "@/components/sr/AuthLayout";
import { signInAccount } from "@/lib/accounts";
import { saveSession } from "@/lib/session";
import { mockUsers } from "@/data/mockUsers";
import type { Role } from "@/lib/types";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — SentinelRoute" },
      {
        name: "description",
        content: "Sign in for SentinelRoute partner operators and drivers.",
      },
      { property: "og:title", content: "Sign in — SentinelRoute" },
      {
        property: "og:description",
        content: "Access the SentinelRoute platform as a partner operator or driver.",
      },
    ],
  }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  credential: z.string().min(6, "At least 6 characters"),
});

function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", credential: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<{ kind: "error" | "success"; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const go = (role: Role) => navigate({ to: role === "partner_operator" ? "/partner" : "/driver" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse(form);
    if (!r.success) {
      setErrors(Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message])));
      return;
    }
    setErrors({});
    setStatus(null);
    setLoading(true);
    try {
      const acc = await signInAccount(r.data.email, r.data.credential);
      saveSession({
        userId: acc.userId,
        fullName: acc.fullName,
        email: acc.email,
        role: acc.role,
        offline: false,
      });
      setStatus({ kind: "success", msg: `Welcome back, ${acc.fullName}.` });
      go(acc.role);
    } catch (err) {
      setStatus({ kind: "error", msg: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const quick = (i: number) => {
    const u = mockUsers[i];
    saveSession({
      userId: `offline-${u.role}`,
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      offline: true,
    });
    go(u.role);
  };

  return (
    <AuthLayout title="Sign in" subtitle="Enter your email and password to sign in.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Email" error={errors.email}>
          <Input
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </Field>
        <Field label="Password" error={errors.credential}>
          <PasswordInput
            autoComplete="current-password"
            placeholder="Enter your password"
            value={form.credential}
            onChange={(e) => setForm({ ...form, credential: e.target.value })}
          />
        </Field>
        {status && (
          <p
            className={`flex items-start gap-2 rounded-md p-2.5 text-sm ${status.kind === "error" ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}
          >
            {status.kind === "error" ? (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            {status.msg}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Spinner />} Sign In
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Link
          to="/register"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Create Account
        </Link>
      </p>
      <div className="mt-8 border-t pt-5">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Quick test access
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => quick(0)}>
            <Building2 /> Operator
          </Button>
          <Button variant="outline" onClick={() => quick(1)}>
            <Truck /> Driver
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}
