import { db } from "@/firebase/config";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { NextResponse } from "next/server";
import crypto from "node:crypto";

const WEBHOOK_SECRET = process.env.YOUPI_WEBHOOK_SECRET || "snacker_youpi_secret_8899";

export async function POST(req) {
  const rawBody = await req.text(); // Raw body required for accurate HMAC verification
  const signature = req.headers.get("x-gateway-signature") || "";
  const deliveryId = req.headers.get("x-gateway-delivery-id");
  const timestamp = Number(req.headers.get("x-gateway-timestamp"));

  // Stale check (older than 5 minutes)
  if (timestamp && Date.now() - timestamp > 5 * 60 * 1000) {
    return NextResponse.json({ received: true, note: "Stale delivery ignored" }, { status: 200 });
  }

  // Constant-time HMAC-SHA256 signature verification
  const expectedSig = "sha256=" + crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSig);

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);

  // Process verified SUCCESS payment event
  if (payload.event === "SUCCESS") {
    const userId = payload.metadata?.userId;
    const amountInINR = Number(payload.amount);
    const orderId = payload.orderId;

    if (userId && amountInINR > 0) {
      const userRef = doc(db, "users", userId);
      const paymentRef = doc(db, "payments", orderId);

      await runTransaction(db, async (transaction) => {
        // Idempotency: prevent double credit on retried webhooks
        const paymentDoc = await transaction.get(paymentRef);
        if (paymentDoc.exists()) return;

        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw new Error("User document does not exist");

        const currentCredit = userDoc.data().credit || 0;
        transaction.update(userRef, { credit: currentCredit + amountInINR });
        transaction.set(paymentRef, {
          userId,
          orderId,
          amount: amountInINR,
          utr: payload.utr || "",
          timeStamp: serverTimestamp(),
        });
      });
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
