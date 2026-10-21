import { db } from "@/firebase/config";
import useSnackerStore from "@/hooks/useSnackerStore";
import { doc, getDoc } from "firebase/firestore";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { IoIosCloseCircle } from "react-icons/io";
import { MdAddBox } from "react-icons/md";
import { MdIndeterminateCheckBox } from "react-icons/md";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "../ui/use-toast";
import { normalizeImageUrl } from "@/lib/utils";

const FoodBlock = ({ id, count, triggerReload, setTriggerReload }) => {
  const [product, setProduct] = useState({});
  const [load, setLoad] = useState(true);
  const { increaseQuantity, decreaseQuantity, removeProduct } =
    useSnackerStore();
  const [warning, setWarning] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    getProductData(id);
  }, []);

  useEffect(() => {
    if (triggerReload) {
      setLoad(true);
      getProductData(id);
      setTriggerReload(false);
    }
  }, [triggerReload]);

  useEffect(() => {
    if (product.stock === 0) {
      setWarning("Out of Stock");
      toast({
        title: "Stock Unavailable",
        description: "Some products in your cart are unavailable",
        variant: "destructive",
      });
    } else if (count > product.stock) {
      setWarning(`Only ${product.stock} available`);
    } else {
      setWarning("");
    }
  }, [count, product]);

  const getProductData = async (id) => {
    try {
      const docRef = doc(db, "products", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        console.log("Document data:", docSnap.data());
        const data = docSnap.data();
        setProduct(data);
      } else {
        console.log("No such document!");
      }
    } catch (error) {
      console.log(error);
    }
    setLoad(false);
  };
  if (load) {
    return (
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    );
  } else {
    return (
      <div className="flex flex-col rounded-lg bg-dark-100 p-3 shadow">
        <div className="flex justify-between">
          <div className="flex items-center gap-3">
            <Image
              src={normalizeImageUrl(product.imgSrc)}
              width={80}
              height={80}
              className="h-14 w-auto rounded-lg"
              alt={id}
            />
            <div className="flex flex-col">
              <h5 className="text-sm font-extralight">{product?.name}</h5>
              <h5 className="mb-1 text-xs leading-3 text-neutral-300">
                {product?.subtitle}
              </h5>
              <span className="font-medium">₹ {product?.price}.00</span>
            </div>
          </div>
          <div className="flex h-full flex-col items-end gap-3">
            <button onClick={() => removeProduct(id)}>
              <IoIosCloseCircle size={20} className="text-primary" />
            </button>
            <div className="flex items-center gap-1">
              <button
                disabled={product.stock === 0}
                onClick={() => decreaseQuantity(id)}
                className="h-fit text-neutral-100"
              >
                <MdIndeterminateCheckBox size={23} />
              </button>
              <span className="tabular-nums">{count}</span>
              <button
                disabled={product.stock === 0}
                onClick={() => increaseQuantity(id, product.stock)}
                className="h-fit text-neutral-100"
              >
                <MdAddBox size={23} />
              </button>
            </div>
          </div>
        </div>
        {warning && <p className="mt-2 text-red-600">{warning}</p>}
      </div>
    );
  }
};

export default FoodBlock;
