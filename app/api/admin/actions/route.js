import { adminDb, adminRtdb, FieldValue } from "@/firebase/admin";
import { auth, currentUser } from "@clerk/nextjs/server";
import { isAdminUser } from "@/lib/admin";
import { DEFAULT_SNACKS } from "@/lib/seedData";
import { normalizeImageUrl } from "@/lib/utils";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";

export const dynamic = "force-dynamic";

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
      const snap = await adminRtdb().ref("/onStockUpdation/status").get();
      if (snap.exists()) {
        maintenance = Boolean(snap.val());
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
        await adminRtdb().ref("/onStockUpdation/status").set(isMaintenance);

        return NextResponse.json({
          success: true,
          message: `Maintenance mode ${isMaintenance ? "ENABLED" : "DISABLED"}`,
          maintenance: isMaintenance,
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
