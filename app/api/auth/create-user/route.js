import { db } from "@/firebase/config";
import { auth, currentUser } from "@clerk/nextjs/server";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

const logCreateUserError = async (userId, error) => {
  try {
    await setDoc(
      doc(db, "errors", `${userId || "unknown"}_${Date.now()}`),
      {
        userId: userId || "unknown",
        errorMessage: error.message,
        stack: error.stack,
        timeStamp: serverTimestamp(),
        context: "createUser",
      }
    );
  } catch (e) {
    console.error("Failed to log error to Firestore:", e);
  }
};

export async function GET(req) {
  try {
    const { userId } = auth();
    console.log("UserId: ",userId);
    
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const user = await currentUser();
    console.log("UserData: ",user);
    
    if (!user) {
      return NextResponse.json({ error: "User details not found" }, { status: 404 });
    }

    await setDoc(doc(db, "users", userId), {
      name:
        user.username ||
        user.firstName ||
        user.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
        "User",
      userId: user.id,
      credit: 0,
      timeStamp: serverTimestamp(),
    });

    return new NextResponse(null, {
        status: 301,
        headers: {
          Location: `/`,
        },
      });
    
  } catch (error) {
    console.error("Error creating user:", error);
    const { userId } = auth() || {};
    await logCreateUserError(userId, error);
    return new NextResponse(null, {
        status: 302,
        headers: {
          Location: `/api/auth/create-user`,
        },
      });
  }
}
