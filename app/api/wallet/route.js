import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { adminDb } from "@/firebase/admin";

export const dynamic = "force-dynamic";

// Returns the signed-in user's own wallet balance. Firestore rules deny client reads of
// `users`, so the browser polls this instead of listening to the document directly.
export async function GET() {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const snap = await adminDb.collection("users").doc(userId).get();
    return NextResponse.json({
      success: true,
      exists: snap.exists,
      credit: snap.exists ? (snap.data().credit ?? 0) : 0,
    });
  } catch (error) {
    console.error("Wallet fetch error:", error);
    return NextResponse.json({ error: "Could not load wallet" }, { status: 500 });
  }
}
