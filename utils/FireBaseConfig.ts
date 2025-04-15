// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; 

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCQDD3KS-Dz4iQs7skiInMiKBy9JTN33lI",
  authDomain: "pos2025-1.firebaseapp.com",
  projectId: "pos2025-1",
  storageBucket: "pos2025-1.firebasestorage.app",
  messagingSenderId: "481040472874",
  appId: "1:481040472874:web:276be94a1e10b4381b9c53"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export { app };