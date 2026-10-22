import { adminDb, FieldValue } from "@/firebase/admin";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { auth } from "@clerk/nextjs/server";

class OrderError extends Error {
  constructor(code, message) {
    super(message || code);
    this.code = code;
  }
}

/**
 * Creates a paid order in one atomic transaction:
 *   verify stock -> reserve stock -> deduct wallet -> write pending order.
 * Price, slot and name come from the `products` collection, never from the client.
 * Request: { products: [{ productId, count }] }
 */
export async function POST(req) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const { products } = await req.json();

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid products list" },
        { status: 400 },
      );
    }

    // Merge duplicate productIds and validate counts
    const wanted = new Map();
    for (const p of products) {
      const count = Number(p?.count ?? 1);
      if (!p?.productId || !Number.isInteger(count) || count < 1 || count > 10) {
        return NextResponse.json(
          { success: false, error: "Invalid product entry" },
          { status: 400 },
        );
      }
      wanted.set(p.productId, (wanted.get(p.productId) || 0) + count);
    }

    const orderId = nanoid();
    let total = 0;

    await adminDb.runTransaction(async (tx) => {
      total = 0;
      const userRef = adminDb.collection("users").doc(userId);
      const productRefs = [...wanted.keys()].map((id) =>
        adminDb.collection("products").doc(id),
      );
      const [userDoc, ...productDocs] = await tx.getAll(userRef, ...productRefs);

      if (!userDoc.exists) throw new OrderError("noUser", "User does not exist");

      const items = [];
      for (const doc of productDocs) {
        if (!doc.exists) throw new OrderError("insufficientStock");
        const data = doc.data();
        const count = wanted.get(doc.id);
        if ((data.stock ?? 0) < count) throw new OrderError("insufficientStock");
        const price = Number(data.price);
        if (!data.position || !Number.isFinite(price) || price < 0) {
          throw new OrderError("badProduct", `Product '${doc.id}' is misconfigured`);
        }
        total += price * count;
        items.push({
          ref: doc.ref,
          stock: data.stock,
          item: {
            productId: doc.id,
            name: data.name || doc.id,
            position: String(data.position).toUpperCase(),
            price,
            count,
          },
        });
      }

      const credit = userDoc.data()?.credit ?? 0;
      if (credit < total) throw new OrderError("insufficientCredit");

      for (const { ref, stock, item } of items) {
        tx.update(ref, { stock: stock - item.count });
      }
      tx.update(userRef, { credit: credit - total });
      tx.set(adminDb.collection("orders").doc(orderId), {
        userId,
        products: items.map((i) => i.item),
        amount: total,
        status: "pending",
        timeStamp: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({
      success: true,
      orderId,
      amount: total,
      message: "Order created successfully",
    });
  } catch (e) {
    if (e instanceof OrderError) {
      if (e.code === "insufficientCredit") {
        return NextResponse.json({
          success: false,
          insufficientCredit: true,
          error: "Insufficient wallet credits",
        });
      }
      if (e.code === "insufficientStock") {
        return NextResponse.json({
          success: false,
          insufficientStock: true,
          error: "Product is out of stock",
        });
      }
      return NextResponse.json({ success: false, error: e.message }, { status: 400 });
    }
    console.error("Order creation error:", e);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
