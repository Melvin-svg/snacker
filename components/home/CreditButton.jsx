"use client";
import React, { useState, useEffect } from "react";
import { FaCreditCard } from "react-icons/fa";
import useSnackerStore from "@/hooks/useSnackerStore";
import { Skeleton } from "../ui/skeleton";
import { TbSquareRoundedPlusFilled } from "react-icons/tb";

const CreditButton = ({ userId }) => {
  const {
    credit: storedCredit,
    setCredit,
    setOpenCreditWallet,
  } = useSnackerStore();
  const [load, setLoad] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoad(false);
      return;
    }

    // Poll the server for the balance (Firestore rules block direct client reads), so the
    // wallet still updates shortly after the background webhook credits a recharge.
    let cancelled = false;
    const refresh = async () => {
      try {
        const res = await fetch("/api/wallet", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled && data.exists) setCredit(data.credit ?? 0);
      } catch (error) {
        console.error("Wallet sync error:", error);
      } finally {
        if (!cancelled) setLoad(false);
      }
    };

    refresh();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, 5000);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [userId, setCredit]);

  return (
    <div className="relative">
      {load ? (
        <Skeleton className={"h-6 w-20"} />
      ) : (
        <button
          onClick={() => setOpenCreditWallet(true)}
          className="flex items-center gap-2 rounded-lg bg-dark-100 p-1 px-2"
        >
          <span className="text-white">wallet: ₹{storedCredit}</span>
          <FaCreditCard size={20} className="text-yellow-500" />
        </button>
      )}
      <div className="absolute -right-3 -bottom-1 rounded-full px-2 font-semibold shadow">
        <TbSquareRoundedPlusFilled className="text-green-600" size={15} />
      </div>
    </div>
  );
};

export default CreditButton;
