import { initializeApp, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import serviceAccount from "./roperito-4d180-firebase-adminsdk-fbsvc-ae4aa8ac1e.json" assert { type: "json" };

// Inicializa la aplicación Firebase
const app = initializeApp({
  credential: cert(serviceAccount),
  storageBucket: "roperito-4d180.appspot.com",
});

const bucket = getStorage(app).bucket();
export { bucket };
