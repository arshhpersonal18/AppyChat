import { UserProfile, FriendRequest, ChatMessage, CallData, CallLog } from '../types';
import { generateInitialsAvatar } from './avatar';

// Default initial demo network of users for instant out-of-the-box calling & chatting
const INITIAL_DEMO_USERS: UserProfile[] = [
  {
    uid: 'user_alex',
    name: 'Alex Rivera',
    bio: 'Software engineer & tech enthusiast. Always building cool web apps!',
    identifier: 'ar-1042',
    dpUrl: generateInitialsAvatar('Alex Rivera', 'ar-1042'),
    status: 'online',
    last_changed: Date.now()
  },
  {
    uid: 'user_sam',
    name: 'Sam Chen',
    bio: 'Product Designer | UI/UX & WebRTC explorer',
    identifier: 'ar-2088',
    dpUrl: generateInitialsAvatar('Sam Chen', 'ar-2088'),
    status: 'online',
    last_changed: Date.now() - 1000 * 60 * 5
  },
  {
    uid: 'user_maya',
    name: 'Maya Patel',
    bio: 'Coffee lover and digital nomad. Let’s connect on AppyChat!',
    identifier: 'ar-3150',
    dpUrl: generateInitialsAvatar('Maya Patel', 'ar-3150'),
    status: 'online',
    last_changed: Date.now() - 1000 * 60 * 12
  },
  {
    uid: 'user_david',
    name: 'David Kim',
    bio: 'Mobile dev & audio enthusiast',
    identifier: 'ar-4921',
    dpUrl: generateInitialsAvatar('David Kim', 'ar-4921'),
    status: 'away',
    last_changed: Date.now() - 1000 * 60 * 30
  }
];

