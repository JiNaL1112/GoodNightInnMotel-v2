// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCbclH1nS5O7IbWH5oEJsVL-LBWGUeEUhY",
  authDomain: "goodnightinn-fe916.firebaseapp.com",
  projectId: "goodnightinn-fe916",
  storageBucket: "goodnightinn-fe916.firebasestorage.app",
  messagingSenderId: "960107487429",
  appId: "1:960107487429:web:252e7b09937899b62fd0ac",
  measurementId: "G-ELQQ14GLFY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);

const auth = getAuth(app);
const provider = new GoogleAuthProvider();



export { auth, provider, signInWithPopup, signOut };