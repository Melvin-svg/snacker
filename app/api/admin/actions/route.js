import { adminDb, FieldValue } from "@/firebase/admin";
import { rtdb } from "@/firebase/config";
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { isAdminUser } from "@/lib/admin";
import { DEFAULT_SNACKS } from "@/lib/seedData";
import { normalizeImageUrl } from "@/lib/utils";
import { ref, set, get } from "firebase/database";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";

export const dynamic = "force-dynamic";

const MAX_CREDIT_TOPUP = 5000;

const primaryEmail = (u) =>
  u.emailAddresses?.find((e) => e.id === u.primaryEmailAddressId)?.emailAddress ||
  u.emailAddresses?.[0]?.emailAddress ||
  "";

const displayName = (u) =>
  u.username || u.firstName || primaryEmail(u).split("@")[0] || "User";

/**
 * Strict server-side verification: guarantees that ONLY the verified admin
 * can access or invoke any action. Immune to IDOR, parameter tampering, and spoofed user IDs.
 */
async function verifyAdminAuth() {
  const { userId } = auth();
  if (!userId) {
    return { ok: false, status: 401, error: "Unauthorized: Sign in required" };
  }

  const user = await currentUser();
  if (!isAdminUser(user)) {
    return {
      ok: false,
      status: 403,
      error: "Forbidden: You are not authorized to perform admin actions",
    };
  }

  return { ok: true, user };
}

