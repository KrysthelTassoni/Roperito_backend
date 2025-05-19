// firebase.js
import { initializeApp, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT; // Reemplaza con la ruta a tu archivo de cuenta de servicio

// Inicializa la aplicación Firebase
const app = initializeApp({
  credential: cert(serviceAccount),
  storageBucket: "roperito-4d180.firebasestorage.app", // Reemplaza con el nombre de tu bucket de Firebase Storage
});

// Exporta el almacenamiento de Firebase
const bucket = getStorage(app).bucket();

export { bucket };
