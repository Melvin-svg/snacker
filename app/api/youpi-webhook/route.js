import { adminDb, FieldValue } from "@/firebase/admin";
import { NextResponse } from "next/server";
import crypto from "node:crypto";

const WEBHOOK_SECRET = process.env.YOUPI_WEBHOOK_SECRET;

export async function POST(req) {
  if (!WEBHOOK_SECRET) {
    console.error("YOUPI_WEBHOOK_SECRET is not set; rejecting webhook");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 503 },
    );
  }

  const rawBody = await req.text(); // Raw body required for accurate HMAC verification
  const signature = req.headers.get("x-gateway-signature") || "";
  const deliveryId = req.headers.get("x-gateway-delivery-id");

  // No timestamp-age check: YouPI retries a failed delivery with its original timestamp, so
  // rejecting old ones would drop every retry after 5 minutes and leave a paid user uncredited.
  // Replays are harmless because payments/{orderId} below makes crediting idempotent.

  // Constant-time HMAC-SHA256 signature verification
  const expectedSig =
    "sha256=" +
    crypto.createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSig);

  if (
    sigBuf.length !== expBuf.length ||
    !crypto.timingSafeEqual(sigBuf, expBuf)
  ) {
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 401 },
    );
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Process verified SUCCESS payment event
  if (payload.event === "SUCCESS") {
    const userId = payload.metadata?.userId;
    const amountInINR = Number(payload.amount);
    const orderId = payload.orderId;

    if (!userId || !orderId || !(amountInINR > 0)) {
      // Signed, so the money really moved. Retrying cannot fix the payload, so park it
      // for manual crediting instead of dropping it.
      console.error("Unmatched SUCCESS webhook", {
        orderId,
        userId,
        amount: payload.amount,
        deliveryId,
      });
      try {
        await adminDb
          .collection("unmatchedPayments")
          .doc(orderId || deliveryId || crypto.randomUUID())
          .set({
            orderId: orderId || null,
            userId: userId || null,
            amount: payload.amount ?? null,
            utr: payload.utr || "",
            deliveryId: deliveryId || null,
            payload: rawBody,
            timeStamp: FieldValue.serverTimestamp(),
          });
      } catch (e) {
        console.error("Failed to record unmatched payment:", e);
        return NextResponse.json(
          { error: "Could not record payment" },
          { status: 500 },
        );
      }
      return NextResponse.json(
        { received: true, note: "Recorded for manual review" },
        { status: 200 },
      );
    }

    {
      const userRef = adminDb.collection("users").doc(userId);
      const paymentRef = adminDb.collection("payments").doc(orderId);

      try {
        await adminDb.runTransaction(async (transaction) => {
          // Idempotency: prevent double credit on retried webhooks
          const paymentDoc = await transaction.get(paymentRef);
          if (paymentDoc.exists) return;

          const userDoc = await transaction.get(userRef);
          // A Clerk user may pay before their wallet doc exists; create it rather than lose the payment
          const currentCredit = userDoc.exists
            ? userDoc.data()?.credit || 0
            : 0;
          transaction.set(
            userRef,
            {
              userId,
              credit: currentCredit + amountInINR,
              ...(userDoc.exists
                ? {}
                : { timeStamp: FieldValue.serverTimestamp() }),
            },
            { merge: true },
          );
          transaction.set(paymentRef, {
            userId,
            orderId,
            amount: amountInINR,
            utr: payload.utr || "",
            timeStamp: FieldValue.serverTimestamp(),
          });
        });
      } catch (e) {
        // Transient Firestore failure: return 500 so the gateway retries.
        // The payments/{orderId} idempotency check makes retries safe.
        console.error("Webhook credit transaction failed", {
          orderId,
          userId,
          error: e.message,
        });
        return NextResponse.json(
          { error: "Temporary failure, retry" },
          { status: 500 },
        );
      }
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
