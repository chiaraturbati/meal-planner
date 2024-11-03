// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDeNPoVtn9k0cX36UCBeSXmtJ9NNVD0VEE",
  authDomain: "meal-planner-19145.firebaseapp.com",
  projectId: "meal-planner-19145",
  storageBucket: "meal-planner-19145.firebasestorage.app",
  messagingSenderId: "822427199505",
  appId: "1:822427199505:web:5df7906d27be232fdfa9b0"
};


const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);