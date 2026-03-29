// firebase-messaging-sw.js

// Import Firebase scripts for service workers
importScripts('https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/12.11.0/firebase-messaging.js');

// ---------------- Firebase Config ----------------
const firebaseConfig = {
  apiKey: "AIzaSyAaAsXl3I262r_da3DLTHeXRAOqgrzyiVQ",
  authDomain: "chat-app-e2cc7.firebaseapp.com",
  projectId: "chat-app-e2cc7",
  storageBucket: "chat-app-e2cc7.firebasestorage.app",
  messagingSenderId: "68675656128",
  appId: "1:68675656128:web:1ea6a01c25be2c53aa1025"
};

// ---------------- Initialize Firebase ----------------
firebase.initializeApp(firebaseConfig);

// Retrieve Firebase Messaging object
const messaging = firebase.messaging();

// ---------------- Background Message Handler ----------------
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  // Customize notification
  const notificationTitle = payload.notification?.title || 'New Message';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/default-profile.png', // default icon for notifications
  };

  // Show notification
  self.registration.showNotification(notificationTitle, notificationOptions);
});