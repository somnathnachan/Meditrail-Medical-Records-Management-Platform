// MediTrail Firebase Configuration
// Clean, minimal setup following Apple's design philosophy

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
//import { getStorage } from 'firebase/storage';


// Firebase configuration object
// Replace with your actual Firebase project credentials from Console
const firebaseConfig = {
  apiKey: "AIzaSyBHxpMBhIniSaO7AR_Wdg0gIgTegguN74k",
  authDomain: "meditrail-f3803.firebaseapp.com",
  projectId: "meditrail-f3803",
  storageBucket: "meditrail-f3803.firebasestorage.app",
  messagingSenderId: "949117298365",
  appId: "1:949117298365:web:b8a07fe78f46671d6a39d4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


// Initialize and export services
export const auth = getAuth(app);
export const db = getFirestore(app);
//export const storage = getStorage(app);


// Optional: Export app instance if needed
export default app;