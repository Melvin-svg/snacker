import { adminDb } from "@/firebase/admin";
import { NextResponse } from "next/server";

// Maintenance flag lives on config/gateway so the server, the Pi tunnel sync and the
// payment gateway status share one source. Fails open on read errors so a Firestore
// blip does not take the shop down; the admin toggle is the only writer.
export async function isMaintenanceMode() {
  try {
    const doc = await adminDb.collection("config").doc("gateway").get();
    return doc.exists && doc.data()?.maintenance === true;
  } catch (e) {
    console.warn("Could not read maintenance flag:", e.message);
    return false;
  }
}

export function maintenanceResponse() {
  return NextResponse.json(
    {
      success: false,
      maintenance: true,
      error: "The machine is under maintenance. Please try again shortly.",
    },
    { status: 503 },
  );
}
