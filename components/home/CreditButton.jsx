"use client";
import React, { useState, useEffect } from "react";
import { FaCreditCard } from "react-icons/fa";
import useSnackerStore from "@/hooks/useSnackerStore";
import { Skeleton } from "../ui/skeleton";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/config";
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

    // Realtime sync: updates wallet balance instantly when the background webhook processes
    const unsubscribe = onSnapshot(
      doc(db, "users", userId),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCredit(data.credit ?? 0);
        }
        setLoad(false);
      },
      (error) => {
        console.error("Realtime credit sync error:", error);
        setLoad(false);
      }
    );

    return () => unsubscribe();
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
