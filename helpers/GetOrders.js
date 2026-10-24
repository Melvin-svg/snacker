import { adminDb } from "@/firebase/admin";
export { formatDateToYYYYMMDD, formatTimeTo12Hour } from "@/lib/utils";

// Server-only: Firestore rules deny all client reads of `orders`, so this runs through the
// Admin SDK and is scoped to the caller's own userId by the page that invokes it.
const toIso = (value) => {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate().toISOString();
  return value;
};

export const getOrders = async (userId) => {
  if (!userId) return [];
  try {
    const snapshot = await adminDb
      .collection("orders")
      .where("userId", "==", userId)
      .get();

    const orders = snapshot.docs.map((doc) => {
      const data = doc.data();
      return { id: doc.id, ...data, timeStamp: toIso(data.timeStamp) };
    });

    // In-memory sort: latest orders first
    orders.sort(
      (a, b) =>
        new Date(b.timeStamp || 0).getTime() -
        new Date(a.timeStamp || 0).getTime(),
    );

    return orders;
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
};
