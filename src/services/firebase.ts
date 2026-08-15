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
  getDocFromServer
} from 'firebase/firestore';
import {
  UserProfile,
  FriendRequest,
  ChatMessage,
  CallData,
  CallLog,
  GroupChat,
  GroupMember,
  ChatSettings,
  AppSettings,
  ChatCategory
} from '../types';
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
      last_changed: Date.now(),
      createdAt: Date.now()
    };

    await setDoc(doc(db, 'users', user.uid), {
      ...profile,
      email: user.email || cleanEmail
    });

    setStoredUser(profile);
    notifyCustomAuth(profile, false);
    return profile;
  } catch (err: any) {
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
        last_changed: Date.now(),
        createdAt: Date.now()
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
        last_changed: Date.now(),
        createdAt: Date.now()
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
    if (
      err.code === 'auth/configuration-not-found' ||
      err.code === 'auth/operation-not-allowed' ||
      err.code === 'auth/admin-restricted-operation'
    ) {
      console.warn('Firebase Auth email provider not configured in Firebase Console; logging in via Firestore record.');
      
      let profile = await findUserByEmail(cleanEmail);
      if (!profile) {
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
          last_changed: Date.now(),
          createdAt: Date.now()
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
        last_changed: Date.now(),
        createdAt: Date.now()
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
        const cleanName = firebaseUser.displayName || 'AppyChat User';
        const dpUrl = firebaseUser.photoURL || generateInitialsAvatar(cleanName, identifier);
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          name: cleanName,
          bio: 'Hey there! I am using AppyChat.',
          identifier,
          dpUrl,
          status: 'online',
          last_changed: Date.now(),
          createdAt: Date.now()
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
    setStoredUser(profile);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${profile.uid}`);
  }
}

export async function updateUserPresence(uid: string, status: 'online' | 'offline' | 'away'): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid), {
      status,
      lastSeen: Date.now(),
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

// User Block / Report
export async function blockUser(currentUid: string, targetUid: string): Promise<void> {
  try {
    const user = await getUserProfile(currentUid);
    if (!user) return;
    const currentBlocked = user.blockedUids || [];
    if (!currentBlocked.includes(targetUid)) {
      const updatedBlocked = [...currentBlocked, targetUid];
      await updateDoc(doc(db, 'users', currentUid), {
        blockedUids: updatedBlocked
      });
      user.blockedUids = updatedBlocked;
      setStoredUser(user);
    }
  } catch (err) {
    console.error('Error blocking user:', err);
  }
}

export async function unblockUser(currentUid: string, targetUid: string): Promise<void> {
  try {
    const user = await getUserProfile(currentUid);
    if (!user) return;
    const currentBlocked = user.blockedUids || [];
    const updatedBlocked = currentBlocked.filter(id => id !== targetUid);
    await updateDoc(doc(db, 'users', currentUid), {
      blockedUids: updatedBlocked
    });
    user.blockedUids = updatedBlocked;
    setStoredUser(user);
  } catch (err) {
    console.error('Error unblocking user:', err);
  }
}

export async function reportContent(reporterUid: string, targetId: string, reason: string, type: 'user' | 'message' | 'group'): Promise<void> {
  try {
    await addDoc(collection(db, 'reports'), {
      reporterUid,
      targetId,
      reason,
      type,
      timestamp: Date.now()
    });
  } catch (err) {
    console.error('Error submitting report:', err);
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

export function subscribeOutgoingRequests(uid: string, callback: (requests: FriendRequest[]) => void): () => void {
  const q = query(
    collection(db, 'friend_requests'),
    where('senderUid', '==', uid),
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
    const sender = await getUserProfile(senderUid);
    if (!sender) return;

    await setDoc(doc(db, 'users', currentUser.uid, 'contacts', sender.uid), sender);
    await setDoc(doc(db, 'users', sender.uid, 'contacts', currentUser.uid), currentUser);
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

export async function removeContact(currentUserUid: string, contactUid: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'users', currentUserUid, 'contacts', contactUid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${currentUserUid}/contacts/${contactUid}`);
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
        senderName: data.senderName,
        text: data.text || '',
        timestamp: data.timestamp || Date.now(),
        dpUrl: data.dpUrl,
        edited: data.edited,
        editedAt: data.editedAt,
        deletedForEveryone: data.deletedForEveryone,
        deletedForUids: data.deletedForUids,
        replyTo: data.replyTo,
        forwardFrom: data.forwardFrom,
        pinned: data.pinned,
        starredUids: data.starredUids,
        reactions: data.reactions,
        mediaType: data.mediaType || 'text',
        mediaUrl: data.mediaUrl,
        mediaUrls: data.mediaUrls,
        mediaInfo: data.mediaInfo,
        location: data.location,
        sharedContact: data.sharedContact,
        status: data.status || 'read',
        linkPreviews: data.linkPreviews,
        mentions: data.mentions
      });
    });
    callback(msgs);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, `chats/${chatId}/messages`);
  });
}

