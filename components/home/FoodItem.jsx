import useSnackerStore from "@/hooks/useSnackerStore";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MdAddBox, MdIndeterminateCheckBox } from "react-icons/md";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import OrderSuccessBlock from "../shared/OrderSuccessBlock";
import { FaCartPlus } from "react-icons/fa";
import { Inter } from "next/font/google";
import usePurchaseProduct from "@/hooks/usePurchaseProduct";
import { useToast } from "../ui/use-toast";
import Button from "../shared/Button";
import { normalizeImageUrl } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

const FoodItem = ({
  productId,
  name,
  price,
  stock,
  imgSrc,
  position,
  subtitle,
}) => {
  const { addProduct, openCreditWallet } = useSnackerStore();
  const { purchaseProduct, buttonLoad, data, openOrder, setOpenOrder } =
    usePurchaseProduct();
  const [count, setCount] = useState(1);
  const [amount, setAmount] = useState(0);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setAmount(price * count);
  }, [count]);

  useEffect(() => {
    if (openCreditWallet) setOpen(false);
  }, [openCreditWallet]);

  const buyProduct = async () => {
    const products = [
      {
        productId,
        count,
        price,
        name,
        subtitle,
        position,
      },
    ];
    purchaseProduct(products, amount);
  };

  const addToCart = () => {
    addProduct(productId, 1, price, name, position, subtitle);
    toast({
      title: "Added To Cart",
      description: `${name} has been added to your cart`,
      className: "bg-primary text-black",
    });
  };

  return (
    <motion.div 
      className="relative flex w-full flex-col rounded-lg bg-[#1f1e1e] p-3 text-neutral-100 shadow"
      whileHover={{ 
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
        transition: { duration: 0.3 }
      }}
    >
      <motion.div 
        className="aspect-square w-full rounded-md bg-gray-600 overflow-hidden"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <Image
          src={normalizeImageUrl(imgSrc)}
          width={200}
          height={200}
          className="h-full w-auto rounded-md"
          alt={productId}
        />
      </motion.div>
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`${inter.className} mt-2`}>{name}</h3>
          <h5 className="mb-1 text-xs leading-3 text-neutral-300 truncate max-w-full">
            {subtitle.length > 13 ? `${subtitle.slice(0, 13)}...` : subtitle}
          </h5>
          <span className="font-semibold">₹ {price}.00</span>
        </div>
        <motion.button
          onClick={addToCart}
          className="h-fit rounded-md bg-primary p-1 hover:bg-primary/70"
          whileHover={{ 
            scale: 1.1,
            rotate: 5,
            transition: { duration: 0.2 }
          }}
          whileTap={{ 
            scale: 0.9,
            transition: { duration: 0.1 }
          }}
        >
          <FaCartPlus className="text-dark-200" size={20} />
        </motion.button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button className="mt-2 bg-yellow-400 py-1">Buy Now</Button>
          </motion.div>
        </DialogTrigger>
        <DialogContent className="border-0 bg-dark-100 py-6 text-neutral-50 outline-none max-w-md mx-auto">
          <DialogHeader className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center space-y-4"
            >
              {/* Product Image */}
              <motion.div
                className="relative w-32 h-32 rounded-2xl overflow-hidden bg-dark-200 shadow-lg"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <Image
                  src={normalizeImageUrl(imgSrc)}
                  fill
                  className="object-cover"
                  alt={name}
                />
              </motion.div>
              
              {/* Product Info */}
              <div className="text-center">
                <motion.h3 
                  className="text-xl font-bold text-white"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                >
                  {name}
                </motion.h3>
                <motion.p 
                  className="text-sm text-neutral-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  {subtitle}
                </motion.p>
              </div>
            </motion.div>

            {/* Price and Quantity Section */}
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              {/* Price Display */}
              <div className="flex justify-center">
                <div className="bg-primary/10 rounded-lg px-4 py-2 border border-primary/20">
                  <span className="text-2xl font-bold text-primary">₹{price * count}.00</span>
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="space-y-3">
                <p className="text-center text-sm font-medium text-neutral-300">
                  Select Quantity
                </p>
                <div className="flex items-center justify-center gap-4">
                  <motion.button
                    onClick={() => setCount(count > 1 ? count - 1 : count)}
                    className="h-10 w-10 rounded-full bg-dark-200 flex items-center justify-center hover:bg-dark-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    disabled={count <= 1}
                  >
                    <MdIndeterminateCheckBox size={20} className="text-white" />
                  </motion.button>
                  
                  <motion.div 
                    className="min-w-[60px] text-center"
                    key={count}
                    initial={{ scale: 1.2, color: "#fbbf24" }}
                    animate={{ scale: 1, color: "#ffffff" }}
                    transition={{ duration: 0.2 }}
                  >
                    <span className="text-2xl font-bold tabular-nums">{count}</span>
                  </motion.div>
                  
                  <motion.button
                    onClick={() =>
                      setCount(count < 4 && count < stock ? count + 1 : count)
                    }
                    className="h-10 w-10 rounded-full bg-dark-200 flex items-center justify-center hover:bg-dark-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    disabled={count >= 4 || count >= stock}
                  >
                    <MdAddBox size={20} className="text-white" />
                  </motion.button>
                </div>
                
                {/* Stock Info */}
                <p className="text-center text-xs text-neutral-500">
                  Available: {stock} units
                </p>
              </div>

              {/* Pay Button */}
              <motion.div
                className="pt-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={buyProduct}
                  className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-dark-200 font-bold py-3 rounded-lg shadow-lg disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200"
                  loading={buttonLoad}
                >
                  {buttonLoad ? "Processing..." : `Pay ₹${price * count}.00`}
                </Button>
              </motion.div>
            </motion.div>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <motion.div 
        className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-green-600 text-center text-sm font-semibold text-white shadow"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ 
          delay: 0.3,
          type: "spring",
          stiffness: 200
        }}
        whileHover={{ 
          scale: 1.1,
          rotate: 5,
          transition: { duration: 0.2 }
        }}
      >
        {stock}
      </motion.div>
      <OrderSuccessBlock open={openOrder} setOpen={setOpenOrder} data={data} />
    </motion.div>
  );
};

export default FoodItem;
