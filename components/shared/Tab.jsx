"use client";
import React, { useEffect, useState } from "react";
import { RiHome2Fill } from "react-icons/ri";
import { RiChatHistoryFill } from "react-icons/ri";
import { usePathname } from "next/navigation";
import Link from "next/link";
import useSnackerStore from "@/hooks/useSnackerStore";
import { ref, onValue } from "firebase/database";
import { rtdb } from "@/firebase/config";
import UpdationBlock from "./UpdationBlock";
import { RiShoppingCartFill } from "react-icons/ri";
import { useAuth } from "@clerk/nextjs";
import useIsAdmin from "@/hooks/useIsAdmin";
import Disclaimer from "./Disclaimer";

const Tab = () => {
  const { userId } = useAuth();
  const isAdmin = useIsAdmin();
  const path = usePathname();
  const { products } = useSnackerStore();
  const [hasProducts, setHasProducts] = useState(false);
  const [onUpdation, setOnUpdation] = useState(false);

  useEffect(() => {
    setHasProducts(products.length > 0);
  }, [products]);

  useEffect(() => {
    if (!rtdb) return;
    try {
      const starCountRef = ref(rtdb, "/onStockUpdation/status");
      onValue(starCountRef, (snapshot) => {
        const isUpdating = Boolean(snapshot.val());
        if (isUpdating) {
          const isCurrentAdmin = isAdmin;
          if (!isCurrentAdmin && userId !== process.env.NEXT_PUBLIC_TESTUSER_ID) {
            setOnUpdation(true);
          } else {
            setOnUpdation(false);
          }
        } else {
          setOnUpdation(false);
        }
      });
    } catch (error) {
      console.log(error.message);
    }
  }, [isAdmin, userId]);

  return (
    <div className="fixed bottom-0 left-0 flex w-full items-center justify-evenly border-t border-dark-200 bg-dark-100 p-2 py-1">
      <Link
        href={"/"}
        className={`rounded-lg p-1 ${path === "/" ? "text-white" : "text-primary/70"}`}
      >
        <div className="flex flex-col items-center gap-1">
          <RiHome2Fill size={20} />
          <span className="text-xs font-light">Home</span>
        </div>

        <UpdationBlock onUpdation={onUpdation} />
        {/* <Disclaimer /> */}
      </Link>
      <Link
        href={"/cart"}
        className={`relative rounded-lg p-1 ${path === "/cart" ? "text-white" : "text-primary/70"}`}
      >
        <div className="flex flex-col items-center gap-1">
          <RiShoppingCartFill size={20} />
          <span className="text-xs font-light">Cart</span>
        </div>

        {hasProducts && path !== "/cart" && (
          <div className="absolute right-1 top-1 h-3 w-3 rounded-full border border-primary bg-red-600"></div>
        )}
      </Link>
      <Link
        href={"/orders"}
        className={`rounded-lg p-1 ${path === "/orders" ? "text-white" : "text-primary/70"}`}
      >
        <div className="flex flex-col items-center gap-1">
          <RiChatHistoryFill size={20} />
          <span className="text-xs font-light">Orders</span>
        </div>
      </Link>
    </div>
  );
};

export default Tab;
