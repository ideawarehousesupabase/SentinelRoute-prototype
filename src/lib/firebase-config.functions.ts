import { createServerFn } from "@tanstack/react-start";

/**
 * Returns the Firebase web config read from environment variables (.env / process.env).
 */
export const getFirebaseConfig = createServerFn({ method: "GET" }).handler(async () => {
  const apiKey = process.env.VITE_FIREBASE_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("Firebase API key is not configured in .env");

  return {
    apiKey: apiKey.trim(),
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.VITE_FIREBASE_APP_ID || "",
    measurementId: (
      process.env.VITE_FIREBASE_MEASUREMENT_ID ||
      process.env.GOOGLE_ANALYTICS_MEASUREMENT_ID ||
      ""
    ).trim(),
  };
});
