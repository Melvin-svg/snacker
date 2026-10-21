import { db } from "@/firebase/config";
import { collection, getDocs, query, where } from "firebase/firestore";

export const getProductList = async () => {
  try {
    let products = [];
    const q = query(collection(db, "products"), where("stock", ">", 0));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      products.push({ id: doc.id, ...data });
    });
    return products;
  } catch (error) {
    console.error("Error fetching products from Firestore:", error);
    return [];
  }
};
