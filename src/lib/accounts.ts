import { deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { getDb } from "./firebase";
import type { DemoAccount, Role } from "./types";

const COLLECTION = "users";

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const normEmail = (e: string) => e.trim().toLowerCase();
const docIdFor = (email: string) => sha256(`acct:${normEmail(email)}`);
/** Demo-only verifier: a salted SHA-256 digest. Not production-grade credential storage. */
const verifierFor = (email: string, credential: string) =>
  sha256(`sentinelroute-demo:${normEmail(email)}:${credential}`);

export class AccountError extends Error {}

function friendly(e: unknown): never {
  const code = (e as { code?: string })?.code ?? "";
  if (e instanceof AccountError) throw e;
  if (code === "permission-denied")
    throw new AccountError(
      "Firestore security rules blocked this request. Use the offline demo access below — secure credential checks need a trusted backend.",
    );
  if (code === "unavailable")
    throw new AccountError(
      "Firestore is unreachable right now. Try again or use offline demo access.",
    );
  throw new AccountError("Account service error. Try again or use offline demo access.");
}

export async function registerAccount(input: {
  fullName: string;
  email: string;
  credential: string;
  role: Role;
}): Promise<DemoAccount> {
  try {
    const db = await getDb();
    const id = await docIdFor(input.email);
    const ref = doc(db, COLLECTION, id);
    if ((await getDoc(ref)).exists())
      throw new AccountError("A demo account with this email already exists.");
    const now = new Date().toISOString();
    const account: DemoAccount = {
      userId: id,
      fullName: input.fullName.trim(),
      email: normEmail(input.email),
      role: input.role,
      demoCredentialVerifier: await verifierFor(input.email, input.credential),
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(ref, account);
    return account;
  } catch (e) {
    friendly(e);
  }
}

export async function signInAccount(email: string, credential: string): Promise<DemoAccount> {
  try {
    const db = await getDb();
    const snap = await getDoc(doc(db, COLLECTION, await docIdFor(email)));
    if (!snap.exists()) throw new AccountError("No account found for that email.");
    const acc = snap.data() as DemoAccount;
    if (acc.demoCredentialVerifier !== (await verifierFor(email, credential)))
      throw new AccountError("Password does not match.");
    return acc;
  } catch (e) {
    friendly(e);
  }
}

export async function updateAccount(userId: string, patch: { fullName: string }): Promise<void> {
  try {
    const db = await getDb();
    await updateDoc(doc(db, COLLECTION, userId), {
      fullName: patch.fullName.trim(),
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    friendly(e);
  }
}

export async function deleteAccount(userId: string): Promise<void> {
  try {
    const db = await getDb();
    await deleteDoc(doc(db, COLLECTION, userId));
  } catch (e) {
    friendly(e);
  }
}
