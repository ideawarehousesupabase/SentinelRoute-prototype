import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Field, Spinner, selectClass } from "@/components/sr/primitives";
import { registerAccount } from "@/lib/accounts";
import { saveSession } from "@/lib/session";
import { AuthLayout } from "@/components/sr/AuthLayout";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account — SentinelRoute" },
      {
        name: "description",
        content: "Create an account for the SentinelRoute platform.",
      },
      { property: "og:title", content: "Create account — SentinelRoute" },
      {
        property: "og:description",
        content: "Register a partner operator or driver account.",
      },
    ],
  }),
  component: RegisterPage,
});

const schema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your name").max(80),
    email: z.string().trim().email("Enter a valid email").max(120),
    credential: z.string().min(6, "At least 6 characters").max(64),
    confirm: z.string(),
    role: z.enum(["partner_operator", "driver"], {
      errorMap: () => ({ message: "Choose a role" }),
    }),
  })
  .refine((d) => d.credential === d.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  });

function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    credential: "",
    confirm: "",
    role: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse(form);
    if (!r.success) {
      setErrors(Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message])));
      return;
    }
    setErrors({});
    setError(null);
    setLoading(true);
    try {
      const acc = await registerAccount(r.data);
      saveSession({
        userId: acc.userId,
        fullName: acc.fullName,
        email: acc.email,
        role: acc.role,
        offline: false,
      });
      toast.success("Account created");
      navigate({ to: acc.role === "partner_operator" ? "/partner" : "/driver" });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create account" subtitle="Enter your details to create an account.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Full name" error={errors.fullName}>
          <Input value={form.fullName} onChange={set("fullName")} placeholder="e.g. Alex Morgan" />
        </Field>
        <Field label="Email address" error={errors.email}>
          <Input
            type="email"
            autoComplete="email"
            placeholder="alex@example.com"
            value={form.email}
            onChange={set("email")}
          />
        </Field>
        <Field label="Password" error={errors.credential}>
          <PasswordInput
            autoComplete="new-password"
            placeholder="At least 6 characters"
            value={form.credential}
            onChange={set("credential")}
          />
        </Field>
        <Field label="Confirm password" error={errors.confirm}>
          <PasswordInput
            autoComplete="new-password"
            placeholder="Confirm your password"
            value={form.confirm}
            onChange={set("confirm")}
          />
        </Field>
        <Field label="Role" error={errors.role}>
          <select className={selectClass} value={form.role} onChange={set("role")}>
            <option value="">Select a role…</option>
            <option value="partner_operator">Partner Operator</option>
            <option value="driver">Driver</option>
          </select>
        </Field>
        {error && (
          <p className="flex items-start gap-2 rounded-md bg-destructive/10 p-2.5 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Spinner />} Create Account
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Sign In
        </Link>
      </p>
    </AuthLayout>
  );
}
