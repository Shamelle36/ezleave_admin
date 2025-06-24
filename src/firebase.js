import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import {getFirestore} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBOEFJyEnvW1HtHclE_nI_d_LjxbnZWfcU",
  authDomain: "admin-ezleave-login-signup.firebaseapp.com",
  projectId: "admin-ezleave-login-signup",
  storageBucket: "admin-ezleave-login-signup.firebasestorage.app",
  messagingSenderId: "1057427500775",
  appId: "1:1057427500775:web:d256e74e5c309bcfb1fc42",
  measurementId: "G-HWD98PW17Q"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export {auth, googleProvider, db};
