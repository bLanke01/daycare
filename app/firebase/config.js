// app/firebase/config.js
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// Replace with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyBrxYLL4p4Cl2zYCVuLK-T9sZrrkOEemTY",
  authDomain: "daycare-system-68fb7.firebaseapp.com",
  projectId: "daycare-system-68fb7",
  storageBucket: "daycare-system-68fb7.firebasestorage.app",
  messagingSenderId: "610349229743",
  appId: "1:610349229743:web:04e86cc9c01ca9c6c9965a"
};

// Initialize Firebase
let firebaseApp;

if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig);
}

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

export default firebaseApp;