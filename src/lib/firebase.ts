
// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
// import { getFirestore, type Firestore } from 'firebase/firestore'; // Firestore can be added later if needed

// Your web app's Firebase configuration
// Make sure these environment variables are set in your .env file
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if the essential API key is provided
if (!firebaseConfig.apiKey) {
  console.error(
    "Firebase API Key (NEXT_PUBLIC_FIREBASE_API_KEY) is missing. " +
    "Firebase will not initialize correctly. Please check your .env file."
  );
  // Depending on how critical this is, you might throw an error here for client-side
  // For now, we'll let initializeApp handle the error if it occurs.
}


let app: FirebaseApp;
let auth: Auth;
// let db: Firestore; // Initialize Firestore here if/when needed

// Initialize Firebase
try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0]; // Use the existing app if already initialized
  }
  auth = getAuth(app);
  // db = getFirestore(app); // And assign it here
} catch (error) {
  console.error("Failed to initialize Firebase:", error);
  // @ts-ignore
  if (error.code === 'auth/invalid-api-key' || (error.message && error.message.includes('apiKey'))) {
    console.error(
      "CRITICAL: Firebase initialization failed due to an invalid or missing API key. " +
      "Please verify NEXT_PUBLIC_FIREBASE_API_KEY in your .env file and ensure it's correct in your Firebase project settings."
    );
  }
  // Re-throw or handle as appropriate for your app's lifecycle
  // For now, we'll let the app attempt to continue, but auth will likely fail.
  // A more robust solution might involve showing a global error message.
  // @ts-ignore - To prevent uninitialized errors if auth fails to init
  if (!auth) auth = {} as Auth;
}


export { app, auth /*, db */ };
