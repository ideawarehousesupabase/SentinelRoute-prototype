import { useEffect, useState } from "react";
import type { Role } from "./types";

export interface DemoSession {
  userId: string;
  fullName: string;
  email: string;
  role: Role;
  offline: boolean;
}

const KEY = "sentinelroute-demo-session";

export function saveSession(s: DemoSession) {
  localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new Event("sr-session"));
}
export function clearSession() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("sr-session"));
}

/** Client-side demo session. Hiding routes in the browser is NOT server-enforced authorisation. */
export function useSession(): { session: DemoSession | null; ready: boolean } {
  const [session, setSession] = useState<DemoSession | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const read = () => {
      try {
        setSession(JSON.parse(localStorage.getItem(KEY) || "null"));
      } catch {
        setSession(null);
      }
      setReady(true);
    };
    read();
    window.addEventListener("sr-session", read);
    return () => window.removeEventListener("sr-session", read);
  }, []);
  return { session, ready };
}
