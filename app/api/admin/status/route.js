import { currentUser } from "@clerk/nextjs/server";
import { isAdminUser } from "@/lib/admin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await currentUser();
  return NextResponse.json({ isAdmin: isAdminUser(user) });
}
