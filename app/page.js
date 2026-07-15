"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, getAuth } from 'firebase/auth';

import LogIn from "./user/login/page";
import Register from "./user/register/page";
import Homepage from "./homepage/page";


export default function Home() {

  const [user, setUser] = useState(null);
  const auth = getAuth()

  const [initializing, setInitializing] = useState(true);
 

  // Handle authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (initializing) setInitializing(false) // Set loading to false when auth check completes
    });
    return () => unsubscribe(); // Cleanup subscription
  }, [initializing]);


  if (initializing) return null;
  // Display a loading state until the authentication status is resolved

  // If user is not authenticated, show the login page
  if (!user) {
    console.log(user)
  return <LogIn />;
  }
  // If user is authenticated, redirect to the dashboard

  if (user) {
    console.log(user)
    return <Homepage />
  }
  // Adjust to your actual dashboard path
  return null;
}
