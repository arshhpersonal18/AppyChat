import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, FriendRequest, CallLog, NavigationTab, ToastMessage, CallData } from './types';
import {
  subscribeAuthState,
  subscribeUserContacts,
  subscribeFriendRequests,
  subscribeCallLogs,
  subscribeIncomingCalls,
  acceptFriendRequest,
  declineFriendRequest,
  updateUserProfile,
  updateUserPresence,
  signOutUser
} from './services/firebase';
import { webrtcManager } from './services/webrtc';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { SideMenu } from './components/SideMenu';
import { ContactList } from './components/ContactList';
import { RequestsList } from './components/RequestsList';
import { CallLogsList } from './components/CallLogsList';
import { ChatView } from './components/ChatView';
import { CallModal } from './components/CallModal';
import { AddFriendModal } from './components/AddFriendModal';
import { ProfileModal } from './components/ProfileModal';
import { AuthModal } from './components/AuthModal';
import { Toast } from './components/Toast';

export default function App() {
  // Current user state (from Firebase Auth)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [currentTab, setCurrentTab] = useState<NavigationTab>('home');
  const [activeChatContact, setActiveChatContact] = useState<UserProfile | null>(null);

  // Real-time Data lists from Firestore
  const [contacts, setContacts] = useState<UserProfile[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);

  // Search & Navigation states
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Panels
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // WebRTC Call states
  const [incomingCall, setIncomingCall] = useState<CallData | null>(null);
  const [activeCall, setActiveCall] = useState<CallData | null>(null);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((text: string, type: 'info' | 'success' | 'error' = 'info') => {
    const id = `toast_${Date.now()}`;
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 1. Listen for Firebase Auth State
  useEffect(() => {
    const unsubAuth = subscribeAuthState((user, loading) => {
      setCurrentUser(user);
      setIsAuthLoading(loading);
      if (user) {
        updateUserPresence(user.uid, 'online');
      }
    });

    return () => unsubAuth();
  }, []);

  // 2. Real-time subscriptions when user is authenticated
  useEffect(() => {
    if (!currentUser) {
      setContacts([]);
      setRequests([]);
      setCallLogs([]);
      setIncomingCall(null);
      return;
    }

    const uid = currentUser.uid;

    const handleBeforeUnload = () => {
      updateUserPresence(uid, 'offline');
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Subscribe to Firestore Contacts
    const unsubContacts = subscribeUserContacts(uid, (userContacts) => {
      setContacts(userContacts);
    });

    // Subscribe to Firestore Friend Requests
    const unsubRequests = subscribeFriendRequests(uid, (newRequests) => {
      setRequests((prev) => {
        if (newRequests.length > prev.length) {
          showToast('New friend request received!', 'success');
        }
        return newRequests;
      });
    });

    // Subscribe to Firestore Call Logs
    const unsubLogs = subscribeCallLogs(uid, (logs) => {
      setCallLogs(logs);
    });

    // Subscribe to Firestore Incoming Calls
    const unsubIncomingCalls = subscribeIncomingCalls(uid, (call) => {
      if (call && call.status === 'ringing' && call.from !== uid) {
        setIncomingCall(call);
      } else {
        setIncomingCall(null);
      }
    });

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      unsubContacts();
      unsubRequests();
      unsubLogs();
      unsubIncomingCalls();
    };
  }, [currentUser, showToast]);

  // 3. Handle WebRTC Call Manager state updates
  useEffect(() => {
    const unsub = webrtcManager.subscribeState((state) => {
      setActiveCall(state.call);
      if (!state.call) {
        setIncomingCall(null);
      }
    });
    return () => unsub();
  }, []);

  // 4. Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowSearch((prev) => !prev);
      } else if (e.key === 'Escape') {
        if (isAddFriendOpen) setIsAddFriendOpen(false);
        else if (isProfileModalOpen) setIsProfileModalOpen(false);
        else if (isSideMenuOpen) setIsSideMenuOpen(false);
        else if (activeChatContact) setActiveChatContact(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAddFriendOpen, isProfileModalOpen, isSideMenuOpen, activeChatContact]);

  // Initiate Voice or Video call
  const handleInitiateCall = async (targetContact: UserProfile, type: 'voice' | 'video') => {
    if (!currentUser) return;
    try {
      showToast(`Calling ${targetContact.name}...`);
      await webrtcManager.startCall(currentUser, targetContact, type);
      setActiveCall(webrtcManager.activeCall);
    } catch (err) {
      console.error('Call initiation failed', err);
      showToast('Could not start call.', 'error');
    }
  };

  // Answer incoming call
  const handleAnswerCall = async (call: CallData) => {
    if (!currentUser) return;
    try {
      await webrtcManager.answerCall(call, currentUser);
      setIncomingCall(null);
      setActiveCall(webrtcManager.activeCall);
    } catch (err) {
      console.error('Answer call failed', err);
      showToast('Could not answer call.', 'error');
    }
  };

  // Decline incoming call
  const handleDeclineCall = (call: CallData) => {
    if (!currentUser) return;
    webrtcManager.declineCall(call, currentUser);
    setIncomingCall(null);
  };

  // End active call
  const handleEndCall = () => {
    if (currentUser) {
      webrtcManager.endCall(currentUser.uid);
    } else {
      webrtcManager.endCall();
    }
    setActiveCall(null);
    setIncomingCall(null);
  };

  // Friend Request Actions
  const handleAcceptRequest = async (senderUid: string) => {
    if (!currentUser) return;
    const req = requests.find((r) => r.senderUid === senderUid);
    const requestId = req?.id || senderUid;
    try {
      await acceptFriendRequest(requestId, currentUser, senderUid);
      showToast('Friend request accepted!', 'success');
    } catch (err) {
      console.error('Accept request failed', err);
      showToast('Could not accept friend request.', 'error');
    }
  };

  const handleDeclineRequest = async (senderUid: string) => {
    if (!currentUser) return;
    const req = requests.find((r) => r.senderUid === senderUid);
    const requestId = req?.id || senderUid;
    try {
      await declineFriendRequest(requestId);
      showToast('Friend request declined.');
    } catch (err) {
      console.error('Decline request failed', err);
    }
  };

  // Logout
  const handleLogout = async () => {
    if (currentUser) {
      await signOutUser(currentUser.uid);
    } else {
      await signOutUser();
    }
    setCurrentUser(null);
    setActiveChatContact(null);
    showToast('Signed out successfully');
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    showToast(`Welcome, ${user.name}!`, 'success');
  };

  const handleSaveProfile = async (updated: UserProfile) => {
    try {
      await updateUserProfile(updated);
      setCurrentUser(updated);
      showToast('Profile updated!', 'success');
    } catch (err) {
      console.error('Update profile error', err);
      showToast('Could not update profile.', 'error');
    }
  };

  // Helper to lookup contact info from uid
  const getUserProfile = (uid: string): UserProfile | null => {
    if (currentUser && currentUser.uid === uid) return currentUser;
    return contacts.find((c) => c.uid === uid) || null;
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center font-['Poppins',sans-serif] text-[#FFFFFF] select-none">
      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Main App Container */}
      <div
        id="app"
        className="w-full h-screen sm:h-[840px] sm:max-h-[95vh] sm:w-[420px] bg-[#121212] sm:rounded-3xl sm:border sm:border-[#2C2C2C] sm:shadow-[0_4px_30px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden relative"
      >
        {isAuthLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-3 border-[#00A878] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-[#A0A0A0]">Loading AppyChat...</p>
          </div>
        ) : (
          <div id="main-app" className="w-full h-full flex flex-col overflow-hidden">
            {/* Top Header (shown unless inside active chat) */}
            {!activeChatContact && (
              <Header
                currentUser={currentUser}
                onOpenMenu={() => setIsSideMenuOpen(true)}
                showSearch={showSearch}
                onToggleSearch={() => setShowSearch((prev) => !prev)}
                title="AppyChat"
              />
            )}

            {/* Main Content Area */}
            <main id="content-area" className="flex-1 overflow-hidden relative flex flex-col">
              {activeChatContact && currentUser ? (
                <ChatView
                  contact={activeChatContact}
                  currentUser={currentUser}
                  onBack={() => setActiveChatContact(null)}
                  onInitiateCall={handleInitiateCall}
                  onShowToast={showToast}
                />
              ) : (
                <>
                  {/* Home / Chats Tab */}
                  {currentTab === 'home' && currentUser && (
                    <section id="home-tab" className="h-full flex flex-col">
                      <ContactList
                        contacts={contacts}
                        onSelectContact={(c) => setActiveChatContact(c)}
                        onOpenAddFriend={() => setIsAddFriendOpen(true)}
                        currentUserId={currentUser.uid}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        showSearch={showSearch}
                      />
                    </section>
                  )}

                  {/* Requests Tab */}
                  {currentTab === 'requests' && (
                    <section id="requests-tab" className="h-full flex flex-col">
                      <RequestsList
                        requests={requests}
                        onAccept={handleAcceptRequest}
                        onDecline={handleDeclineRequest}
                        onOpenAddFriend={() => setIsAddFriendOpen(true)}
                      />
                    </section>
                  )}

                  {/* Calls Tab */}
                  {currentTab === 'calls' && (
                    <section id="calls-tab" className="h-full flex flex-col">
                      <CallLogsList
                        logs={callLogs}
                        onInitiateCall={handleInitiateCall}
                        getUserProfile={getUserProfile}
                      />
                    </section>
                  )}
                </>
              )}
            </main>

            {/* Bottom Navigation (shown when not in active chat view) */}
            {!activeChatContact && (
              <BottomNav
                currentTab={currentTab}
                onTabChange={(tab) => {
                  setCurrentTab(tab);
                  setShowSearch(false);
                  setSearchQuery('');
                }}
                requestCount={requests.length}
                unreadCountTotal={0}
              />
            )}
          </div>
        )}

        {/* Side Menu Drawer */}
        <SideMenu
          isOpen={isSideMenuOpen}
          onClose={() => setIsSideMenuOpen(false)}
          currentUser={currentUser}
          onOpenEditProfile={() => setIsProfileModalOpen(true)}
          onOpenAddFriend={() => setIsAddFriendOpen(true)}
          onLogout={handleLogout}
        />

        {/* Add Friend Modal */}
        {currentUser && (
          <AddFriendModal
            isOpen={isAddFriendOpen}
            onClose={() => setIsAddFriendOpen(false)}
            currentUser={currentUser}
            contacts={contacts}
            onShowToast={showToast}
          />
        )}

        {/* Edit Profile Modal */}
        {currentUser && (
          <ProfileModal
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            currentUser={currentUser}
            onSave={handleSaveProfile}
            onShowToast={showToast}
          />
        )}

        {/* Auth / Login Modal (Mandatory when not authenticated) */}
        <AuthModal
          isOpen={!currentUser && !isAuthLoading}
          onLoginSuccess={handleLoginSuccess}
        />

        {/* WebRTC Calling Screens (Incoming prompt & Fullscreen Active Call UI) */}
        {currentUser && (
          <CallModal
            incomingCall={incomingCall}
            activeCall={activeCall}
            currentUser={currentUser}
            onAnswerCall={handleAnswerCall}
            onDeclineCall={handleDeclineCall}
            onEndCall={handleEndCall}
          />
        )}
      </div>
    </div>
  );
}
