
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy 
} from 'firebase/firestore';

// Go to Firebase Console -> Project Settings -> General -> Your apps -> SDK setup and configuration
const firebaseConfig = {
  apiKey: "AIzaSyD1Md4XxNELFX48LPeQ9nKVEOnGXsIXif0",
  authDomain: "gohopro-75a43.firebaseapp.com",
  projectId: "gohopro-75a43",
  storageBucket: "gohopro-75a43.firebasestorage.app",
  messagingSenderId: "318514667964",
  appId: "1:318514667964:web:4476213bcf9f80ce748bb9",
  measurementId: "G-5HZKRW32WK"
};

// Initialize Firebase
// We use a try-catch block to handle cases where config might be missing during initial setup
let app;
let auth: any;
let db: any;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
} catch (error) {
    console.error("Firebase initialization error:", error);
}

export { 
  app,
  auth,
  db,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  sendPasswordResetEmail, // Exported for Forgot Password feature
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy 
};
