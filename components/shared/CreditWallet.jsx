"use client";
import React, { useEffect, useState } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "../ui/button";
import { FaCoins } from "react-icons/fa";
import { processPayment } from "@/utils/processPayment";
import { useUser } from "@clerk/nextjs";
import { useToast } from "../ui/use-toast";
import useSnackerStore from "@/hooks/useSnackerStore";

const CreditWallet = () => {
  const { openCreditWallet, setOpenCreditWallet } = useSnackerStore();
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    if (!openCreditWallet) {
      setLoading(false);
    }
  }, [openCreditWallet]);

  const handleRecharge = async () => {
    setLoading(true);
    try {
      const res = await processPayment(amount, user);
      if (res.ok) {
        setOpenCreditWallet(false);
        toast({
          title: "Recharge Initiated",
          description: `Complete your UPI transfer in the opened tab. Your wallet will update live.`,
          className: "bg-blue-600 text-white",
        });
      }
    } catch (e) {
      toast({
        title: "Recharge Failed",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer open={openCreditWallet} onOpenChange={setOpenCreditWallet}>
      <DrawerContent className="border-0 bg-dark-100 text-white">
        <DrawerHeader>
          <DrawerTitle>Recharge Your Wallet</DrawerTitle>
          <DrawerDescription className="text-neutral-400">
            Select a predefined amount or enter a custom amount to recharge your
            wallet points via YouPI UPI Gateway.
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col items-center py-4">
          <div className="mb-4 flex gap-4">
            {[20, 50, 100].map((value) => (
              <button
                key={value}
                className={`flex gap-1 rounded-lg bg-zinc-700 p-2 px-3 font-bold text-white shadow transition duration-200 ${amount === value && "scale-125"}`}
                onClick={() => setAmount(value)}
                disabled={loading}
              >
                {value}
                <FaCoins size={20} className="text-yellow-500" />
              </button>
            ))}
          </div>
          <div className="my-2 flex w-full flex-col items-center gap-1 px-4 text-center">
            <p>Enter an Amount</p>
            <input
              type="number"
              className="w-28 rounded-lg border-2 bg-transparent p-2 text-center text-xl text-white"
              placeholder="₹0"
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value))}
              disabled={loading}
            />
          </div>
        </div>
        <DrawerFooter className="flex justify-between">
          <Button
            className="bg-primary text-black transition duration-200 hover:bg-primary disabled:bg-primary/80"
            onClick={handleRecharge}
            disabled={loading || amount <= 0}
          >
            {loading ? "Processing..." : "Recharge Now"}
          </Button>
          <DrawerClose asChild>
            <Button
              disabled={loading}
              className="border bg-transparent text-neutral-100 transition duration-200 hover:bg-neutral-800"
            >
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default CreditWallet;
