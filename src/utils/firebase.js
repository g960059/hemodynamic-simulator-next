// import { getAnalytics  } from "firebase/analytics";
import { getAuth,GoogleAuthProvider,EmailAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

const firebaseConfig = {
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

// Initialize Firebase
export const app = firebase.initializeApp(firebaseConfig);
// export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const StyledAuth = () => {
  return <StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={firebase.auth()} />
}