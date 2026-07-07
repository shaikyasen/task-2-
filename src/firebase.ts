import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCYjWh5K--6WEos5qInmsvgxM3xTW6JMfw",
  authDomain: "gen-lang-client-0051040402.firebaseapp.com",
  projectId: "gen-lang-client-0051040402",
  storageBucket: "gen-lang-client-0051040402.firebasestorage.app",
  messagingSenderId: "797994196144",
  appId: "1:797994196144:web:45d2f71eea30b4faf02f75",
  databaseId: "ai-studio-b97817a2-9048-4e8d-b96e-ab595226504e"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-b97817a2-9048-4e8d-b96e-ab595226504e");
