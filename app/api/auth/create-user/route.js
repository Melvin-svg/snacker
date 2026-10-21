import { adminDb, FieldValue } from "@/firebase/admin";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

const logCreateUserError = async (userId, error) => {
  try {
    await adminDb.collection("errors").doc(`${userId || "unknown"}_${Date.now()}`).set({
      userId: userId || "unknown",
      errorMessage: error.message,
      stack: error.stack,
      timeStamp: FieldValue.serverTimestamp(),
      context: "createUser",
    });
  } catch (e) {
    console.error("Failed to log error to Firestore:", e);
  }
};

export async function GET(req) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "User details not found" }, { status: 404 });
    }

    const userRef = adminDb.collection("users").doc(userId);
    const userDoc = await userRef.get();

    const name =
      user.username ||
      user.firstName ||
      user.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
      "User";

    if (!userDoc.exists) {
      // New user registration
      await userRef.set({
        name,
        userId: user.id,
        credit: 0,
        timeStamp: FieldValue.serverTimestamp(),
      });
    } else {
      // Existing user: update name/profile without resetting wallet credit
      await userRef.set(
        {
          name,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    return new NextResponse(null, {
      status: 301,
      headers: {
        Location: `/`,
      },
    });
  } catch (error) {
    console.error("Error creating/syncing user:", error);
    const { userId } = auth() || {};
    await logCreateUserError(userId, error);
    return new NextResponse(null, {
      status: 302,
      headers: {
        Location: `/`,
      },
    });
  }
}
