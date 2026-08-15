import React, { useState, useEffect, useCallback } from 'react';
import {
  UserProfile,
  FriendRequest,
  CallLog,
  NavigationTab,
  ToastMessage,
  CallData,
  GroupChat,
  ChatMessage,
  AppSettings,
  ChatSettings
} from './types';
import {
  subscribeAuthState,
  subscribeUserContacts,
  subscribeUserGroups,
  subscribeFriendRequests,
  subscribeCallLogs,
  subscribeIncomingCalls,
  subscribeChatMessages,
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
import { GroupCreateModal } from './components/GroupCreateModal';
import { SettingsModal } from './components/SettingsModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  accentColor: '#00A878',
  wallpaper: 'default',
  soundEnabled: true,
  vibrationEnabled: true,
  readReceipts: true,
  typingIndicator: true,
  lastSeenPrivacy: 'everyone',
  onlineStatusPrivacy: 'everyone',
  bubbleStyle: 'modern',
  toastNotifications: true
};

export default function App() {
  // Current user state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Navigation & Active Chat State
  const [currentTab, setCurrentTab] = useState<NavigationTab>('home');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeChatContact, setActiveChatContact] = useState<UserProfile | null>(null);
  const [activeChatGroup, setActiveChatGroup] = useState<GroupChat | null>(null);
  const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);

  // Real-time collections from Firestore
  const [contacts, setContacts] = useState<UserProfile[]>([]);
  const [groups, setGroups] = useState<GroupChat[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);

  // App Settings & Preferences
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('appychat_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [chatSettingsMap, setChatSettingsMap] = useState<Record<string, ChatSettings>>(() => {
    try {
      return JSON.parse(localStorage.getItem('appychat_chat_settings') || '{}');
    } catch {
      return {};
    }
  });

  // Search & Modals
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);

  // WebRTC Call states
  const [incomingCall, setIncomingCall] = useState<CallData | null>(null);
  const [activeCall, setActiveCall] = useState<CallData | null>(null);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((text: string, type: 'info' | 'success' | 'error' = 'info') => {
    if (!appSettings.toastNotifications) return;
    const id = `toast_${Date.now()}`;
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, [appSettings.toastNotifications]);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleUpdateAppSettings = (updates: Partial<AppSettings>) => {
    setAppSettings((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('appychat_settings', JSON.stringify(updated));
      return updated;
    });
  };

  const handleTogglePinChat = (chatId: string) => {
    setChatSettingsMap((prev) => {
      const current = prev[chatId] || {};
      const updated = {
        ...prev,
        [chatId]: { ...current, pinned: !current.pinned }
      };
      localStorage.setItem('appychat_chat_settings', JSON.stringify(updated));
      return updated;
    });
  };

  const handleToggleArchiveChat = (chatId: string) => {
    setChatSettingsMap((prev) => {
      const current = prev[chatId] || {};
      const updated = {
        ...prev,
        [chatId]: { ...current, archived: !current.archived }
      };
      localStorage.setItem('appychat_chat_settings', JSON.stringify(updated));
      return updated;
    });
  };

  const handleToggleMuteChat = (chatId: string, hours: number = 8) => {
    setChatSettingsMap((prev) => {
      const current = prev[chatId] || {};
      const isMuted = !!current.mutedUntil && current.mutedUntil > Date.now();
      const updated = {
        ...prev,
        [chatId]: {
          ...current,
          mutedUntil: isMuted ? 0 : Date.now() + hours * 3600 * 1000
        }
      };
      localStorage.setItem('appychat_chat_settings', JSON.stringify(updated));
      return updated;
    });
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
      setGroups([]);
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

    // Subscribe to Contacts
    const unsubContacts = subscribeUserContacts(uid, (userContacts) => {
      setContacts(userContacts);
    });

    // Subscribe to Groups
    const unsubGroups = subscribeUserGroups(uid, (userGroups) => {
      setGroups(userGroups);
    });

    // Subscribe to Friend Requests
    const unsubRequests = subscribeFriendRequests(uid, (newRequests) => {
      setRequests((prev) => {
        if (newRequests.length > prev.length) {
          showToast('New friend request received!', 'success');
        }
        return newRequests;
      });
    });

    // Subscribe to Call Logs
    const unsubLogs = subscribeCallLogs(uid, (logs) => {
      setCallLogs(logs);
    });

    // Subscribe to Incoming Calls
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
      unsubGroups();
      unsubRequests();
      unsubLogs();
      unsubIncomingCalls();
    };
  }, [currentUser, showToast]);

  // 3. Subscribe to active chat messages
  useEffect(() => {
    if (!activeChatId) {
      setCurrentMessages([]);
      return;
    }

    const unsubMessages = subscribeChatMessages(activeChatId, (msgs) => {
      setCurrentMessages(msgs);
    });

    return () => unsubMessages();
  }, [activeChatId]);

  // 4. WebRTC Call Manager state updates
  useEffect(() => {
    const unsub = webrtcManager.subscribeState((state) => {
      setActiveCall(state.call);
      if (!state.call) {
        setIncomingCall(null);
      }
    });
    return () => unsub();
  }, []);

  // 5. Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        if (isAddFriendOpen) setIsAddFriendOpen(false);
        else if (isProfileModalOpen) setIsProfileModalOpen(false);
        else if (isCreateGroupOpen) setIsCreateGroupOpen(false);
        else if (isSettingsOpen) setIsSettingsOpen(false);
        else if (isGlobalSearchOpen) setIsGlobalSearchOpen(false);
        else if (isSideMenuOpen) setIsSideMenuOpen(false);
        else if (activeChatId) {
          setActiveChatId(null);
          setActiveChatContact(null);
          setActiveChatGroup(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isAddFriendOpen,
    isProfileModalOpen,
    isCreateGroupOpen,
    isSettingsOpen,
    isGlobalSearchOpen,
    isSideMenuOpen,
    activeChatId
  ]);

  // Open Direct Chat with contact
  const handleSelectContact = (contact: UserProfile) => {
    if (!currentUser) return;
    const chatId = [currentUser.uid, contact.uid].sort().join('_');
    setActiveChatId(chatId);
    setActiveChatContact(contact);
    setActiveChatGroup(null);
  };

  // Open Group Chat
  const handleSelectGroup = (group: GroupChat) => {
    setActiveChatId(group.id);
    setActiveChatGroup(group);
    setActiveChatContact(null);
  };

  // Close active chat
  const handleCloseChat = () => {
    setActiveChatId(null);
    setActiveChatContact(null);
    setActiveChatGroup(null);
  };

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
    handleCloseChat();
    showToast('Signed out successfully');
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    showToast(`Welcome to AppyChat, ${user.name}!`, 'success');
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

  const getUserProfile = (uid: string): UserProfile | null => {
    if (currentUser && currentUser.uid === uid) return currentUser;
    return contacts.find((c) => c.uid === uid) || null;
  };

  return (
    <div className={`min-h-screen ${appSettings.theme === 'amoled' ? 'bg-black' : 'bg-[#0A0A0A]'} flex items-center justify-center font-['Poppins',sans-serif] text-[#FFFFFF] select-none p-0 sm:p-4`}>
      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Main Container */}
      <div
        id="app"
        className="w-full h-screen sm:h-[860px] sm:max-h-[96vh] sm:w-[440px] md:w-[480px] bg-[#121212] sm:rounded-3xl sm:border sm:border-[#2C2C2C] sm:shadow-[0_8px_40px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden relative"
      >
        {isAuthLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-3 border-[#00A878] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-[#A0A0A0]">Initializing AppyChat...</p>
          </div>
        ) : (
          <div id="main-app" className="w-full h-full flex flex-col overflow-hidden">
            {/* Top Header */}
            {!activeChatId && (
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
              {activeChatId && currentUser ? (
                <ChatView
                  chatId={activeChatId}
                  isGroup={!!activeChatGroup}
                  currentUser={currentUser}
                  activeContact={activeChatContact}
                  activeGroup={activeChatGroup}
                  messages={currentMessages}
                  contacts={contacts}
                  groups={groups}
                  onBack={handleCloseChat}
                  onStartCall={(type) => {
                    if (activeChatContact) {
                      handleInitiateCall(activeChatContact, type);
                    }
                  }}
                  onOpenProfile={(u) => {
                    console.log('Profile view:', u);
                  }}
                  bubbleStyle={appSettings.bubbleStyle}
                  onMuteChat={handleToggleMuteChat}
                  isMuted={
                    activeChatId
                      ? !!chatSettingsMap[activeChatId]?.mutedUntil &&
                        chatSettingsMap[activeChatId]!.mutedUntil! > Date.now()
                      : false
                  }
                />
              ) : (
                <>
                  {/* Home / Chats Tab */}
                  {currentTab === 'home' && currentUser && (
                    <section id="home-tab" className="h-full flex flex-col">
                      <ContactList
                        contacts={contacts}
                        groups={groups}
                        onSelectContact={handleSelectContact}
                        onSelectGroup={handleSelectGroup}
                        onOpenAddFriend={() => setIsAddFriendOpen(true)}
                        onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
                        currentUserId={currentUser.uid}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        showSearch={showSearch}
                        chatSettings={chatSettingsMap}
                        onTogglePinChat={handleTogglePinChat}
                        onToggleArchiveChat={handleToggleArchiveChat}
                        onToggleMuteChat={handleToggleMuteChat}
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

            {/* Bottom Navigation */}
            {!activeChatId && (
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
          onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenGlobalSearch={() => setIsGlobalSearchOpen(true)}
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

        {/* Create Group Modal */}
        {currentUser && (
          <GroupCreateModal
            isOpen={isCreateGroupOpen}
            onClose={() => setIsCreateGroupOpen(false)}
            currentUser={currentUser}
            contacts={contacts}
            onGroupCreated={(newGrp) => {
              handleSelectGroup(newGrp);
              showToast(`Group "${newGrp.name}" created!`, 'success');
            }}
          />
        )}

        {/* Settings Modal */}
        {currentUser && (
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            currentUser={currentUser}
            appSettings={appSettings}
            onUpdateAppSettings={handleUpdateAppSettings}
            onSignOut={handleLogout}
            allUsers={contacts}
          />
        )}

        {/* Global Search Modal */}
        {currentUser && (
          <GlobalSearchModal
            isOpen={isGlobalSearchOpen}
            onClose={() => setIsGlobalSearchOpen(false)}
            contacts={contacts}
            groups={groups}
            onSelectChat={(id, isGrp) => {
              if (isGrp) {
                const g = groups.find((grp) => grp.id === id);
                if (g) handleSelectGroup(g);
              } else {
                const c = contacts.find((cnt) => cnt.uid === id);
                if (c) handleSelectContact(c);
              }
            }}
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

        {/* Auth / Login Modal */}
        <AuthModal
          isOpen={!currentUser && !isAuthLoading}
          onLoginSuccess={handleLoginSuccess}
        />

        {/* WebRTC Calling Screens */}
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
