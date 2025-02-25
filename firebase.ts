// firebase.ts
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCiDY2tXfTphkwM86FkVMYf-B3m_2ih0jo",
  authDomain: "ambulance-89a48.firebaseapp.com",
  databaseURL: "https://ambulance-89a48-default-rtdb.firebaseio.com",
  projectId: "ambulance-89a48",
  storageBucket: "ambulance-89a48.firebasestorage.app",
  messagingSenderId: "910123117464",
  appId: "1:910123117464:web:4852538866e4a431f599ed",
  measurementId: "G-BS76WR1G13"
};

const app = initializeApp(firebaseConfig);

if (typeof window !== "undefined") {
  // Only run analytics on the client-side
  isSupported().then((supported) => {
    if (supported) {
      getAnalytics(app);
    }
  });
}

const database = getDatabase(app);
const storage = getStorage(app);

export { app, database, storage };
