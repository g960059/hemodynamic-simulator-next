import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const { privateKey }  = JSON.parse(process.env.FIREBASE_ADMIN_PRIVATE_KEY)

export const firebaseAdmin =
  getApps()[0] ??
  initializeApp({
    credential: cert(
      {
        type: "service_account",
        project_id: "hemodynamic-simulator",
        private_key_id: "725ee23e67a527c40885b59eb8633f5a7c200f39",
        private_key: privateKey,
        client_email: "firebase-adminsdk-w4f3i@hemodynamic-simulator.iam.gserviceaccount.com",
        client_id: "115737869529677260955",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-w4f3i%40hemodynamic-simulator.iam.gserviceaccount.com",
        universe_domain: "googleapis.com"
      }
    ),
  });

export const db = getFirestore(firebaseAdmin);
export const auth = getAuth(firebaseAdmin);



