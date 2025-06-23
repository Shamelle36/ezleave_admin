// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBOEFJyEnvW1HtHclE_nI_d_LjxbnZWfcU",
  authDomain: "admin-ezleave-login-signup.firebaseapp.com",
  projectId: "admin-ezleave-login-signup",
  storageBucket: "admin-ezleave-login-signup.firebasestorage.app",
  messagingSenderId: "1057427500775",
  appId: "1:1057427500775:web:d256e74e5c309bcfb1fc42",
  measurementId: "G-HWD98PW17Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export {auth, googleProvider};
