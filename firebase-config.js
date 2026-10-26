// firebase-config.js — Firebase init + helper functions for app.js
// Loaded AFTER the Firebase compat SDK scripts in index.html.
// Uses the global \`firebase\` namespace from the compat CDN builds.

// ---- Firebase config — replace with your own project credentials ----
// Get from: https://console.firebase.google.com/ -> Project Settings -> Your apps
const firebaseConfig = {
  apiKey: "AIzaSyD6-example-only-replace-me",
  authDomain: "genapp-vibekit.firebaseapp.com",
  projectId: "genapp-vibekit",
  storageBucket: "genapp-vibekit.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef0123456789"
};

// ---- Initialize (guard against double-init) ----
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const app = firebase.app();
const auth = firebase.auth();
const db = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// Enable offline persistence (graceful degradation)
db.enablePersistence().catch(function(err) {
  if (err.code === 'failed-precondition') {
    console.warn('[firebase] Multi-tab persistence not available');
  } else if (err.code === 'unimplemented') {
    console.warn('[firebase] Persistence not supported in this browser');
  }
});

// ---- Expose to app.js (ESM free, works with VibeKit/GitHub Pages) ----
// FirebaseAuth: auth instance + methods from compat SDK
window.FirebaseAuth = firebase.auth;
window.FirebaseAuth.auth = auth;
window.FirebaseAuth.GoogleAuthProvider = firebase.auth.GoogleAuthProvider;
window.FirebaseAuth.signInWithPopup = firebase.auth.Auth.prototype.signInWithPopup.bind(auth);
window.FirebaseAuth.signOut = firebase.auth.Auth.prototype.signOut.bind(auth);
window.FirebaseAuth.onAuthStateChanged = firebase.auth.Auth.prototype.onAuthStateChanged.bind(auth);
window.FirebaseAuth.createUserWithEmailAndPassword = firebase.auth.Auth.prototype.createUserWithEmailAndPassword.bind(auth);

// FirebaseFirestore: db instance + Firestore methods
window.FirebaseFirestore = firebase.firestore;
window.FirebaseFirestore.db = db;
window.FirebaseFirestore.query = firebase.firestore.query;
window.FirebaseFirestore.where = firebase.firestore.where;
window.FirebaseFirestore.orderBy = firebase.firestore.orderBy;
window.FirebaseFirestore.onSnapshot = firebase.firestore.onSnapshot;
window.FirebaseFirestore.updateDoc = function(docRef, data) { return docRef.update(data); };
window.FirebaseFirestore.addDoc = firebase.firestore.addDoc;
window.FirebaseFirestore.deleteDoc = function(docRef) { return docRef.delete(); };
window.FirebaseFirestore.serverTimestamp = firebase.firestore.FieldValue.serverTimestamp;
window.FirebaseFirestore.writeBatch = firebase.firestore.WriteBatch.bind(db);

// Firestore helpers: look up a user doc by Firebase UID
window.FirebaseFirestore.getUserDoc = async function(uid) {
  const snap = await db.collection('users').where('firebaseUid', '==', uid).limit(1).get();
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
};

// Firestore helpers: create a Firestore profile for a new Firebase Auth user
window.FirebaseFirestore.createUserDoc = async function(firebaseUser) {
  const displayName = firebaseUser.displayName || firebaseUser.email;
  const docRef = await db.collection('users').add({
    firebaseUid: firebaseUser.uid,
    username: firebaseUser.email || displayName,
    name: displayName,
    email: firebaseUser.email,
    role: 'client',
    avatar: displayName ? displayName.charAt(0) : '?',
    created_at: firebase.firestore.FieldValue.serverTimestamp()
  });
  return { id: docRef.id };
};
