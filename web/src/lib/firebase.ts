// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
	apiKey: "AIzaSyC8gHXqVvVGCL4F5SlGd72mHcOhEnCT5Zk",
	authDomain: "broadcast-a94cc.firebaseapp.com",
	projectId: "broadcast-a94cc",
	storageBucket: "broadcast-a94cc.firebasestorage.app",
	messagingSenderId: "832110605445",
	appId: "1:832110605445:web:d4741ee5cf8275dbefa5ec"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
