import type { Role } from "@/lib/types";

/** Offline demo profiles used by the "quick demo access" buttons. Not stored in Firestore. */
export const mockUsers: { fullName: string; email: string; role: Role }[] = [
  {
    fullName: "Helen Carter (Demo Operator)",
    email: "operator@demo.sentinelroute.test",
    role: "partner_operator",
  },
  { fullName: "Daniel Okafor", email: "daniel.driver@demo.sentinelroute.test", role: "driver" },
];
