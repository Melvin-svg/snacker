import { db } from "@/firebase/config";
import { doc, runTransaction } from "firebase/firestore";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(req) {
  const { userId: sessionUserId } = auth();
  if (!sessionUserId) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const data = await req.json();
  const { products, amount } = data;
  const userId = sessionUserId;

  try {
    const result = await runTransaction(db, async (transaction) => {
      const userRef = doc(db, "users", userId);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists()) {
        throw new Error("User does not exist");
      }

      const userCredits = userDoc.data().credit;

      if (userCredits < amount) {
        throw new Error("insufficientCredit");
      }

      // Retrieve product documents in parallel
      const productPromises = products.map(async (product) => {
        const productRef = doc(db, "products", product.productId);
        const productDoc = await transaction.get(productRef);
        return { productRef, productDoc };
      });

      const productDocs = await Promise.all(productPromises);

      // Update actual stock
      productDocs.forEach(({ productRef, productDoc }) => {
        const product = products.find((p) => p.productId === productRef.id);
        const productData = productDoc.data();
        const newStock = productData.stock - product.count;

        if (newStock < 0) {
          throw new Error("insufficientStock");
        }

        transaction.update(productRef, {
          stock: newStock,
        });
      });

      // Deduct credits from user
      const newCredits = userCredits - amount;
      transaction.update(userRef, {
        credit: newCredits,
      });
    });

    console.log("Purchase Successfull");
    return NextResponse.json({
      success: true,
      message: "Purchase Successfull",
    });
  } catch (e) {
    console.error("Error buying products:", e.message);

    if (e.message === "insufficientCredit") {
      return NextResponse.json({ success: false, insufficientCredit: true });
    } else if (e.message === "insufficientStock") {
      return NextResponse.json({
        success: false,
        insufficientCredit: false,
        insufficientStock: true,
      });
    }

    return NextResponse.json({
      success: false,
      insufficientCredit: false,
      insufficientStock: false,
      error: e.message,
    });
  }
}
