import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCfiaT_OFZ_ZveGuyOYYJTtxmPoGVN6rbQ",
  authDomain: "mock-46eef.firebaseapp.com",
  projectId: "mock-46eef",
  storageBucket: "mock-46eef.firebasestorage.app",
  messagingSenderId: "371523807843",
  appId: "1:371523807843:web:c66bfe2c0a01ea48d22656",
  measurementId: "G-DBG087HB5N"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
