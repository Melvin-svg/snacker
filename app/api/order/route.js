import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { nanoid } from "nanoid";
import { adminDb } from "@/firebase/admin";
import { ensureUserDoc } from "@/lib/ensureUser";

// Configurable gateway endpoint supporting local dev, subdomains, Docker, and remote production hosting
const DEFAULT_GATEWAY_URL = (
  process.env.YOUPI_GATEWAY_URL ||
  (process.env.YOUPI_PORT ? `http://localhost:${process.env.YOUPI_PORT}` : "http://localhost:5000")
).replace(/\/$/, "");

const MERCHANT_ID = process.env.YOUPI_MERCHANT_ID || "snacker-merchant-01";

// YouPI-PG in localhost mode (required behind a Cloudflare Quick Tunnel) always builds
// checkout links on http://localhost:7000, ignoring BASE_CHECKOUT_URL. A phone cannot open
// that, so swap the origin for the public gateway URL; nginx there routes /checkout/ to :7000.
function toPublicCheckoutUrl(checkoutUrl, gatewayUrl) {
  if (!checkoutUrl || !/^https?:\/\//.test(gatewayUrl)) return checkoutUrl;
  try {
    const link = new URL(checkoutUrl);
    if (!["localhost", "127.0.0.1", "0.0.0.0"].includes(link.hostname)) return checkoutUrl;
    const publicBase = new URL(gatewayUrl);
    if (["localhost", "127.0.0.1", "0.0.0.0"].includes(publicBase.hostname)) return checkoutUrl;
    return `${publicBase.origin}${link.pathname}${link.search}`;
  } catch {
    return checkoutUrl;
  }
}

export async function POST(request) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { amount, currency = "INR" } = body || {};
  const parsedAmount = Number(amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount < 1 || parsedAmount > 10000) {
    return NextResponse.json({ error: "Enter an amount between ₹1 and ₹10,000" }, { status: 400 });
  }
  // The webhook credits users/{userId}; make sure it exists before any money moves
  try {
    await ensureUserDoc(userId);
  } catch (err) {
    console.error("Could not ensure user document:", err.message);
    return NextResponse.json({ error: "Could not load your wallet. Please try again." }, { status: 500 });
  }

  const orderId = `WAL-${nanoid(8)}`;
  const returnUrl = `${request.headers.get("origin") || ""}/`;

  // Dynamic gateway resolution: check Firestore config/gateway first, fallback to env
  let gatewayUrl = DEFAULT_GATEWAY_URL;
  try {
    if (!process.env.YOUPI_GATEWAY_URL || process.env.YOUPI_GATEWAY_URL === "auto") {
      const gatewayDoc = await adminDb.collection("config").doc("gateway").get();
      if (gatewayDoc.exists) {
        const gwData = gatewayDoc.data();
        if (gwData?.status === "online" && gwData?.hostUrl) {
          gatewayUrl = gwData.hostUrl.replace(/\/$/, "");
        }
      }
    }
  } catch (err) {
    console.warn("Could not fetch dynamic gateway URL from Firestore, using default:", err.message);
  }

  try {
    // Connect to YouPI-PG FCFS payment gateway (POST /api/v1/payments)
    const res = await fetch(`${gatewayUrl}/api/v1/payments`, {
      method: "POST",
      signal: AbortSignal.timeout(8000),
      headers: {
        "Content-Type": "application/json",
        "X-Merchant-Id": MERCHANT_ID,
      },
      body: JSON.stringify({
        orderId,
        amount: parsedAmount.toFixed(2),
        currency,
        returnUrl,
        metadata: { userId },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || "Payment gateway error" },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: data.orderId || orderId,
      checkoutUrl: toPublicCheckoutUrl(data.checkoutUrl, gatewayUrl),
    });
  } catch (error) {
    console.error("YouPI-PG gateway unreachable:", gatewayUrl, error.message);
    return NextResponse.json(
      { error: "Payment gateway is offline. Please try again in a minute." },
      { status: 503 }
    );
  }
}
