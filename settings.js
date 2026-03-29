// settings.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged, updateProfile, updateEmail, deleteUser } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } 
from "https://www.gstatic.com/firebasejs/12.11.0/firebase-storage.js";

const storage = getStorage(app);
// ---------------- FIREBASE CONFIG ----------------
const firebaseConfig = {
  apiKey: "AIzaSyAaAsXl3I262r_da3DLTHeXRAOqgrzyiVQ",
  authDomain: "chat-app-e2cc7.firebaseapp.com",
  projectId: "chat-app-e2cc7",
  storageBucket: "chat-app-e2cc7.firebasestorage.app",
  messagingSenderId: "68675656128",
  appId: "1:68675656128:web:1ea6a01c25be2c53aa1025"
};

// ---------------- INITIALIZE FIREBASE ----------------
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ---------------- DOM ELEMENTS ----------------
const usernameInput = document.getElementById("edit-username");
const photoInput = document.getElementById("edit-photo");
const emailInput = document.getElementById("edit-email");
const updateProfileBtn = document.getElementById("update-profile-btn");
const updateEmailBtn = document.getElementById("update-email-btn");
const deleteAccountBtn = document.getElementById("delete-account-btn");
const backToChatBtn = document.getElementById("back-to-chat");
const msgBox = document.getElementById("settings-msg");

// ---------------- AUTH CHECK ----------------
onAuthStateChanged(auth, (user) => {
  if (!user) {
    // User not logged in → redirect to login
    window.location.href = "index.html";
  } else {
    // Pre-fill current values
    usernameInput.value = user.displayName || "";
    emailInput.value = user.email || "";
    photoInput.value = user.photoURL || "";
  }
});

// ---------------- UPDATE PROFILE ----------------
updateProfileBtn.onclick = async () => {
  const newUsername = usernameInput.value.trim();
  const fileInput = document.getElementById("edit-photo-file");
  let photoURL = auth.currentUser.photoURL || "";

  try {
    // Agar user ne file select ki
    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const storageRef = ref(storage, `profile_pics/${auth.currentUser.uid}`);
      await uploadBytes(storageRef, file);
      photoURL = await getDownloadURL(storageRef);
    }

    await updateProfile(auth.currentUser, {
      displayName: newUsername || auth.currentUser.displayName,
      photoURL: photoURL
    });

    msgBox.innerText = "Profile updated ✅";
    msgBox.style.color = "green";
  } catch (err) {
    msgBox.innerText = err.message;
    msgBox.style.color = "red";
  }
};
// ---------------- UPDATE EMAIL ----------------
updateEmailBtn.onclick = async () => {
  const newEmail = emailInput.value.trim();
  if (!newEmail) return;

  try {
    await updateEmail(auth.currentUser, newEmail);
    msgBox.innerText = "Email updated ✅";
    msgBox.style.color = "green";
  } catch (err) {
    msgBox.innerText = err.message;
    msgBox.style.color = "red";
  }
};

// ---------------- DELETE ACCOUNT ----------------
deleteAccountBtn.onclick = async () => {
  if (!confirm("Are you sure you want to delete your account? This cannot be undone!")) return;

  try {
    await deleteUser(auth.currentUser);
    alert("Account deleted ✅");
    window.location.href = "index.html";
  } catch (err) {
    msgBox.innerText = err.message;
    msgBox.style.color = "red";
  }
};

// ---------------- BACK TO CHAT ----------------
// Smooth redirect to main chat inside index.html
backToChatBtn.onclick = () => {
  window.location.href = "index.html#main-chat-wrapper";
};

const logoutBtn = document.getElementById("logout-btn");

logoutBtn.onclick = async () => {
  try {
    await auth.signOut(); // ✅ firebase logout
    window.location.href = "index.html"; // wapas login page pe redirect
  } catch (err) {
    console.error("Logout failed:", err);
    alert("Logout failed. Try again.");
  }
};