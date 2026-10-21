import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Field, Panel, Spinner } from "./primitives";
import { deleteAccount, updateAccount } from "@/lib/accounts";
import { clearSession, saveSession, type DemoSession } from "@/lib/session";

export function AccountPanel({ session }: { session: DemoSession }) {
  const navigate = useNavigate();
  const [name, setName] = useState(session.fullName);
  const [busy, setBusy] = useState<"save" | "delete" | null>(null);

  const save = async () => {
    if (name.trim().length < 2) {
      toast.error("Enter a name");
      return;
    }
    setBusy("save");
    try {
      if (!session.offline) await updateAccount(session.userId, { fullName: name });
      saveSession({ ...session, fullName: name.trim() });
      toast.success("Account updated");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    setBusy("delete");
    try {
      if (!session.offline) await deleteAccount(session.userId);
      clearSession();
      toast.success("Demo account deleted");
      navigate({ to: "/login" });
    } catch (e) {
      toast.error((e as Error).message);
      setBusy(null);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <Panel title="Demo account">
        <div className="space-y-4">
          <Field label="Full name">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Email">
            <Input value={session.email} disabled />
          </Field>
          <Field label="Role">
            <Input
              value={session.role === "partner_operator" ? "Partner Operator" : "Driver"}
              disabled
            />
          </Field>
          {session.offline && (
            <p className="text-xs text-muted-foreground">
              Offline demo profile — changes are kept in this browser only.
            </p>
          )}
          <Button onClick={save} disabled={busy !== null}>
            {busy === "save" && <Spinner />} Save changes
          </Button>
        </div>
      </Panel>
      <Panel title="Delete account">
        <p className="mb-4 text-sm text-muted-foreground">
          Permanently removes this demonstration account record.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={busy !== null}>
              {busy === "delete" && <Spinner />} Delete account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this demo account?</AlertDialogTitle>
              <AlertDialogDescription>
                The account record will be removed and you will be signed out.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={remove}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Panel>
    </div>
  );
}
