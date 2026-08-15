export interface UserProfile {
  uid: string;
  name: string;
  bio: string;
  identifier: string; // e.g. "ar-1042"
  dpUrl: string; // SVG Data URL or image link
  status: 'online' | 'offline' | 'away';
  last_changed: number;
  email?: string;
  blockedUids?: string[];
  lastSeen?: number;
  customStatus?: string;
  createdAt?: number;
}

export interface FriendRequest {
  id?: string;
  senderUid: string;
  targetUid: string;
  name: string;
  identifier: string;
  dpUrl: string;
  timestamp: number;
  status?: 'pending' | 'accepted' | 'declined';
}

export interface ReplyReference {
  id: string;
  senderUid: string;
  senderName: string;
  text: string;
  mediaType?: 'text' | 'image' | 'video' | 'voice' | 'doc' | 'location' | 'contact' | 'sticker' | 'gif';
  mediaUrl?: string;
}

export interface LinkPreview {
  url: string;
  title: string;
  description?: string;
  domain: string;
  image?: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

export interface SharedContact {
  uid: string;
  name: string;
  identifier: string;
  dpUrl: string;
  bio?: string;
}

export interface ChatMessage {
  id: string;
  from: string;
  senderName?: string;
  text: string;
  timestamp: number;
  dpUrl?: string;
  edited?: boolean;
  editedAt?: number;
  deletedForEveryone?: boolean;
  deletedForUids?: string[];
  replyTo?: ReplyReference;
  forwardFrom?: { senderName: string; originalChatTitle?: string };
  pinned?: boolean;
  starredUids?: string[];
  reactions?: Record<string, string[]>; // emoji -> array of UIDs
  mediaType?: 'text' | 'image' | 'video' | 'voice' | 'doc' | 'location' | 'contact' | 'sticker' | 'gif';
  mediaUrl?: string;
  mediaUrls?: string[];
  mediaInfo?: {
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    duration?: number;
    waveform?: number[];
    caption?: string;
  };
  location?: LocationData;
  sharedContact?: SharedContact;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  linkPreviews?: LinkPreview[];
  mentions?: string[]; // array of UIDs mentioned
}

export interface GroupMember {
  uid: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: number;
  name?: string;
  dpUrl?: string;
  identifier?: string;
}

export interface GroupChat {
  id: string;
  name: string;
  description?: string;
  avatarUrl: string;
  createdBy: string;
  createdAt: number;
  members: GroupMember[];
  inviteCode: string;
  pinnedMessageId?: string;
  announcement?: string;
  customTheme?: string;
  wallpaper?: string;
  lastMessage?: {
    text: string;
    senderName: string;
    timestamp: number;
  };
}

export interface ChatCategory {
  id: string;
  name: string;
  icon?: string;
  isCustom?: boolean;
  chatIds?: string[];
}

export interface ChatSettings {
  pinnedChats: string[];
  archivedChats: string[];
  mutedChats: Record<string, number>; // chatId -> mutedUntil timestamp (Infinity for forever)
  unreadOverrides: Record<string, boolean>; // chatId -> boolean
  chatWallpapers: Record<string, string>; // chatId -> wallpaper identifier/color
  chatThemes: Record<string, string>; // chatId -> theme identifier
  drafts: Record<string, string>; // chatId -> draft message text
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'amoled' | 'system';
  accentColor: string;
  wallpaper: string;
  bubbleStyle: 'modern' | 'minimal' | 'rounded';
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  toastNotifications: boolean;
  readReceipts: boolean;
  typingIndicator: boolean;
  lastSeenPrivacy: 'everyone' | 'contacts' | 'nobody';
  onlineStatusPrivacy: 'everyone' | 'contacts' | 'nobody';
}

export interface CallData {
  callId: string;
  type: 'voice' | 'video';
  from: string;
  to: string;
  callerName?: string;
  callerDpUrl?: string;
  calleeName?: string;
  calleeDpUrl?: string;
  status: 'ringing' | 'ongoing' | 'missed' | 'ended';
  offer?: RTCSessionDescriptionInit | null;
  answer?: RTCSessionDescriptionInit | null;
  iceCandidates?: RTCIceCandidateInit[];
  startTime?: number;
  endTime?: number;
}

export interface CallLog {
  id: string;
  type: 'voice' | 'video' | 'missed';
  duration: number; // in seconds
  timestamp: number;
  with: string; // other user UID
  withName: string;
  withDpUrl?: string;
  isOutgoing?: boolean;
}

export type NavigationTab = 'home' | 'requests' | 'calls' | 'settings' | 'contacts';

export interface ToastMessage {
  id: string;
  text: string;
  type?: 'info' | 'success' | 'error';
}

export interface SharedMediaItem {
  id: string;
  url: string;
  type: 'image' | 'video' | 'doc' | 'link';
  title?: string;
  timestamp: number;
  senderName: string;
  size?: number;
}
