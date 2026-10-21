import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { nanoid } from "nanoid";

// Configurable gateway endpoint supporting local dev, subdomains, Docker, and remote production hosting
const YOUPI_GATEWAY_URL = (
  process.env.YOUPI_GATEWAY_URL ||
  (process.env.YOUPI_PORT ? `http://localhost:${process.env.YOUPI_PORT}` : "http://localhost:5000")
).replace(/\/$/, "");

const MERCHANT_ID = process.env.YOUPI_MERCHANT_ID || "snacker-merchant-01";

export async function POST(request) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { amount, currency = "INR" } = await request.json();
  const orderId = `WAL-${nanoid(8)}`;
  const returnUrl = `${request.headers.get("origin") || ""}/`;

  try {
    // Connect to YouPI-PG FCFS payment gateway (POST /api/v1/payments)
    const res = await fetch(`${YOUPI_GATEWAY_URL}/api/v1/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Merchant-Id": MERCHANT_ID,
      },
      body: JSON.stringify({
        orderId,
        amount: parseFloat(amount).toFixed(2),
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
      checkoutUrl: data.checkoutUrl,
    });
  } catch (error) {
    console.warn("YouPI-PG gateway unreachable, providing mock/offline fallback:", error.message);
    return NextResponse.json({
      success: true,
      orderId,
      checkoutUrl: `/checkout/${orderId}?amount=${amount}`,
      note: "Offline/mock gateway fallback",
    });
  }
}
