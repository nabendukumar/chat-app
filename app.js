import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-messaging.js";

// 🔥 YOUR CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyAaAsXl3I262r_da3DLTHeXRAOqgrzyiVQ",
  authDomain: "chat-app-e2cc7.firebaseapp.com",
  projectId: "chat-app-e2cc7",
  storageBucket: "chat-app-e2cc7.firebasestorage.app",
  messagingSenderId: "68675656128",
  appId: "1:68675656128:web:1ea6a01c25be2c53aa1025"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ✅ LOGIN
document.getElementById("login").onclick = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  await signInWithEmailAndPassword(auth, email, password);
  alert("Logged in");
};

// ✅ SEND MESSAGE
document.getElementById("send").onclick = async () => {
  const text = document.getElementById("msg").value;

  await addDoc(collection(db, "messages"), {
    text,
    time: new Date()
  });
};

// ================= FCM =================

// Request permission
await Notification.requestPermission();

const messaging = getMessaging(app);

// 🔴 IMPORTANT: ADD YOUR VAPID KEY HERE
const token = await getToken(messaging, {
  vapidKey: "BNYmK_FS_MiwdcuvNfzwb4okV65iQr9adYu01EZF3iz09QNILmsURdu_aOvIMooXnlqDnqgppDlsOL_Rh7Vk9bw"
});

console.log("FCM TOKEN:", token);

// Foreground notification
onMessage(messaging, (payload) => {
  console.log("Foreground msg:", payload);

  alert(payload.notification.title + " - " + payload.notification.body);
});