// import { getAnalytics  } from "firebase/analytics";
import { getAuth,GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore, initializeFirestore } from 'firebase/firestore';
import StyledFirebaseAuth from "../components/StyledFirebaseAuth";
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { connectStorageEmulator, getStorage } from 'firebase/storage';

export let firebaseConfig = {
  apiKey: "AIzaSyDunS6i7doodnUGU1w-XrGEDmOzCFflyWY",
  authDomain: "hemodynamic-simulator.firebaseapp.com",
  projectId: "hemodynamic-simulator",
  storageBucket: "hemodynamic-simulator.appspot.com",
  messagingSenderId: "594246666374",
  appId: "1:594246666374:web:6c90c79d2fbdff5b9d2907",
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

export const app = firebase.initializeApp(firebaseConfig);

// Initialize Firebase
export const FIREBASE_INITIALIZED = 'FIREBASE_INITIALIZED';
if(!global[FIREBASE_INITIALIZED]) {
  initializeFirestore(app, {
    ignoreUndefinedProperties: true,
  })
}

// export const analytics = getAnalytics(app);


export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app)
export const storage = getStorage(app)

// const EMULATORS_STARTED = 'EMULATORS_STARTED';
// if (process.env.NEXT_PUBLIC_ENV == 'test' && !global[EMULATORS_STARTED]){
//   global[EMULATORS_STARTED] = true;
//   connectFirestoreEmulator(db,"localhost",8084);
//   connectFunctionsEmulator(functions, "localhost", 5001);
//   connectAuthEmulator(auth, "http://localhost:9099",{disableWarnings: true});
//   connectStorageEmulator(storage, "localhost", 9199);
// }


export const StyledAuth = () => {
  return <StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={auth} />
}

