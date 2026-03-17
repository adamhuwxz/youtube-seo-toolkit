import { getApps, initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

const app =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp(
        clientEmail && privateKey
          ? {
              credential: cert({
                projectId,
                clientEmail,
                privateKey,
              }),
            }
          : {
              credential: applicationDefault(),
              projectId,
            }
      );

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);