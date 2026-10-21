import { db } from "@/firebase/config";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";

export const getOrders = async (userId) => {
  if (!userId) return [];
  try {
    let orders = [];
    const q = query(
      collection(db, "orders"),
      where("userId", "==", userId),
      orderBy("timeStamp", "desc"),
    );
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      console.log(doc.id, " => ", doc.data());
      const data = doc.data();
      orders.push({ id: doc.id, ...data });
    });
    return orders;
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
};

export function formatDateToYYYYMMDD(date) {
  let newDate = new Date(date.seconds * 1000);
  const year = newDate.getFullYear();
  const month = String(newDate.getMonth() + 1).padStart(2, "0");
  const day = String(newDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatTimeTo12Hour(date) {
  let newDate = new Date(date.seconds * 1000);
  let hours = newDate.getHours();
  const minutes = String(newDate.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}
