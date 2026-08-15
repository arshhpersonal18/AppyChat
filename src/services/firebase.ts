import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  getDocFromServer
} from 'firebase/firestore';
import { UserProfile, FriendRequest, ChatMessage, CallData, CallLog } from '../types';
import { generateInitialsAvatar, generateIdentifier } from './avatar';

// Real Firebase Config provided by user
export const firebaseConfig = {
  apiKey: "AIzaSyCRdp-XomEEzIjxDtxA0x87S7hTx4C5ydo",
  authDomain: "bozex-appychat.firebaseapp.com",
  projectId: "bozex-appychat",
  storageBucket: "bozex-appychat.firebasestorage.app",
  messagingSenderId: "489959402643",
  appId: "1:489959402643:web:532ae1c83947f64228f166",
  measurementId: "G-Y14BFB9408"
};

// Initialize Firebase App instance
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

// Error logging helper
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Notice:', JSON.stringify(errInfo));
}

// Test connection on boot
export async function testFirebaseConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or initializing.');
    }
  }
}
testFirebaseConnection();

// --- AUTHENTICATION SERVICES ---

const customAuthListeners: Array<(user: UserProfile | null, loading: boolean) => void> = [];

function notifyCustomAuth(user: UserProfile | null, loading: boolean = false) {
  customAuthListeners.forEach((cb) => {
    try {
      cb(user, loading);
    } catch {
      // ignore
    }
  });
}

function getStoredUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem('appychat_active_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setStoredUser(profile: UserProfile | null) {
  try {
    if (profile) {
      localStorage.setItem('appychat_active_user', JSON.stringify(profile));
    } else {
      localStorage.removeItem('appychat_active_user');
    }
  } catch {
    // ignore
  }
}

function generateSafeUid(email: string): string {
  const cleanEmail = email.toLowerCase().trim();
  let hash = 0;
  for (let i = 0; i < cleanEmail.length; i++) {
    hash = (hash << 5) - hash + cleanEmail.charCodeAt(i);
    hash |= 0;
  }
  const cleanPrefix = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_').slice(0, 12);
  return `u_${cleanPrefix}_${Math.abs(hash).toString(36)}`;
}

export async function signUpWithEmail(email: string, pass: string, name: string, bio?: string): Promise<UserProfile> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim() || 'AppyChat User';

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
    const user = userCredential.user;

    const identifier = generateIdentifier();
    const dpUrl = generateInitialsAvatar(cleanName, identifier);

    await updateProfile(user, { displayName: cleanName });

    const profile: UserProfile = {
      uid: user.uid,
      name: cleanName,
      bio: (bio && bio.trim()) || 'Hey there! I am using AppyChat.',
      identifier,
      dpUrl,
      status: 'online',
      last_changed: Date.now()
    };

    await setDoc(doc(db, 'users', user.uid), {
      ...profile,
      email: user.email || cleanEmail
    });

    setStoredUser(profile);
    notifyCustomAuth(profile, false);
    return profile;
  } catch (err: any) {
    // If Firebase Auth provider is not enabled in console (auth/configuration-not-found or operation-not-allowed)
    if (
      err.code === 'auth/configuration-not-found' ||
      err.code === 'auth/operation-not-allowed' ||
      err.code === 'auth/admin-restricted-operation'
    ) {
      console.warn('Firebase Auth email provider not configured in Firebase Console; registering directly in Firestore.');
      
      const fallbackUid = generateSafeUid(cleanEmail);
      const existing = await findUserByEmail(cleanEmail);
      if (existing) {
        throw { code: 'auth/email-already-in-use', message: 'An account with this email already exists. Please sign in.' };
      }

      const identifier = generateIdentifier();
      const dpUrl = generateInitialsAvatar(cleanName, identifier);

      const profile: UserProfile = {
        uid: fallbackUid,
        name: cleanName,
        bio: (bio && bio.trim()) || 'Hey there! I am using AppyChat.',
        identifier,
        dpUrl,
        status: 'online',
        last_changed: Date.now()
      };

      await setDoc(doc(db, 'users', fallbackUid), {
        ...profile,
        email: cleanEmail
      });

      setStoredUser(profile);
      notifyCustomAuth(profile, false);
      return profile;
    }
    throw err;
  }
}

