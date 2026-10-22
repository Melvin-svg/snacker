import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import useSnackerStore from "./useSnackerStore";
import { createOrder } from "@/utils/createOrder";
import { useToast } from "@/components/ui/use-toast";

const usePurchaseProduct = () => {
  const { user } = useUser();
  const { updateCredit, removeAll, setOpenCreditWallet } = useSnackerStore();
  const [buttonLoad, setButtonLoad] = useState(false);
  const [data, setData] = useState({});
  const [openOrder, setOpenOrder] = useState(false);
  const [triggerReload, setTriggerReload] = useState(false);
  const { toast } = useToast();

  const purchaseProduct = async (products, amount, type = "normal") => {
    setButtonLoad(true);
    try {
      const res = await createOrder(products);
      if (res.success) {
        setOpenOrder(true);
        setData({ orderId: res.orderId, amount: res.amount });
        updateCredit(-res.amount);
        if (type === "cart") removeAll();
      } else if (res.insufficientCredit) {
        toast({
          title: "Insufficient Wallet Balance",
          description: "Please recharge your wallet to proceed with the order.",
          variant: "destructive",
        });
        setOpenCreditWallet(true);
      } else if (res.insufficientStock) {
        toast({
          title: "Out of Stock",
          description: "This product is currently out of stock.",
          variant: "destructive",
        });
        if (type === "cart") setTriggerReload(true);
      } else {
        toast({
          title: "Error",
          description:
            res.error || "An unknown error occurred. Please try again later.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error during reservation process:", error.message);
      toast({
        title: "Error Occured",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setButtonLoad(false);
    }
  };

  return {
    purchaseProduct,
    buttonLoad,
    data,
    openOrder,
    setOpenOrder,
    triggerReload,
    setTriggerReload,
  };
};

export default usePurchaseProduct;
