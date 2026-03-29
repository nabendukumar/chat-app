// app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { 
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, 
  updateProfile, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { 
  getFirestore, collection, addDoc, getDocs, query, orderBy, onSnapshot, doc, setDoc 
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-messaging.js";

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
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ---------------- DOM Elements ----------------
const authTitle = document.getElementById("auth-title");
const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("auth-email");
const passwordInput = document.getElementById("auth-password");
const authBtn = document.getElementById("auth-btn");
const toggleAuth = document.getElementById("toggle-auth");
const authMsg = document.getElementById("auth-msg");
const chatWrapper = document.getElementById("main-chat-wrapper");
const authForms = document.getElementById("auth-forms");
const chatBox = document.getElementById("chat-box");
const messageInput = document.getElementById("message-input");
const chatUsername = document.getElementById("chat-username");
const settingsBtn = document.getElementById("settings-btn");
const sendBtn = document.getElementById("send-btn");
const logoutBtn = document.getElementById("logout-btn");

// ---- DM List + Search ----
const dmList = document.getElementById("dm-list");       
const searchInput = document.getElementById("search-user"); 

// ---------------- State ----------------
let isLogin = true;

// ---------------- Toggle Login/Signup ----------------
toggleAuth.onclick = () => {
  isLogin = !isLogin;
  if (isLogin) {
    authTitle.innerText = "Login";
    usernameInput.style.display = "none";
    authBtn.innerText = "Login";
    toggleAuth.innerText = "Don't have an account? Sign Up";
  } else {
    authTitle.innerText = "Sign Up";
    usernameInput.style.display = "block";
    authBtn.innerText = "Sign Up";
    toggleAuth.innerText = "Already have an account? Login";
  }
  authMsg.innerText = "";
};

// ---------------- Auth Button ----------------
authBtn.onclick = async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  const username = usernameInput.value.trim();

  if (!email || !password || (!isLogin && !username)) {
    authMsg.innerText = "Please fill all required fields";
    authMsg.style.color = "red";
    return;
  }

  try {
    let userCredential;
    if (isLogin) {
      userCredential = await signInWithEmailAndPassword(auth, email, password);
    } else {
      // Signup
      userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // ✅ Save username in Auth
      await updateProfile(userCredential.user, { displayName: username });

      // ✅ Save user info in Firestore with UID as document ID
      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        displayName: username,
        email: email,
        photoURL: userCredential.user.photoURL || ""
      });
    }

    authMsg.innerText = `${isLogin ? "Login" : "Signup"} successful ✅`;
    authMsg.style.color = "green";

    // Show chat UI
    authForms.style.display = "none";
    chatWrapper.style.display = "flex";
    chatUsername.innerText = auth.currentUser.displayName || auth.currentUser.email;
    chatUsername.dataset.uid = ""; // No chat selected initially

    loadDMList(); 
    setupFCM();

  } catch (err) {
    authMsg.innerText = err.message;
    authMsg.style.color = "red";
  }
};

// ---------------- Auth State Check ----------------
onAuthStateChanged(auth, (user) => {
  if (user) {
    authForms.style.display = "none";
    chatWrapper.style.display = "flex";
    chatUsername.innerText = user.displayName || user.email;
    chatUsername.dataset.uid = "";
    loadDMList();
    setupFCM();
  } else {
    authForms.style.display = "block";
    chatWrapper.style.display = "none";
  }
});

// ---------------- Send Message ----------------
sendBtn.onclick = async () => {
  const text = messageInput.value.trim();
  const receiverUID = chatUsername.dataset.uid;
  const receiverName = chatUsername.innerText;

  if (!text) return alert("Enter a message");
  if (!auth.currentUser) return alert("Login first");
  if (!receiverUID) return alert("Select a user");

  try {
    await addDoc(collection(db, "messages"), {
      text,
      time: new Date(),
      senderUid: auth.currentUser.uid,
      sender: auth.currentUser.displayName || auth.currentUser.email,
      receiverUid: receiverUID,
      receiverName: receiverName,
      photoURL: auth.currentUser.photoURL || ''
    });
    messageInput.value = "";
  } catch (err) {
    console.error(err);
    alert("Failed to send message");
  }
};
messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault(); // new line na ho
    sendBtn.click();    // send message
  }
});


