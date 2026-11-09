import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { nanoid } from "nanoid";
import { adminDb } from "@/firebase/admin";
import { isMaintenanceMode, maintenanceResponse } from "@/lib/maintenance";

// Configurable gateway endpoint supporting local dev, subdomains, Docker, and remote production hosting
const DEFAULT_GATEWAY_URL = (
  process.env.YOUPI_GATEWAY_URL ||
  (process.env.YOUPI_PORT
    ? `http://localhost:${process.env.YOUPI_PORT}`
    : "http://localhost:5000")
).replace(/\/$/, "");

const MERCHANT_ID = process.env.YOUPI_MERCHANT_ID;
const MAX_TOPUP_INR = 10000;
const LOCAL_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0"];

// Hosts the Firestore config/gateway doc may point at. That doc is written by the Pi
// (sync_quick_tunnel.py), so pin it to the tunnel domain to stop it redirecting payment
// requests elsewhere. Comma-separated; "*.example.com" matches subdomains.
const ALLOWED_GATEWAY_HOSTS = (
  process.env.YOUPI_GATEWAY_ALLOWED_HOSTS || "*.trycloudflare.com"
)
  .split(",")
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);

function isAllowedGatewayUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    const host = url.hostname.toLowerCase();
    return ALLOWED_GATEWAY_HOSTS.some((rule) =>
      rule.startsWith("*.") ? host.endsWith(rule.slice(1)) : host === rule,
    );
  } catch {
    return false;
  }
}

// YouPI-PG in localhost mode (required behind a Cloudflare Quick Tunnel) always builds
// checkout links on http://localhost:7000, ignoring BASE_CHECKOUT_URL. A phone cannot open
// that, so swap the origin for the public gateway URL; nginx there routes /checkout/ to :7000.
// Returns null when no phone-reachable URL can be built, so the caller can fail loudly.
function toPublicCheckoutUrl(checkoutUrl, gatewayUrl) {
  if (!checkoutUrl) return null;
  try {
    const link = new URL(checkoutUrl);
    if (!LOCAL_HOSTS.includes(link.hostname)) return checkoutUrl;
    const publicBase = new URL(gatewayUrl);
    if (LOCAL_HOSTS.includes(publicBase.hostname)) return null;
    return `${publicBase.origin}${link.pathname}${link.search}`;
  } catch {
    return null;
  }
}

export async function POST(request) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (await isMaintenanceMode()) return maintenanceResponse();

  if (!MERCHANT_ID) {
    console.error("YOUPI_MERCHANT_ID is not set; refusing to create payments");
    return NextResponse.json(
      { error: "Payments are not configured" },
      { status: 503 },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
  const amount = Number(body?.amount);
  if (!Number.isInteger(amount) || amount < 1 || amount > MAX_TOPUP_INR) {
    return NextResponse.json(
      { error: "Enter a whole amount between ₹1 and ₹10,000" },
      { status: 400 },
    );
  }
  const currency = "INR";
  const orderId = `WAL-${nanoid(8)}`;
  const returnUrl = `${request.headers.get("origin") || ""}/`;

  // Dynamic gateway resolution: check Firestore config/gateway first, fallback to env
  let gatewayUrl = DEFAULT_GATEWAY_URL;
  try {
    if (
      !process.env.YOUPI_GATEWAY_URL ||
      process.env.YOUPI_GATEWAY_URL === "auto"
    ) {
      const gatewayDoc = await adminDb
        .collection("config")
        .doc("gateway")
        .get();
      if (gatewayDoc.exists) {
        const gwData = gatewayDoc.data();
        if (gwData?.status === "online" && gwData?.hostUrl) {
          if (isAllowedGatewayUrl(gwData.hostUrl)) {
            gatewayUrl = gwData.hostUrl.replace(/\/$/, "");
          } else {
            console.error(
              "Ignoring config/gateway hostUrl outside YOUPI_GATEWAY_ALLOWED_HOSTS:",
              gwData.hostUrl,
            );
          }
        }
      }
    }
  } catch (err) {
    console.warn(
      "Could not fetch dynamic gateway URL from Firestore, using default:",
      err.message,
    );
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
        amount: amount.toFixed(2),
        currency,
        returnUrl,
        metadata: { userId },
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || "Payment gateway error" },
        { status: res.status },
      );
    }

    const checkoutUrl = toPublicCheckoutUrl(data.checkoutUrl, gatewayUrl);
    if (!checkoutUrl) {
      console.error("Gateway returned no usable checkout URL", {
        gatewayUrl,
        checkoutUrl: data.checkoutUrl,
      });
      return NextResponse.json(
        {
          error:
            "Payment gateway is not reachable from your phone. Try again shortly.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      orderId: data.orderId || orderId,
      checkoutUrl,
    });
  } catch (error) {
    // Never fake success: the user would think the recharge started when it did not
    console.error("YouPI-PG gateway unreachable:", gatewayUrl, error.message);
    return NextResponse.json(
      { error: "Payment gateway is offline. Please try again in a minute." },
      { status: 503 },
    );
  }
}
