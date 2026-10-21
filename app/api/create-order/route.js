import { adminDb, FieldValue } from "@/firebase/admin";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
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
  const orderId = nanoid();

  try {
    await adminDb.collection("orders").doc(orderId).set({
      userId: userId || "",
      products: products,
      amount: amount,
      status: "pending",
      timeStamp: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      orderId: orderId,
      message: "Order created successfully",
    });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
}