export async function GET() {
  const authCheck = await verifyAdminAuth();
  if (!authCheck.ok) {
    return NextResponse.json(
      { success: false, error: authCheck.error },
      { status: authCheck.status },
    );
  }

  try {
    // 1. Fetch all products via Firebase Admin SDK (bypasses security rules safely)
    const productSnapshot = await adminDb.collection("products").get();
    const products = [];
    productSnapshot.forEach((d) => {
      products.push({ id: d.id, ...d.data() });
    });

    // 2. Fetch maintenance status from Realtime Database
    let maintenance = false;
    try {
      if (rtdb) {
        const snap = await get(ref(rtdb, "/onStockUpdation/status"));
        if (snap.exists()) {
          maintenance = Boolean(snap.val());
        }
      }
    } catch (e) {
      console.warn("Could not read maintenance status from RTDB:", e.message);
    }

    return NextResponse.json({
      success: true,
      products,
      maintenance,
    });
  } catch (error) {
    console.error("Admin GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  const authCheck = await verifyAdminAuth();
  if (!authCheck.ok) {
    return NextResponse.json(
      { success: false, error: authCheck.error },
      { status: authCheck.status },
    );
  }

  try {
    const body = await req.json();
    const { action, payload } = body;

    switch (action) {
      case "seed_products": {
        // Seed default snack products safely using Admin SDK
        const seeded = [];
        for (const item of DEFAULT_SNACKS) {
          const productRef = adminDb.collection("products").doc(item.id);
          const data = {
            name: String(item.name).trim(),
            subtitle: String(item.subtitle).trim(),
            category: item.category === "drinks" ? "drinks" : "snacks",
            price: Number(item.price) || 20,
            stock: Number(item.stock) || 10,
            position: String(item.position || "A1").toUpperCase(),
            imgSrc: normalizeImageUrl(String(item.imgSrc)),
            updatedAt: FieldValue.serverTimestamp(),
          };
          await productRef.set(data, { merge: true });
          seeded.push({ id: item.id, ...data });
        }

        return NextResponse.json({
          success: true,
          message: `Successfully seeded ${seeded.length} snacks into the database`,
          count: seeded.length,
        });
      }

      case "add_product": {
        const { name, subtitle, category, price, stock, position, imgSrc } =
          payload || {};

        if (!name || !price) {
          return NextResponse.json(
            { success: false, error: "Name and Price are mandatory" },
            { status: 400 },
          );
        }

        const id = nanoid(8);
        const productRef = adminDb.collection("products").doc(id);
        const newProduct = {
          name: String(name).trim(),
          subtitle: String(subtitle || "").trim(),
          category: category === "drinks" ? "drinks" : "snacks",
          price: Math.max(1, Number(price) || 10),
          stock: Math.max(0, parseInt(stock, 10) || 0),
          position: String(position || "A1").toUpperCase().trim(),
          imgSrc: normalizeImageUrl(String(imgSrc || "").trim()),
          createdAt: FieldValue.serverTimestamp(),
        };

        await productRef.set(newProduct);

        return NextResponse.json({
          success: true,
          message: "Product added successfully",
          product: { id, ...newProduct },
        });
      }

      case "update_stock": {
        const { productId, newStock } = payload || {};
        if (!productId) {
          return NextResponse.json(
            { success: false, error: "Product ID is required" },
            { status: 400 },
          );
        }

        const safeStock = Math.max(0, parseInt(newStock, 10) || 0);
        await adminDb.collection("products").doc(productId).update({
          stock: safeStock,
          updatedAt: FieldValue.serverTimestamp(),
        });

        return NextResponse.json({
          success: true,
          message: `Stock updated to ${safeStock}`,
        });
      }

      case "toggle_maintenance": {
        const { status } = payload || {};
        const isMaintenance = Boolean(status);
        // Server-side flag: blocks orders and top-ups, and takes the payment gateway offline.
        // Going live restores "online" only if the Pi tunnel has published a host URL.
        const gatewayRef = adminDb.collection("config").doc("gateway");
        const gatewayDoc = await gatewayRef.get();
        await gatewayRef.set(
          {
            maintenance: isMaintenance,
            status:
              !isMaintenance && gatewayDoc.data()?.hostUrl ? "online" : "offline",
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );

        // Realtime flag drives the maintenance screen in the client (components/shared/Tab.jsx)
        if (rtdb) {
          await set(ref(rtdb, "/onStockUpdation/status"), isMaintenance);
        }

        return NextResponse.json({
          success: true,
          message: `Maintenance mode ${isMaintenance ? "ENABLED" : "DISABLED"}`,
          maintenance: isMaintenance,
        });
      }

      case "list_users": {
        // Clerk is the source of truth for who has signed in; Firestore holds the wallet.
        // Users who signed in before their wallet doc was created show credit 0 / hasWallet false.
        const query = String(payload?.query || "").trim();
        const { data: clerkUsers } = await clerkClient().users.getUserList({
          limit: 50,
          orderBy: "-last_sign_in_at",
          ...(query ? { query } : {}),
        });

        const walletDocs = clerkUsers.length
          ? await adminDb.getAll(
              ...clerkUsers.map((u) => adminDb.collection("users").doc(u.id)),
            )
          : [];

        const users = clerkUsers.map((u, i) => {
          const wallet = walletDocs[i];
          return {
            id: u.id,
            name: displayName(u),
            email: primaryEmail(u),
            lastSignInAt: u.lastSignInAt,
            hasWallet: wallet.exists,
            credit: wallet.exists ? Number(wallet.data()?.credit ?? 0) : 0,
          };
        });

        return NextResponse.json({ success: true, users });
      }

      case "add_credits": {
        const { userId, amount, note } = payload || {};
        const value = Number(amount);
        if (!userId || !Number.isInteger(value) || value < 1 || value > MAX_CREDIT_TOPUP) {
          return NextResponse.json(
            {
              success: false,
              error: `Amount must be a whole number between 1 and ${MAX_CREDIT_TOPUP}`,
            },
            { status: 400 },
          );
        }

        // Only credit real Clerk accounts
        let target;
        try {
          target = await clerkClient().users.getUser(userId);
        } catch {
          return NextResponse.json(
            { success: false, error: "User not found in Clerk" },
            { status: 404 },
          );
        }

        const userRef = adminDb.collection("users").doc(userId);
        const logRef = adminDb.collection("creditLogs").doc();
        let newCredit = 0;

        await adminDb.runTransaction(async (tx) => {
          const doc = await tx.get(userRef);
          const current = doc.exists ? Number(doc.data()?.credit ?? 0) : 0;
          newCredit = current + value;

          if (doc.exists) {
            tx.update(userRef, { credit: newCredit, updatedAt: FieldValue.serverTimestamp() });
          } else {
            // Signed in via Clerk but never hit /api/auth/create-user: create the wallet now
            tx.set(userRef, {
              name: displayName(target),
              userId,
              credit: newCredit,
              timeStamp: FieldValue.serverTimestamp(),
            });
          }

          tx.set(logRef, {
            userId,
            amount: value,
            previousCredit: current,
            newCredit,
            note: String(note || "").slice(0, 200),
            adminId: authCheck.user.id,
            source: "admin_panel",
            timeStamp: FieldValue.serverTimestamp(),
          });
        });

        return NextResponse.json({
          success: true,
          message: `Added ₹${value} to ${displayName(target)}`,
          credit: newCredit,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Admin POST error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
