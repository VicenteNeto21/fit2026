/* ============================================
   FIT 2026 — Firebase Configuration
   Project: fit-crateus
   ============================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAOGVRFFgUoYA8MvDkaIjGumNzEkGzcEHY",
    authDomain: "fit-crateus.firebaseapp.com",
    projectId: "fit-crateus",
    storageBucket: "fit-crateus.firebasestorage.app",
    messagingSenderId: "88037686885",
    appId: "1:88037686885:web:53e6860fa068e003ac908c",
    measurementId: "G-MYTT42SWC0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export {
    db, auth, app, googleProvider,
    collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy,
    signInWithEmailAndPassword, signInWithPopup, signOut, onAuthStateChanged
};
