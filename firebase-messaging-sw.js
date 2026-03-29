importScripts('https://www.gstatic.com/firebasejs/12.11.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.11.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAaAsXl3I262r_da3DLTHeXRAOqgrzyiVQ",
  authDomain: "chat-app-e2cc7.firebaseapp.com",
  projectId: "chat-app-e2cc7",
  storageBucket: "chat-app-e2cc7.firebasestorage.app",
  messagingSenderId: "68675656128",
  appId: "1:68675656128:web:1ea6a01c25be2c53aa1025"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("Background msg:", payload);

  self.registration.showNotification(
    payload.notification.title,
    {
      body: payload.notification.body,
      icon: "/default-profile.png"
    }
  );
});