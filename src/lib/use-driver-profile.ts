import { useEffect, useState } from "react";
import { mockDrivers } from "@/data/mockDrivers";
import { useSession } from "./session";

const KEY = "sentinelroute-driver-profile";

/** Maps the signed-in demo driver to a mock driver profile (by email or name; otherwise user-selected). */
export function useDriverProfile() {
  const { session } = useSession();
  const [driverId, setDriverId] = useState<string>(mockDrivers[0].id);
  useEffect(() => {
    const stored = localStorage.getItem(KEY);
    const match = mockDrivers.find(
      (d) => d.email === session?.email || d.name.toLowerCase() === session?.fullName.toLowerCase(),
    );
    if (match) setDriverId(match.id);
    else if (stored && mockDrivers.some((d) => d.id === stored)) setDriverId(stored);
  }, [session]);
  const choose = (id: string) => {
    localStorage.setItem(KEY, id);
    setDriverId(id);
  };
  return { driver: mockDrivers.find((d) => d.id === driverId)!, choose };
}
