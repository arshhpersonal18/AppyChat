export interface UserProfile {
  uid: string;
  name: string;
  bio: string;
  identifier: string; // e.g. "ar-1042"
  dpUrl: string; // SVG Data URL
  status: 'online' | 'offline' | 'away';
  last_changed: number;
}

export interface FriendRequest {
  id?: string;
  senderUid: string;
  targetUid: string;
  name: string;
  identifier: string;
  dpUrl: string;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  from: string;
  text: string;
  timestamp: number;
  dpUrl?: string;
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

export type NavigationTab = 'home' | 'requests' | 'calls';

export interface ToastMessage {
  id: string;
  text: string;
  type?: 'info' | 'success' | 'error';
}
