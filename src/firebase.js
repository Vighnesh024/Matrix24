import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBwl9MCiXM2npXFBLe0oyx9215-Se6TyWc",
  authDomain: "jeetracker-74a4e.firebaseapp.com",
  projectId: "jeetracker-74a4e",
  storageBucket: "jeetracker-74a4e.firebasestorage.app",
  messagingSenderId: "826977772089",
  appId: "1:826977772089:web:049ce46ed41f17b709e3e8",
  measurementId: "G-ZT442CBD1D"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
