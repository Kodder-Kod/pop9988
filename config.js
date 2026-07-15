import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth"; 
import { getAnalytics } from "firebase/analytics";


const firebaseConfig = {
  apiKey: "AIzaSyDebNz1XfUSCZkQ186rsi-EDcfqBUHvfPM",
  authDomain: "popservices001-50375.firebaseapp.com",
  databaseURL: "https://popservices001-50375-default-rtdb.firebaseio.com",
  projectId: "popservices001-50375",
  storageBucket: "popservices001-50375.firebasestorage.app",
  messagingSenderId: "518129615332",
  appId: "1:518129615332:web:a44c52c2d119062ff6c7f1",
  measurementId: "G-G4TNY5GBYJ"
};



const app = initializeApp(firebaseConfig);

// Initialize Firebase services using the modular SDK
const db = getDatabase(app);

// Initialize Firebase Auth with React Native persistence
const auth = getAuth(app);

export { db, auth };


