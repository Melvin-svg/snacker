"use client";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

// Admin check runs on the server; the admin email is never sent to the browser.
export default function useIsAdmin() {
  const { user } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    let cancelled = false;
    fetch("/api/admin/status")
      .then((r) => r.json())
      .then((d) => !cancelled && setIsAdmin(Boolean(d.isAdmin)))
      .catch(() => !cancelled && setIsAdmin(false));
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return isAdmin;
}