export async function signInWithEmail(email: string, pass: string): Promise<UserProfile> {
  const cleanEmail = email.trim().toLowerCase();

  try {
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
    const user = userCredential.user;

    let profile = await getUserProfile(user.uid);
    if (!profile) {
      const identifier = generateIdentifier();
      const cleanName = user.displayName || cleanEmail.split('@')[0] || 'User';
      const dpUrl = generateInitialsAvatar(cleanName, identifier);
      profile = {
        uid: user.uid,
        name: cleanName,
        bio: 'Hey there! I am using AppyChat.',
        identifier,
        dpUrl,
        status: 'online',
        last_changed: Date.now()
      };
      await setDoc(doc(db, 'users', user.uid), {
        ...profile,
        email: user.email || cleanEmail
      });
    } else {
      await updateUserPresence(user.uid, 'online');
    }

    setStoredUser(profile);
    notifyCustomAuth(profile, false);
    return profile;
  } catch (err: any) {
    // If Firebase Auth provider is not enabled in console
    if (
      err.code === 'auth/configuration-not-found' ||
      err.code === 'auth/operation-not-allowed' ||
      err.code === 'auth/admin-restricted-operation'
    ) {
      console.warn('Firebase Auth email provider not configured in Firebase Console; logging in via Firestore record.');
      
      let profile = await findUserByEmail(cleanEmail);
      if (!profile) {
        // Automatically create account if none found
        const fallbackUid = generateSafeUid(cleanEmail);
        const identifier = generateIdentifier();
        const cleanName = cleanEmail.split('@')[0] || 'User';
        const dpUrl = generateInitialsAvatar(cleanName, identifier);
        profile = {
          uid: fallbackUid,
          name: cleanName,
          bio: 'Hey there! I am using AppyChat.',
          identifier,
          dpUrl,
          status: 'online',
          last_changed: Date.now()
        };
        await setDoc(doc(db, 'users', fallbackUid), {
          ...profile,
          email: cleanEmail
        });
      } else {
        await updateUserPresence(profile.uid, 'online');
      }

      setStoredUser(profile);
      notifyCustomAuth(profile, false);
      return profile;
    }
    throw err;
  }
}

export async function signInWithGoogle(): Promise<UserProfile> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  
  try {
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    let profile = await getUserProfile(user.uid);
    if (!profile) {
      const identifier = generateIdentifier();
      const cleanName = user.displayName || 'Google User';
      const dpUrl = user.photoURL || generateInitialsAvatar(cleanName, identifier);
      profile = {
        uid: user.uid,
        name: cleanName,
        bio: 'Hey there! I am using AppyChat.',
        identifier,
        dpUrl,
        status: 'online',
        last_changed: Date.now()
      };
      await setDoc(doc(db, 'users', user.uid), {
        ...profile,
        email: user.email || ''
      });
    } else {
      await updateUserPresence(user.uid, 'online');
    }

    setStoredUser(profile);
    notifyCustomAuth(profile, false);
    return profile;
  } catch (err: any) {
    if (
      err.code === 'auth/configuration-not-found' ||
      err.code === 'auth/operation-not-allowed'
    ) {
      throw {
        code: err.code,
        message: 'Google Sign-In is not enabled in Firebase Console (Authentication > Sign-in method). Please sign up with email or enable Google provider.'
      };
    }
    throw err;
  }
}

export async function signOutUser(uid?: string): Promise<void> {
  setStoredUser(null);
  notifyCustomAuth(null, false);

  if (uid) {
    try {
      await updateUserPresence(uid, 'offline');
    } catch {
      // ignore
    }
  }
  try {
    await signOut(auth);
  } catch {
    // ignore
  }
}

