import { db } from "@/firebase/config";
import { collection, getDocs, query, where } from "firebase/firestore";
export { formatDateToYYYYMMDD, formatTimeTo12Hour } from "@/lib/utils";

export const getOrders = async (userId) => {
  if (!userId) return [];
  try {
    const orders = [];
    // Single-field query (requires no composite index in Firestore)
    const q = query(
      collection(db, "orders"),
      where("userId", "==", userId),
    );
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      orders.push({ id: doc.id, ...data });
    });

    // In-memory sort: latest orders first
    orders.sort((a, b) => {
      const aTime = a.timeStamp?.seconds ? a.timeStamp.seconds * 1000 : new Date(a.timeStamp || 0).getTime();
      const bTime = b.timeStamp?.seconds ? b.timeStamp.seconds * 1000 : new Date(b.timeStamp || 0).getTime();
      return bTime - aTime;
    });

    return orders;
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
};