export const subscribeChatMessages = subscribeMessages;

export async function sendChatMessage(
  chatId: string,
  from: string,
  text: string,
  dpUrl?: string,
  extra?: Partial<ChatMessage>
): Promise<string> {
  try {
    const docData: Record<string, any> = {
      from,
      text: (text || '').trim(),
      timestamp: Date.now(),
      dpUrl: dpUrl || '',
      status: 'sent',
      mediaType: extra?.mediaType || 'text',
      ...extra
    };

    // Clean undefined fields
    Object.keys(docData).forEach(k => {
      if (docData[k] === undefined) delete docData[k];
    });

    const docRef = await addDoc(collection(db, 'chats', chatId, 'messages'), docData);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `chats/${chatId}/messages`);
    throw error;
  }
}

export const sendMessage = sendChatMessage;

export async function editChatMessage(chatId: string, messageId: string, newText: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), {
      text: newText.trim(),
      edited: true,
      editedAt: Date.now()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `chats/${chatId}/messages/${messageId}`);
  }
}

export async function deleteMessageForEveryone(chatId: string, messageId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), {
      deletedForEveryone: true,
      text: 'This message was deleted',
      mediaUrl: '',
      mediaUrls: []
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `chats/${chatId}/messages/${messageId}`);
  }
}

export async function deleteMessageForMe(chatId: string, messageId: string, currentUid: string): Promise<void> {
  try {
    const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
    const snap = await getDoc(msgRef);
    if (snap.exists()) {
      const data = snap.data();
      const deletedFor = data.deletedForUids || [];
      if (!deletedFor.includes(currentUid)) {
        await updateDoc(msgRef, {
          deletedForUids: [...deletedFor, currentUid]
        });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `chats/${chatId}/messages/${messageId}`);
  }
}

export async function toggleMessageReaction(chatId: string, messageId: string, emoji: string, uid: string): Promise<void> {
  try {
    const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
    const snap = await getDoc(msgRef);
    if (!snap.exists()) return;
    const data = snap.data();
    const reactions: Record<string, string[]> = data.reactions || {};

    const currentUsers = reactions[emoji] || [];
    if (currentUsers.includes(uid)) {
      // Remove reaction
      reactions[emoji] = currentUsers.filter(u => u !== uid);
      if (reactions[emoji].length === 0) {
        delete reactions[emoji];
      }
    } else {
      // Add reaction (and remove any prior reaction by this user if single-reaction mode or keep multi)
      reactions[emoji] = [...currentUsers, uid];
    }

    await updateDoc(msgRef, { reactions });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `chats/${chatId}/messages/${messageId}`);
  }
}

export async function togglePinMessage(chatId: string, messageId: string, isPinned: boolean): Promise<void> {
  try {
    await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), {
      pinned: isPinned
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `chats/${chatId}/messages/${messageId}`);
  }
}

export async function toggleStarMessage(chatId: string, messageId: string, uid: string): Promise<void> {
  try {
    const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
    const snap = await getDoc(msgRef);
    if (!snap.exists()) return;
    const data = snap.data();
    const starred: string[] = data.starredUids || [];
    const updatedStarred = starred.includes(uid) ? starred.filter(u => u !== uid) : [...starred, uid];
    await updateDoc(msgRef, { starredUids: updatedStarred });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `chats/${chatId}/messages/${messageId}`);
  }
}

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

export async function setTypingStatus(chatId: string, uid: string, isTyping: boolean, userName?: string): Promise<void> {
  try {
    await setDoc(doc(db, 'chats', chatId, 'typing', uid), {
      isTyping,
      name: userName || 'Someone',
      timestamp: Date.now()
    }, { merge: true });
  } catch {
    // ignore
  }
}