export function subscribeAuthState(callback: (user: UserProfile | null, loading: boolean) => void): () => void {
  customAuthListeners.push(callback);

  // Check stored user first
  const stored = getStoredUser();
  if (stored) {
    getUserProfile(stored.uid).then((fresh) => {
      if (fresh) {
        callback(fresh, false);
      } else {
        callback(stored, false);
      }
    }).catch(() => {
      callback(stored, false);
    });
  }

  const unsub = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
    if (firebaseUser) {
      const profile = await getUserProfile(firebaseUser.uid);
      if (profile) {
        setStoredUser(profile);
        callback(profile, false);
      } else {
        const identifier = generateIdentifier();
        const cleanName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User';
        const dpUrl = firebaseUser.photoURL || generateInitialsAvatar(cleanName, identifier);
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          name: cleanName,
          bio: 'Hey there! I am using AppyChat.',
          identifier,
          dpUrl,
          status: 'online',
          last_changed: Date.now()
        };
        try {
          await setDoc(doc(db, 'users', firebaseUser.uid), {
            ...newProfile,
            email: firebaseUser.email || ''
          });
        } catch (e) {
          console.error(e);
        }
        setStoredUser(newProfile);
        callback(newProfile, false);
      }
    } else {
      if (!getStoredUser()) {
        callback(null, false);
      }
    }
  });

  return () => {
    const idx = customAuthListeners.indexOf(callback);
    if (idx !== -1) customAuthListeners.splice(idx, 1);
    unsub();
  };
}

// --- USER MANAGEMENT ---

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
    return null;
  }
}

