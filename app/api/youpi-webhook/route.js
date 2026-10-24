import { adminDb, FieldValue } from "@/firebase/admin";
import { NextResponse } from "next/server";
import crypto from "node:crypto";

const WEBHOOK_SECRET = process.env.YOUPI_WEBHOOK_SECRET;

export async function POST(req) {
  if (!WEBHOOK_SECRET) {
    console.error("YOUPI_WEBHOOK_SECRET is not set; rejecting webhook");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const rawBody = await req.text(); // Raw body required for accurate HMAC verification
  const signature = req.headers.get("x-gateway-signature") || "";

  // No timestamp-age check: YouPI retries a failed delivery with its original timestamp, so
  // rejecting old ones would drop every retry after 5 minutes and leave a paid user uncredited.
  // Replays are harmless because payments/{orderId} below makes crediting idempotent.

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
      const userRef = adminDb.collection("users").doc(userId);
      const paymentRef = adminDb.collection("payments").doc(orderId);

      await adminDb.runTransaction(async (transaction) => {
        // Idempotency: prevent double credit on retried webhooks
        const paymentDoc = await transaction.get(paymentRef);
        if (paymentDoc.exists) return;

        const userDoc = await transaction.get(userRef);
        if (userDoc.exists) {
          const currentCredit = userDoc.data()?.credit || 0;
          transaction.update(userRef, { credit: currentCredit + amountInINR });
        } else {
          // Paid before a profile was created: create it with this payment instead of failing
          transaction.set(userRef, {
            name: "User",
            userId,
            credit: amountInINR,
            timeStamp: FieldValue.serverTimestamp(),
          });
        }
        transaction.set(paymentRef, {
          userId,
          orderId,
          amount: amountInINR,
          utr: payload.utr || "",
          timeStamp: FieldValue.serverTimestamp(),
        });
      });
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
