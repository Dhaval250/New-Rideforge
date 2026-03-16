import admin from "firebase-admin";
import { env } from "../config/env";

let firebaseReady = false;

export function initFirebaseAdmin(): void {
  if (firebaseReady || admin.apps.length > 0) {
    firebaseReady = true;
    return;
  }

  if (!env.firebaseProjectId || !env.firebaseClientEmail || !env.firebasePrivateKey) {
    console.warn("Firebase Admin not configured. Push notifications will be skipped.");
    return;
  }

  const privateKey = env.firebasePrivateKey.replace(/\\n/g, "\n");

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.firebaseProjectId,
      clientEmail: env.firebaseClientEmail,
      privateKey,
    }),
  });

  firebaseReady = true;
  console.log("Firebase Admin initialized");
}

export function isFirebaseReady(): boolean {
  return firebaseReady && admin.apps.length > 0;
}

export function getFirebaseMessaging(): admin.messaging.Messaging | null {
  if (!isFirebaseReady()) return null;
  return admin.messaging();
}