class RealtimeStorageEngine {
  private channel: BroadcastChannel | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('appychat_realtime_bus');
        this.channel.onmessage = (event) => {
          const { eventType, payload } = event.data || {};
          if (eventType) {
            this.emit(eventType, payload);
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel initialization skipped:', err);
      }
    }
    this.bootstrapDefaults();
  }

  private bootstrapDefaults() {
    if (typeof window === 'undefined') return;

    // Load or initialize users
    const existingUsers = this.get<Record<string, UserProfile>>('appychat_users', {});
    if (Object.keys(existingUsers).length === 0) {
      const userMap: Record<string, UserProfile> = {};
      INITIAL_DEMO_USERS.forEach(u => {
        userMap[u.uid] = u;
      });
      this.set('appychat_users', userMap);
    }

    // Default contacts mapping
    const existingContacts = this.get<Record<string, Record<string, boolean>>>('appychat_contacts', {});
    if (Object.keys(existingContacts).length === 0) {
      this.set('appychat_contacts', {
        'user_alex': { 'user_sam': true, 'user_maya': true },
        'user_sam': { 'user_alex': true, 'user_maya': true },
        'user_maya': { 'user_alex': true, 'user_sam': true, 'user_david': true },
        'user_david': { 'user_maya': true }
      });
    }

    // Default messages
    const existingMessages = this.get<Record<string, Record<string, ChatMessage>>>('appychat_messages', {});
    if (Object.keys(existingMessages).length === 0) {
      const alexSamChat = this.getChatId('user_alex', 'user_sam');
      const alexMayaChat = this.getChatId('user_alex', 'user_maya');

      const now = Date.now();
      const messagesMap: Record<string, Record<string, ChatMessage>> = {
        [alexSamChat]: {
          'msg_1': {
            id: 'msg_1',
            from: 'user_sam',
            text: 'Hey Alex! Did you check out the new WebRTC audio calling feature?',
            timestamp: now - 1000 * 60 * 25
          },
          'msg_2': {
            id: 'msg_2',
            from: 'user_alex',
            text: 'Yes! The Tone.js ringtone and video preview work seamlessly.',
            timestamp: now - 1000 * 60 * 20
          },
          'msg_3': {
            id: 'msg_3',
            from: 'user_sam',
            text: 'Awesome! Tap the voice or video call icon above anytime to test calling.',
            timestamp: now - 1000 * 60 * 15
          }
        },
        [alexMayaChat]: {
          'msg_4': {
            id: 'msg_4',
            from: 'user_maya',
            text: 'Hello Alex! Welcome to AppyChat.',
            timestamp: now - 1000 * 60 * 60
          }
        }
      };
      this.set('appychat_messages', messagesMap);
    }

    // Default initial friend request for user_alex
    const existingRequests = this.get<Record<string, Record<string, FriendRequest>>>('appychat_requests', {});
    if (Object.keys(existingRequests).length === 0) {
      this.set('appychat_requests', {
        'user_alex': {
          'user_david': {
            id: 'req_david',
            senderUid: 'user_david',
            targetUid: 'user_alex',
            name: 'David Kim',
            identifier: 'ar-4921',
            dpUrl: generateInitialsAvatar('David Kim', 'ar-4921'),
            timestamp: Date.now() - 1000 * 60 * 45
          }
        }
      });
    }

    // Default call logs
    const existingLogs = this.get<Record<string, Record<string, CallLog>>>('appychat_call_logs', {});
    if (Object.keys(existingLogs).length === 0) {
      this.set('appychat_call_logs', {
        'user_alex': {
          'log_1': {
            id: 'log_1',
            type: 'video',
            duration: 184,
            timestamp: Date.now() - 1000 * 60 * 120,
            with: 'user_sam',
            withName: 'Sam Chen',
            withDpUrl: generateInitialsAvatar('Sam Chen', 'ar-2088'),
            isOutgoing: false
          },
          'log_2': {
            id: 'log_2',
            type: 'voice',
            duration: 45,
            timestamp: Date.now() - 1000 * 60 * 60 * 5,
            with: 'user_maya',
            withName: 'Maya Patel',
            withDpUrl: generateInitialsAvatar('Maya Patel', 'ar-3150'),
            isOutgoing: true
          }
        }
      });
    }
  }

  public getChatId(uid1: string, uid2: string): string {
    return [uid1, uid2].sort().join('_chat_');
  }

  // Generic storage helpers
  private get<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('Storage set failed', e);
    }
  }

  private emit(eventType: string, payload: any) {
    const subs = this.listeners.get(eventType);
    if (subs) {
      subs.forEach(cb => cb(payload));
    }
  }

  private broadcast(eventType: string, payload: any) {
    this.emit(eventType, payload);
    if (this.channel) {
      try {
        const safePayload = JSON.parse(JSON.stringify(payload));
        this.channel.postMessage({ eventType, payload: safePayload });
      } catch (e) {
        console.warn('BroadcastChannel postMessage failed:', e);
      }
    }
  }

  public subscribe(eventType: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    return () => {
      const subs = this.listeners.get(eventType);
      if (subs) {
        subs.delete(callback);
      }
    };
  }

  // User Management
  public getUser(uid: string): UserProfile | null {
    const users = this.get<Record<string, UserProfile>>('appychat_users', {});
    return users[uid] || null;
  }

  public getAllUsers(): UserProfile[] {
    const users = this.get<Record<string, UserProfile>>('appychat_users', {});
    return Object.values(users);
  }

  public saveUser(user: UserProfile): void {
    const users = this.get<Record<string, UserProfile>>('appychat_users', {});
    users[user.uid] = user;
    this.set('appychat_users', users);
    this.broadcast('users_updated', users);
    this.broadcast(`user_${user.uid}`, user);
  }

  public updateUserStatus(uid: string, status: 'online' | 'offline' | 'away'): void {
    const user = this.getUser(uid);
    if (user) {
      if (user.status === status) return;
      user.status = status;
      user.last_changed = Date.now();
      this.saveUser(user);
    }
  }

  public findUserByIdentifier(identifier: string): UserProfile | null {
    const clean = identifier.trim().toLowerCase();
    const users = this.getAllUsers();
    return users.find(u => u.identifier.toLowerCase() === clean) || null;
  }

  // Contacts
  public getContacts(uid: string): UserProfile[] {
    const allContacts = this.get<Record<string, Record<string, boolean>>>('appychat_contacts', {});
    const userContacts = allContacts[uid] || {};
    const users = this.get<Record<string, UserProfile>>('appychat_users', {});

    return Object.keys(userContacts)
      .filter(contactUid => userContacts[contactUid] && users[contactUid])
      .map(contactUid => users[contactUid])
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  public addContact(uid: string, contactUid: string): void {
    const allContacts = this.get<Record<string, Record<string, boolean>>>('appychat_contacts', {});
    if (!allContacts[uid]) allContacts[uid] = {};
    if (!allContacts[contactUid]) allContacts[contactUid] = {};

    allContacts[uid][contactUid] = true;
    allContacts[contactUid][uid] = true;

    this.set('appychat_contacts', allContacts);
    this.broadcast(`contacts_${uid}`, this.getContacts(uid));
    this.broadcast(`contacts_${contactUid}`, this.getContacts(contactUid));
  }

  // Friend Requests
  public getRequests(targetUid: string): FriendRequest[] {
    const allRequests = this.get<Record<string, Record<string, FriendRequest>>>('appychat_requests', {});
    const targetRequests = allRequests[targetUid] || {};
    return Object.values(targetRequests).sort((a, b) => b.timestamp - a.timestamp);
  }

  public sendFriendRequest(sender: UserProfile, targetUid: string): boolean {
    if (sender.uid === targetUid) return false;
    const allRequests = this.get<Record<string, Record<string, FriendRequest>>>('appychat_requests', {});
    if (!allRequests[targetUid]) allRequests[targetUid] = {};

    const req: FriendRequest = {
      id: `req_${Date.now()}`,
      senderUid: sender.uid,
      targetUid,
      name: sender.name,
      identifier: sender.identifier,
      dpUrl: sender.dpUrl,
      timestamp: Date.now()
    };

    allRequests[targetUid][sender.uid] = req;
    this.set('appychat_requests', allRequests);
    this.broadcast(`requests_${targetUid}`, this.getRequests(targetUid));
    return true;
  }

  public acceptFriendRequest(targetUid: string, senderUid: string): void {
    const allRequests = this.get<Record<string, Record<string, FriendRequest>>>('appychat_requests', {});
    if (allRequests[targetUid] && allRequests[targetUid][senderUid]) {
      delete allRequests[targetUid][senderUid];
      this.set('appychat_requests', allRequests);
    }
    this.addContact(targetUid, senderUid);
    this.broadcast(`requests_${targetUid}`, this.getRequests(targetUid));
  }

  public declineFriendRequest(targetUid: string, senderUid: string): void {
    const allRequests = this.get<Record<string, Record<string, FriendRequest>>>('appychat_requests', {});
    if (allRequests[targetUid] && allRequests[targetUid][senderUid]) {
      delete allRequests[targetUid][senderUid];
      this.set('appychat_requests', allRequests);
    }
    this.broadcast(`requests_${targetUid}`, this.getRequests(targetUid));
  }

  // Messages & Chats
  public getMessages(chatId: string, uid?: string): ChatMessage[] {
    const allMessages = this.get<Record<string, Record<string, ChatMessage>>>('appychat_messages', {});
    const chatMessages = allMessages[chatId] || {};
    let list = Object.values(chatMessages).sort((a, b) => a.timestamp - b.timestamp);

    // Filter by clearedAt if exists
    if (uid) {
      const userChats = this.get<Record<string, Record<string, { clearedAt: number }>>>('appychat_user_chats', {});
      const clearedAt = userChats[uid]?.[chatId]?.clearedAt;
      if (clearedAt) {
        list = list.filter(m => m.timestamp > clearedAt);
      }
    }
    return list;
  }

  public getLastMessage(chatId: string, uid?: string): ChatMessage | null {
    const msgs = this.getMessages(chatId, uid);
    return msgs.length > 0 ? msgs[msgs.length - 1] : null;
  }

  public sendMessage(chatId: string, senderUid: string, text: string, senderDpUrl?: string): ChatMessage {
    const allMessages = this.get<Record<string, Record<string, ChatMessage>>>('appychat_messages', {});
    if (!allMessages[chatId]) allMessages[chatId] = {};

    const msgId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newMsg: ChatMessage = {
      id: msgId,
      from: senderUid,
      text,
      timestamp: Date.now(),
      dpUrl: senderDpUrl
    };

    allMessages[chatId][msgId] = newMsg;
    this.set('appychat_messages', allMessages);

    // Update unread count for other participant
    const parts = chatId.split('_chat_');
    const recipientUid = parts.find(id => id !== senderUid);
    if (recipientUid) {
      this.incrementUnread(recipientUid, chatId);
    }

    this.broadcast(`messages_${chatId}`, newMsg);
    this.broadcast('messages_updated', { chatId, message: newMsg });
    return newMsg;
  }

  public clearChat(uid: string, chatId: string): void {
    const userChats = this.get<Record<string, Record<string, { clearedAt: number }>>>('appychat_user_chats', {});
    if (!userChats[uid]) userChats[uid] = {};
    userChats[uid][chatId] = { clearedAt: Date.now() };
    this.set('appychat_user_chats', userChats);
    this.broadcast(`messages_${chatId}`, { cleared: true, uid });
  }

  // Typing indicators
  private typingState: Record<string, Record<string, boolean>> = {};
  private typingTimeouts: Record<string, number> = {};

  public setTyping(chatId: string, uid: string, isTyping: boolean): void {
    if (!this.typingState[chatId]) this.typingState[chatId] = {};
    this.typingState[chatId][uid] = isTyping;

    const timeoutKey = `${chatId}_${uid}`;
    if (this.typingTimeouts[timeoutKey]) {
      clearTimeout(this.typingTimeouts[timeoutKey]);
      delete this.typingTimeouts[timeoutKey];
    }

    if (isTyping) {
      this.typingTimeouts[timeoutKey] = window.setTimeout(() => {
        this.setTyping(chatId, uid, false);
      }, 3000);
    }

    this.broadcast(`typing_${chatId}`, { ...this.typingState[chatId] });
  }

  // Unread counts
  public getUnreadCount(uid: string, chatId: string): number {
    const unread = this.get<Record<string, Record<string, number>>>('appychat_unread', {});
    return unread[uid]?.[chatId] || 0;
  }

  public incrementUnread(uid: string, chatId: string): void {
    const unread = this.get<Record<string, Record<string, number>>>('appychat_unread', {});
    if (!unread[uid]) unread[uid] = {};
    unread[uid][chatId] = (unread[uid][chatId] || 0) + 1;
    this.set('appychat_unread', unread);
    this.broadcast(`unread_${uid}`, unread[uid]);
  }

  public resetUnread(uid: string, chatId: string): void {
    const unread = this.get<Record<string, Record<string, number>>>('appychat_unread', {});
    if (unread[uid] && unread[uid][chatId]) {
      unread[uid][chatId] = 0;
      this.set('appychat_unread', unread);
      this.broadcast(`unread_${uid}`, unread[uid]);
    }
  }

  // WebRTC Call Signaling
  public getCall(callId: string): CallData | null {
    const calls = this.get<Record<string, CallData>>('appychat_calls', {});
    return calls[callId] || null;
  }

  public saveCall(call: CallData): void {
    const calls = this.get<Record<string, CallData>>('appychat_calls', {});
    calls[call.callId] = call;
    this.set('appychat_calls', calls);
    this.broadcast(`call_${call.callId}`, call);
    this.broadcast(`incoming_call_${call.to}`, call);
  }

  public addCallCandidate(callId: string, candidate: RTCIceCandidateInit): void {
    const call = this.getCall(callId);
    if (call) {
      if (!call.iceCandidates) call.iceCandidates = [];
      call.iceCandidates.push(candidate);
      this.saveCall(call);
      this.broadcast(`call_ice_${callId}`, candidate);
    }
  }

  // Call Logs
  public getCallLogs(uid: string): CallLog[] {
    const logs = this.get<Record<string, Record<string, CallLog>>>('appychat_call_logs', {});
    const userLogs = logs[uid] || {};
    return Object.values(userLogs).sort((a, b) => b.timestamp - a.timestamp);
  }

  public addCallLog(uid: string, log: Omit<CallLog, 'id'>): CallLog {
    const logs = this.get<Record<string, Record<string, CallLog>>>('appychat_call_logs', {});
    if (!logs[uid]) logs[uid] = {};

    const logId = `log_${Date.now()}`;
    const newLog: CallLog = {
      ...log,
      id: logId
    };

    logs[uid][logId] = newLog;
    this.set('appychat_call_logs', logs);
    this.broadcast(`call_logs_${uid}`, this.getCallLogs(uid));
    return newLog;
  }
}

export const realtimeStorage = new RealtimeStorageEngine();