export function subscribeTyping(chatId: string, callback: (typingMap: Record<string, { isTyping: boolean; name?: string }>) => void): () => void {
  return onSnapshot(collection(db, 'chats', chatId, 'typing'), (snapshot) => {
    const map: Record<string, { isTyping: boolean; name?: string }> = {};
    const now = Date.now();
    snapshot.forEach((d) => {
      const data = d.data();
      if (data.isTyping && now - (data.timestamp || 0) < 6000) {
        map[d.id] = { isTyping: true, name: data.name };
      } else {
        map[d.id] = { isTyping: false };
      }
    });
    callback(map);
  });
}

// --- GROUP CHATS ---

export async function createGroupChat(
  name: string,
  description: string,
  avatarUrl: string,
  createdBy: UserProfile,
  memberProfiles: UserProfile[]
): Promise<GroupChat> {
  const members: GroupMember[] = [
    {
      uid: createdBy.uid,
      role: 'owner',
      joinedAt: Date.now(),
      name: createdBy.name,
      dpUrl: createdBy.dpUrl,
      identifier: createdBy.identifier
    },
    ...memberProfiles.map(m => ({
      uid: m.uid,
      role: 'member' as const,
      joinedAt: Date.now(),
      name: m.name,
      dpUrl: m.dpUrl,
      identifier: m.identifier
    }))
  ];

  const inviteCode = `grp-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const groupData: Omit<GroupChat, 'id'> = {
    name: name.trim(),
    description: description.trim(),
    avatarUrl: avatarUrl || generateInitialsAvatar(name, inviteCode),
    createdBy: createdBy.uid,
    createdAt: Date.now(),
    members,
    inviteCode,
    lastMessage: {
      text: `${createdBy.name} created the group "${name}"`,
      senderName: 'AppyChat',
      timestamp: Date.now()
    }
  };

  const docRef = await addDoc(collection(db, 'groups'), groupData);
  return { id: docRef.id, ...groupData };
}

export function subscribeUserGroups(uid: string, callback: (groups: GroupChat[]) => void): () => void {
  return onSnapshot(collection(db, 'groups'), (snapshot) => {
    const groups: GroupChat[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      const isMember = (data.members || []).some((m: GroupMember) => m.uid === uid);
      if (isMember) {
        groups.push({
          id: d.id,
          name: data.name,
          description: data.description,
          avatarUrl: data.avatarUrl,
          createdBy: data.createdBy,
          createdAt: data.createdAt,
          members: data.members || [],
          inviteCode: data.inviteCode,
          pinnedMessageId: data.pinnedMessageId,
          announcement: data.announcement,
          customTheme: data.customTheme,
          wallpaper: data.wallpaper,
          lastMessage: data.lastMessage
        });
      }
    });
    groups.sort((a, b) => (b.lastMessage?.timestamp || b.createdAt) - (a.lastMessage?.timestamp || a.createdAt));
    callback(groups);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'groups');
  });
}

export function subscribeGroupDetails(groupId: string, callback: (group: GroupChat | null) => void): () => void {
  return onSnapshot(doc(db, 'groups', groupId), (snap) => {
    if (snap.exists()) {
      callback({ id: snap.id, ...snap.data() } as GroupChat);
    } else {
      callback(null);
    }
  });
}

export async function updateGroupInfo(groupId: string, updates: Partial<GroupChat>): Promise<void> {
  try {
    await updateDoc(doc(db, 'groups', groupId), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `groups/${groupId}`);
  }
}

export async function addGroupMember(groupId: string, newMember: UserProfile): Promise<void> {
  try {
    const groupRef = doc(db, 'groups', groupId);
    const snap = await getDoc(groupRef);
    if (!snap.exists()) return;
    const group = snap.data() as GroupChat;
    if (group.members.some(m => m.uid === newMember.uid)) return;

    const updatedMembers: GroupMember[] = [
      ...group.members,
      {
        uid: newMember.uid,
        role: 'member',
        joinedAt: Date.now(),
        name: newMember.name,
        dpUrl: newMember.dpUrl,
        identifier: newMember.identifier
      }
    ];
    await updateDoc(groupRef, { members: updatedMembers });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `groups/${groupId}`);
  }
}

export async function removeGroupMember(groupId: string, targetUid: string): Promise<void> {
  try {
    const groupRef = doc(db, 'groups', groupId);
    const snap = await getDoc(groupRef);
    if (!snap.exists()) return;
    const group = snap.data() as GroupChat;
    const updatedMembers = group.members.filter(m => m.uid !== targetUid);
    await updateDoc(groupRef, { members: updatedMembers });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `groups/${groupId}`);
  }
}

export async function updateMemberRole(groupId: string, targetUid: string, role: 'admin' | 'member'): Promise<void> {
  try {
    const groupRef = doc(db, 'groups', groupId);
    const snap = await getDoc(groupRef);
    if (!snap.exists()) return;
    const group = snap.data() as GroupChat;
    const updatedMembers = group.members.map(m => m.uid === targetUid ? { ...m, role } : m);
    await updateDoc(groupRef, { members: updatedMembers });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `groups/${groupId}`);
  }
}

export async function leaveGroup(groupId: string, currentUid: string): Promise<void> {
  await removeGroupMember(groupId, currentUid);
}

export async function joinGroupByInviteCode(inviteCode: string, user: UserProfile): Promise<GroupChat | null> {
  try {
    const cleanCode = inviteCode.trim().toUpperCase();
    const q = query(collection(db, 'groups'), where('inviteCode', '==', cleanCode));
    const snap = await getDocs(q);
    if (snap.empty) return null;

    const groupDoc = snap.docs[0];
    const group = { id: groupDoc.id, ...groupDoc.data() } as GroupChat;

    if (!group.members.some(m => m.uid === user.uid)) {
      await addGroupMember(group.id, user);
    }
    return group;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'groups');
    return null;
  }
}

// --- WEBRTC CALL SIGNALING ---

export async function saveCallSignal(callData: CallData): Promise<void> {
  try {
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

// --- LOCAL STORAGE CHAT & APP SETTINGS ---

const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: 'dark',
  accentColor: '#00A878',
  wallpaper: 'default',
  bubbleStyle: 'modern',
  soundEnabled: true,
  vibrationEnabled: true,
  toastNotifications: true,
  readReceipts: true,
  typingIndicator: true,
  lastSeenPrivacy: 'everyone',
  onlineStatusPrivacy: 'everyone'
};

const DEFAULT_CHAT_SETTINGS: ChatSettings = {
  pinnedChats: [],
  archivedChats: [],
  mutedChats: {},
  unreadOverrides: {},
  chatWallpapers: {},
  chatThemes: {},
  drafts: {}
};

export function getLocalAppSettings(): AppSettings {
  try {
    const raw = localStorage.getItem('appychat_app_settings');
    return raw ? { ...DEFAULT_APP_SETTINGS, ...JSON.parse(raw) } : DEFAULT_APP_SETTINGS;
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
}

export function saveLocalAppSettings(settings: Partial<AppSettings>): AppSettings {
  const updated = { ...getLocalAppSettings(), ...settings };
  try {
    localStorage.setItem('appychat_app_settings', JSON.stringify(updated));
  } catch {
    // ignore
  }
  return updated;
}

export function getLocalChatSettings(): ChatSettings {
  try {
    const raw = localStorage.getItem('appychat_chat_settings');
    return raw ? { ...DEFAULT_CHAT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_CHAT_SETTINGS;
  } catch {
    return DEFAULT_CHAT_SETTINGS;
  }
}

export function saveLocalChatSettings(settings: Partial<ChatSettings>): ChatSettings {
  const updated = { ...getLocalChatSettings(), ...settings };
  try {
    localStorage.setItem('appychat_chat_settings', JSON.stringify(updated));
  } catch {
    // ignore
  }
  return updated;
}

export function getLocalCategories(): ChatCategory[] {
  try {
    const raw = localStorage.getItem('appychat_custom_categories');
    return raw ? JSON.parse(raw) : [
      { id: 'cat_family', name: 'Family', isCustom: true, chatIds: [] },
      { id: 'cat_friends', name: 'Friends', isCustom: true, chatIds: [] },
      { id: 'cat_work', name: 'Work', isCustom: true, chatIds: [] },
      { id: 'cat_school', name: 'School', isCustom: true, chatIds: [] },
      { id: 'cat_important', name: 'Important', isCustom: true, chatIds: [] },
    ];
  } catch {
    return [];
  }
}

export function saveLocalCategories(categories: ChatCategory[]) {
  try {
    localStorage.setItem('appychat_custom_categories', JSON.stringify(categories));
  } catch {
    // ignore
  }
}
