import { adminDb } from "@/firebase/admin";
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
    await adminDb.runTransaction(async (transaction) => {
      const userRef = adminDb.collection("users").doc(userId);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) {
        throw new Error("User does not exist");
      }

      const userCredits = userDoc.data()?.credit ?? 0;

      if (userCredits < amount) {
        throw new Error("insufficientCredit");
      }

      // Retrieve product documents in parallel
      const productRefs = products.map((product) =>
        adminDb.collection("products").doc(product.productId)
      );
      const productDocs = await transaction.getAll(...productRefs);

      // Verify stock availability and prepare updates
      for (const productDoc of productDocs) {
        if (!productDoc.exists) {
          throw new Error("insufficientStock");
        }
        const product = products.find((p) => p.productId === productDoc.id);
        const productData = productDoc.data();
        const currentStock = productData?.stock ?? 0;
        const newStock = currentStock - (product?.count ?? 1);

        if (newStock < 0) {
          throw new Error("insufficientStock");
        }

        transaction.update(productDoc.ref, { stock: newStock });
      }

      // Deduct credits from user
      const newCredits = userCredits - amount;
      transaction.update(userRef, {
        credit: newCredits,
      });
    });

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