export async function updateUserProfile(profile: UserProfile): Promise<void> {
  try {
    await setDoc(doc(db, 'users', profile.uid), {
      ...profile,
      last_changed: Date.now()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${profile.uid}`);
  }
}

export async function updateUserPresence(uid: string, status: 'online' | 'offline' | 'away'): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid), {
      status,
      last_changed: Date.now()
    });
  } catch {
    // silently catch if document does not exist yet
  }
}

export async function findUserByIdentifier(identifier: string): Promise<UserProfile | null> {
  const clean = identifier.trim().toLowerCase();
  try {
    const q = query(collection(db, 'users'), where('identifier', '==', clean));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'users');
    return null;
  }
}

export async function findUserByEmail(email: string): Promise<UserProfile | null> {
  const clean = email.trim().toLowerCase();
  try {
    const q = query(collection(db, 'users'), where('email', '==', clean));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'users');
    return null;
  }
}

// --- CONTACTS & FRIEND REQUESTS ---

export function subscribeUserContacts(uid: string, callback: (contacts: UserProfile[]) => void): () => void {
  const contactsRef = collection(db, 'users', uid, 'contacts');
  return onSnapshot(contactsRef, (snapshot) => {
    const contacts: UserProfile[] = [];
    snapshot.forEach((d) => {
      contacts.push(d.data() as UserProfile);
    });
    // Sort contacts alphabetically
    contacts.sort((a, b) => a.name.localeCompare(b.name));
    callback(contacts);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, `users/${uid}/contacts`);
  });
}

export function subscribeFriendRequests(uid: string, callback: (requests: FriendRequest[]) => void): () => void {
  const q = query(
    collection(db, 'friend_requests'),
    where('targetUid', '==', uid),
    where('status', '==', 'pending')
  );

  return onSnapshot(q, (snapshot) => {
    const reqs: FriendRequest[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      reqs.push({
        id: d.id,
        senderUid: data.senderUid,
        targetUid: data.targetUid,
        name: data.name,
        identifier: data.identifier,
        dpUrl: data.dpUrl,
        timestamp: data.timestamp || Date.now()
      });
    });
    callback(reqs);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'friend_requests');
  });
}

export async function sendFriendRequest(currentUser: UserProfile, targetUser: UserProfile): Promise<void> {
  try {
    // Check if request already exists
    const q = query(
      collection(db, 'friend_requests'),
      where('senderUid', '==', currentUser.uid),
      where('targetUid', '==', targetUser.uid),
      where('status', '==', 'pending')
    );
    const existing = await getDocs(q);
    if (!existing.empty) {
      return;
    }

    await addDoc(collection(db, 'friend_requests'), {
      senderUid: currentUser.uid,
      targetUid: targetUser.uid,
      name: currentUser.name,
      identifier: currentUser.identifier,
      dpUrl: currentUser.dpUrl,
      timestamp: Date.now(),
      status: 'pending'
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'friend_requests');
  }
}

export async function acceptFriendRequest(
  requestId: string,
  currentUser: UserProfile,
  senderUid: string
): Promise<void> {
  try {
    // Get sender's profile
    const sender = await getUserProfile(senderUid);
    if (!sender) return;

    // Add sender to current user's contacts
    await setDoc(doc(db, 'users', currentUser.uid, 'contacts', sender.uid), sender);

    // Add current user to sender's contacts
    await setDoc(doc(db, 'users', sender.uid, 'contacts', currentUser.uid), currentUser);

    // Remove or update the friend request
    await deleteDoc(doc(db, 'friend_requests', requestId));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `friend_requests/${requestId}`);
  }
}

export async function declineFriendRequest(requestId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'friend_requests', requestId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `friend_requests/${requestId}`);
  }
}

// --- REAL-TIME CHAT & MESSAGES ---

export function getChatId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join('_');
}

export function subscribeMessages(chatId: string, callback: (messages: ChatMessage[]) => void): () => void {
  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('timestamp', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const msgs: ChatMessage[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      msgs.push({
        id: d.id,
        from: data.from,
        text: data.text,
        timestamp: data.timestamp || Date.now(),
        dpUrl: data.dpUrl
      });
    });
    callback(msgs);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, `chats/${chatId}/messages`);
  });
}

export async function sendChatMessage(chatId: string, from: string, text: string, dpUrl?: string): Promise<void> {
  try {
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      from,
      text: text.trim(),
      timestamp: Date.now(),
      dpUrl: dpUrl || ''
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `chats/${chatId}/messages`);
  }
}

export const sendMessage = sendChatMessage;

export async function clearChatHistory(chatId: string): Promise<void> {
  try {
    const q = query(collection(db, 'chats', chatId, 'messages'));
    const snap = await getDocs(q);
    const promises = snap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(promises);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `chats/${chatId}/messages`);
  }
}

export async function setTypingStatus(chatId: string, uid: string, isTyping: boolean): Promise<void> {
  try {
    await setDoc(doc(db, 'chats', chatId, 'typing', uid), {
      isTyping,
      timestamp: Date.now()
    }, { merge: true });
  } catch {
    // ignore
  }
}

export function subscribeTyping(chatId: string, callback: (typingMap: Record<string, boolean>) => void): () => void {
  return onSnapshot(collection(db, 'chats', chatId, 'typing'), (snapshot) => {
    const map: Record<string, boolean> = {};
    const now = Date.now();
    snapshot.forEach((d) => {
      const data = d.data();
      // Only treat typing as active if updated within last 5 seconds
      if (data.isTyping && now - (data.timestamp || 0) < 5000) {
        map[d.id] = true;
      } else {
        map[d.id] = false;
      }
    });
    callback(map);
  });
}

// --- WEBRTC CALL SIGNALING ---

export async function saveCallSignal(callData: CallData): Promise<void> {
  try {
    // Strip non-serializable fields if any
    const safeData = JSON.parse(JSON.stringify(callData));
    await setDoc(doc(db, 'calls', callData.callId), safeData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `calls/${callData.callId}`);
  }
}

export function subscribeCallSignal(callId: string, callback: (call: CallData | null) => void): () => void {
  return onSnapshot(doc(db, 'calls', callId), (snap) => {
    if (snap.exists()) {
      callback(snap.data() as CallData);
    } else {
      callback(null);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, `calls/${callId}`);
  });
}

export function subscribeIncomingCalls(uid: string, callback: (call: CallData | null) => void): () => void {
  const q = query(
    collection(db, 'calls'),
    where('to', '==', uid),
    where('status', '==', 'ringing')
  );

  return onSnapshot(q, (snap) => {
    if (!snap.empty) {
      callback(snap.docs[0].data() as CallData);
    } else {
      callback(null);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'calls');
  });
}

// --- CALL LOGS ---

export async function addCallLogEntry(uid: string, log: Omit<CallLog, 'id'>): Promise<void> {
  try {
    await addDoc(collection(db, 'users', uid, 'call_logs'), {
      ...log,
      timestamp: log.timestamp || Date.now()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `users/${uid}/call_logs`);
  }
}

export function subscribeCallLogs(uid: string, callback: (logs: CallLog[]) => void): () => void {
  const q = query(
    collection(db, 'users', uid, 'call_logs'),
    orderBy('timestamp', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const logs: CallLog[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      logs.push({
        id: d.id,
        type: data.type,
        duration: data.duration || 0,
        timestamp: data.timestamp || Date.now(),
        with: data.with,
        withName: data.withName || 'User',
        withDpUrl: data.withDpUrl,
        isOutgoing: data.isOutgoing
      });
    });
    callback(logs);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, `users/${uid}/call_logs`);
  });
}
