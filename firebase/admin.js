import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getDatabase } from "firebase-admin/database";
import fs from "fs";
import path from "path";

function loadServiceAccount() {
  // 1. From environment variable (raw JSON string or base64)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
      const parsed = JSON.parse(
        raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf-8")
      );
      if (parsed.private_key) {
        parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
      }
      return parsed;
    } catch (e) {
      console.warn("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY from env:", e.message);
    }
  }

  // 2. From local serviceAccountKey.json file if present
  const localPaths = [
    path.join(process.cwd(), "serviceAccountKey.json"),
    path.join(process.cwd(), "..", "serviceAccountKey.json"),
  ];

  for (const filePath of localPaths) {
    if (fs.existsSync(filePath)) {
      try {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(fileContent);
        if (parsed.private_key) {
          parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
        }
        return parsed;
      } catch (e) {
        console.warn(`Failed to parse ${filePath}:`, e.message);
      }
    }
  }

  return null;
}

const RTDB_URL =
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
  "https://snacker-app-default-rtdb.firebaseio.com";

const serviceAccount = loadServiceAccount();

let adminApp;
if (getApps().length > 0) {
  adminApp = getApps()[0];
} else if (serviceAccount && serviceAccount.project_id) {
  adminApp = initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id,
    databaseURL: RTDB_URL,
  });
} else {
  // Graceful fallback for build/test environments without breaking Next.js compilation
  adminApp = initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "snacker-app",
    databaseURL: RTDB_URL,
  });
}

export const adminDb = getFirestore(adminApp);
export const adminRtdb = () => getDatabase(adminApp);
export { FieldValue };
export default adminApp;