// ---------------- Add user to DM List ----------------
function addUserToDMList(user) {
  if (document.getElementById(`dm-${user.uid}`)) return; // avoid duplicates
  const div = document.createElement("div");
  div.id = `dm-${user.uid}`;
  div.className = "dm-item";
  div.innerHTML = `<img src="${user.photoURL || 'default-profile.png'}" alt="user"/>
                   <span>${user.displayName}</span>`;
  div.onclick = () => openChatWith(user.uid, user.displayName);
  dmList.appendChild(div);
}

// ---------------- Open chat ----------------
let unsubscribeMessages = null; // old chat listener ko remove karne ke liye

function openChatWith(uid, name) {
  chatUsername.innerText = name;
  chatUsername.dataset.uid = uid; // must for send
  chatBox.innerHTML = "";

  // Agar pehle ka listener hai to remove karo
  if (unsubscribeMessages) unsubscribeMessages();

  const messagesQuery = query(collection(db, "messages"), orderBy("time"));

  // new real-time listener
  unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
    chatBox.innerHTML = ""; // clear previous messages
    snapshot.forEach(doc => {
      const data = doc.data();
      if ((data.senderUid === auth.currentUser.uid && data.receiverUid === uid) ||
          (data.senderUid === uid && data.receiverUid === auth.currentUser.uid)) {
        const msgDiv = document.createElement("div");
        msgDiv.className = (data.senderUid === auth.currentUser.uid) ? "message sent" : "message received";
        msgDiv.innerText = data.text;
        chatBox.appendChild(msgDiv);
      }
    });
    chatBox.scrollTop = chatBox.scrollHeight; // scroll to latest
  });
}

// ---------------- Search Users ----------------
searchInput.addEventListener("input", async (e) => {
  const queryText = e.target.value.toLowerCase();
  dmList.innerHTML = "";

  try {
    const usersSnapshot = await getDocs(collection(db, "users"));
    usersSnapshot.forEach(doc => {
      const user = doc.data();

      // Skip current logged-in user
      if (user.uid === auth.currentUser.uid) return;

      const name = user.displayName || "";
      const email = user.email || "";

      if (!queryText || name.toLowerCase().includes(queryText) || email.toLowerCase().includes(queryText)) {
        addUserToDMList(user);
      }
    });
  } catch (err) {
    console.error("Search error:", err);
  }
});

// ---------------- Load DM List ----------------
async function loadDMList() {
  dmList.innerHTML = "";
  const messagesSnapshot = await getDocs(collection(db, "messages"));
  const dmUsers = {};

  messagesSnapshot.forEach(doc => {
    const data = doc.data();
    let otherUID = null;
    let otherName = null;

    if (data.senderUid === auth.currentUser.uid) {
      otherUID = data.receiverUid;
      otherName = data.receiverName || data.receiverUid;
    } else if (data.receiverUid === auth.currentUser.uid) {
      otherUID = data.senderUid;
      otherName = data.sender || data.senderUid;
    }

    if (otherUID && !dmUsers[otherUID]) {
      dmUsers[otherUID] = { uid: otherUID, displayName: otherName };
    }
  });

  Object.values(dmUsers).forEach(user => addUserToDMList(user));
}


// ---------------- Settings ----------------
settingsBtn.onclick = () => {
  window.location.href = "settings.html";
};

// ---------------- FCM ----------------
async function setupFCM() {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.register('firebase-messaging-sw.js');
    const messaging = getMessaging(app);

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    const token = await getToken(messaging, { 
      vapidKey: "BNYmK_FS_MiwdcuvNfzwb4okV65iQr9adYu01EZF3iz09QNILmsURdu_aOvIMooXnlqDnqgppDlsOL_Rh7Vk9bw"
    });
    console.log("FCM TOKEN:", token);

    onMessage(messaging, (payload) => {
      console.log("Foreground msg:", payload);
      if (authMsg) {
        authMsg.innerText = `${payload.notification?.title || ''} - ${payload.notification?.body || ''}`;
        authMsg.style.color = "blue";
      }
    });

  } catch (err) {
    console.error("FCM Error:", err);
  }
}

// ---------------- Logout Button ----------------
logoutBtn.onclick = async () => {
  try {
    await auth.signOut(); // Firebase logout
    window.location.href = "index.html"; // Login page ya main page pe redirect
  } catch (err) {
    console.error("Logout failed:", err);
    alert("Logout failed. Try again.");
  }
};