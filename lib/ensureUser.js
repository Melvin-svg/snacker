import { adminDb, FieldValue } from "@/firebase/admin";

/**
 * Server-only: makes sure users/{userId} exists with a zero wallet. The sign-up redirect that
 * normally creates it can be skipped (e.g. first sign-in via OAuth), and a missing document
 * would block orders and leave paid top-ups uncredited. Never touches an existing balance.
 */
export async function ensureUserDoc(userId, name = "User") {
  const userRef = adminDb.collection("users").doc(userId);
  try {
    await userRef.create({
      name,
      userId,
      credit: 0,
      timeStamp: FieldValue.serverTimestamp(),
    });
  } catch (e) {
    // gRPC ALREADY_EXISTS (6): the document is already there, which is the normal case
    if (e?.code !== 6) throw e;
  }
  return userRef;
}
