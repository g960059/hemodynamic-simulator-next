// import { getAnalytics  } from "firebase/analytics";
import { getAuth,GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { connectStorageEmulator, getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_PROJECT_ID,
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_APP_ID,
  measurementId: "${config.measurementId}"
};


const uiConfig = {
  signInFlow: 'popup',
  signInOptions: [
    GoogleAuthProvider.PROVIDER_ID,
  ],
  callbacks: {
    signInSuccessWithAuthResult: () => false,
  },
};

// Initialize Firebase
const FIREBASE_INITIALIZED = 'FIREBASE_INITIALIZED';
if(!global[FIREBASE_INITIALIZED]) {
}
export const app = firebase.initializeApp(firebaseConfig);
// export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app)
export const storage = getStorage(app)

const EMULATORS_STARTED = 'EMULATORS_STARTED';
if (process.env.NODE_ENV != 'production' && !global[EMULATORS_STARTED]){
  global[EMULATORS_STARTED] = true;
  connectFirestoreEmulator(db,"localhost",8084);
  connectFunctionsEmulator(functions, "localhost", 5001);
  connectAuthEmulator(auth, "http://localhost:9099",{disableWarnings: true});
  connectStorageEmulator(storage, "localhost", 9199);
}


export const StyledAuth = () => {
  return <StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={auth} />
}