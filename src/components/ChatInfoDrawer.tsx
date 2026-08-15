import React, { useState } from 'react';
import { Icons } from '../services/icons';
import { UserProfile, GroupChat, GroupMember, ChatMessage } from '../types';
import {
  addGroupMember,
  removeGroupMember,
  updateMemberRole,
  leaveGroup,
  blockUser,
  unblockUser,
  reportContent,
  clearChatHistory
} from '../services/firebase';

interface ChatInfoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  isGroup: boolean;
  group?: GroupChat | null;
  contact?: UserProfile | null;
  currentUser: UserProfile;
  contacts: UserProfile[];
  messages: ChatMessage[];
  onOpenMediaViewer: (url: string, type: 'image' | 'video' | 'doc', title?: string) => void;
  onMuteToggle: (chatId: string, durationHours: number) => void;
  isMuted: boolean;
  onSetWallpaper: (wallpaperKey: string) => void;
  currentWallpaper?: string;
  onStartCall: (type: 'voice' | 'video') => void;
}

export const ChatInfoDrawer: React.FC<ChatInfoDrawerProps> = ({
  isOpen,
  onClose,
  chatId,
  isGroup,
  group,
  contact,
  currentUser,
  contacts,
  messages,
  onOpenMediaViewer,
  onMuteToggle,
  isMuted,
  onSetWallpaper,
  currentWallpaper = 'default',
  onStartCall
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'media' | 'links' | 'docs'>('info');
  const [inviteCopied, setInviteCopied] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [isBlocked, setIsBlocked] = useState(
    contact ? (currentUser.blockedUids || []).includes(contact.uid) : false
  );

  if (!isOpen) return null;

  const myRole = group?.members.find(m => m.uid === currentUser.uid)?.role || 'member';
  const isAdminOrOwner = myRole === 'owner' || myRole === 'admin';

  // Extract shared media items from messages
  const mediaItems = messages.filter(m => m.mediaType === 'image' || m.mediaType === 'video' || m.mediaType === 'sticker');
  const docItems = messages.filter(m => m.mediaType === 'doc');
  const linkItems = messages.filter(m => {
    const text = m.text || '';
    return text.includes('http://') || text.includes('https://') || (m.linkPreviews && m.linkPreviews.length > 0);
  });

  const handleCopyInvite = () => {
    if (!group?.inviteCode) return;
    navigator.clipboard.writeText(group.inviteCode);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  };

  const handleToggleBlock = async () => {
    if (!contact) return;
    if (isBlocked) {
      await unblockUser(currentUser.uid, contact.uid);
      setIsBlocked(false);
    } else {
      await blockUser(currentUser.uid, contact.uid);
      setIsBlocked(true);
    }
  };

  const handleSendReport = async () => {
    if (!reportReason.trim()) return;
    const targetId = isGroup ? group?.id || chatId : contact?.uid || chatId;
    await reportContent(currentUser.uid, targetId, reportReason.trim(), isGroup ? 'group' : 'user');
    setShowReportModal(false);
    setReportReason('');
  };

  const handleAddMemberToGroup = async (userProfile: UserProfile) => {
    if (!group) return;
    await addGroupMember(group.id, userProfile);
    setShowAddMember(false);
  };

  const wallpapers = [
    { id: 'default', name: 'Default Dark', bg: 'bg-slate-950' },
    { id: 'emerald', name: 'Emerald Glow', bg: 'bg-emerald-950/70' },
    { id: 'midnight', name: 'Midnight Blue', bg: 'bg-slate-900' },
    { id: 'royal', name: 'Royal Violet', bg: 'bg-purple-950/70' },
    { id: 'amoled', name: 'Pure Black', bg: 'bg-black' }
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-slate-900 border-l border-slate-800 text-slate-100 flex flex-col h-full shadow-2xl overflow-hidden animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
              aria-label="Close drawer"
            >
              <Icons.close className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-base text-white">
              {isGroup ? 'Group Information' : 'Contact Details'}
            </h3>
          </div>

          <div className="flex items-center gap-1">
            {!isGroup && contact && (
              <>
                <button
                  type="button"
                  onClick={() => onStartCall('voice')}
                  className="p-2 rounded-full hover:bg-slate-800 text-slate-300 hover:text-emerald-400 transition"
                  title="Voice Call"
                >
                  <Icons.phone className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => onStartCall('video')}
                  className="p-2 rounded-full hover:bg-slate-800 text-slate-300 hover:text-emerald-400 transition"
                  title="Video Call"
                >
                  <Icons.video className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Profile Card Header */}
        <div className="p-6 flex flex-col items-center text-center border-b border-slate-800/80 bg-slate-950/30">
          <img
            src={isGroup ? group?.avatarUrl : contact?.dpUrl}
            alt={isGroup ? group?.name : contact?.name}
            className="w-24 h-24 rounded-full object-cover shadow-xl border-4 border-slate-800 mb-3"
            referrerPolicy="no-referrer"
          />
          <h2 className="text-xl font-bold text-white tracking-tight">
            {isGroup ? group?.name : contact?.name}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            {isGroup
              ? `${group?.members.length || 0} members · Created ${group ? new Date(group.createdAt).toLocaleDateString() : ''}`
              : `@${contact?.identifier || 'user'} · ${contact?.bio || 'Hey there! I am using AppyChat.'}`}
          </p>

          {isGroup && group?.description && (
            <p className="text-xs text-slate-300 mt-2.5 p-2 bg-slate-800/60 rounded-xl border border-slate-700/50 w-full text-left">
              {group.description}
            </p>
          )}

          {isGroup && group?.inviteCode && (
            <div className="mt-3 flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
              <span className="text-xs font-mono text-emerald-400">
                Code: {group.inviteCode}
              </span>
              <button
                type="button"
                onClick={handleCopyInvite}
                className="text-xs font-semibold text-emerald-300 hover:text-white flex items-center gap-1 transition"
              >
                <Icons.copy className="w-3.5 h-3.5" />
                {inviteCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-3 text-center border-b-2 transition ${
              activeTab === 'info'
                ? 'border-emerald-500 text-emerald-400 bg-slate-800/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('media')}
            className={`flex-1 py-3 text-center border-b-2 transition ${
              activeTab === 'media'
                ? 'border-emerald-500 text-emerald-400 bg-slate-800/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Media ({mediaItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('links')}
            className={`flex-1 py-3 text-center border-b-2 transition ${
              activeTab === 'links'
                ? 'border-emerald-500 text-emerald-400 bg-slate-800/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Links ({linkItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('docs')}
            className={`flex-1 py-3 text-center border-b-2 transition ${
              activeTab === 'docs'
                ? 'border-emerald-500 text-emerald-400 bg-slate-800/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Docs ({docItems.length})
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          {activeTab === 'info' && (
            <div className="space-y-5">
              {/* Group Members List if group */}
              {isGroup && group && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Members ({group.members.length})
                    </h4>
                    {isAdminOrOwner && (
                      <button
                        type="button"
                        onClick={() => setShowAddMember(true)}
                        className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                      >
                        <Icons.add className="w-3.5 h-3.5" />
                        Add Member
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {group.members.map((m: GroupMember) => (
                      <div
                        key={m.uid}
                        className="flex items-center justify-between p-2 rounded-2xl bg-slate-800/50 border border-slate-700/40"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={m.dpUrl || 'https://via.placeholder.com/40'}
                            alt={m.name || 'Member'}
                            className="w-9 h-9 rounded-full object-cover shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-xs text-white truncate">
                                {m.name} {m.uid === currentUser.uid ? '(You)' : ''}
                              </span>
                              {m.role === 'owner' && (
                                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40">
                                  Owner
                                </span>
                              )}
                              {m.role === 'admin' && (
                                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                                  Admin
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400">@{m.identifier || 'user'}</span>
                          </div>
                        </div>

                        {/* Admin Action Menu */}
                        {isAdminOrOwner && m.uid !== currentUser.uid && m.role !== 'owner' && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => updateMemberRole(group.id, m.uid, m.role === 'admin' ? 'member' : 'admin')}
                              className="px-2 py-1 text-[10px] font-semibold bg-slate-700 hover:bg-slate-600 rounded-lg transition"
                            >
                              {m.role === 'admin' ? 'Demote' : 'Make Admin'}
                            </button>
                            <button
                              type="button"
                              onClick={() => removeGroupMember(group.id, m.uid)}
                              className="p-1 text-rose-400 hover:bg-rose-500/20 rounded-lg transition"
                              title="Remove member"
                            >
                              <Icons.trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Customization & Wallpaper */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Chat Wallpaper Theme
                </h4>
                <div className="grid grid-cols-5 gap-2">
                  {wallpapers.map(w => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => onSetWallpaper(w.id)}
                      className={`h-12 rounded-xl ${w.bg} border-2 flex items-center justify-center transition active:scale-95 ${
                        currentWallpaper === w.id ? 'border-emerald-500 shadow-md shadow-emerald-500/20 ring-2 ring-emerald-500/30' : 'border-slate-700 hover:border-slate-500'
                      }`}
                      title={w.name}
                    >
                      {currentWallpaper === w.id && <Icons.check className="w-4 h-4 text-emerald-400" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mute & Notifications */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Notifications
                </h4>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/50 border border-slate-700/40">
                  <div className="flex items-center gap-3">
                    <Icons.bell className="w-5 h-5 text-slate-400" />
                    <div>
                      <h5 className="font-semibold text-xs text-white">Mute Chat</h5>
                      <p className="text-[11px] text-slate-400">Silence notifications from this chat</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onMuteToggle(chatId, isMuted ? 0 : 8)}
                    className={`px-3 py-1 text-xs font-semibold rounded-xl transition ${
                      isMuted
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {isMuted ? 'Muted' : 'Active'}
                  </button>
                </div>
              </div>

              {/* Privacy & Safety Actions */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Privacy & Safety
                </h4>

                <button
                  type="button"
                  onClick={() => clearChatHistory(chatId)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-800/40 hover:bg-slate-800 text-slate-300 hover:text-white transition text-left text-xs font-medium"
                >
                  <Icons.refresh className="w-4 h-4 text-amber-400" />
                  Clear Chat History
                </button>

                {!isGroup && contact && (
                  <button
                    type="button"
                    onClick={handleToggleBlock}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-800/40 hover:bg-slate-800 text-slate-300 hover:text-rose-400 transition text-left text-xs font-medium"
                  >
                    <Icons.block className="w-4 h-4 text-rose-400" />
                    {isBlocked ? `Unblock ${contact.name}` : `Block ${contact.name}`}
                  </button>
                )}

                {isGroup && (
                  <button
                    type="button"
                    onClick={async () => {
                      await leaveGroup(group!.id, currentUser.uid);
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl bg-rose-950/30 hover:bg-rose-950/60 border border-rose-500/20 text-rose-300 transition text-left text-xs font-medium"
                  >
                    <Icons.logout className="w-4 h-4 text-rose-400" />
                    Exit & Leave Group
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowReportModal(true)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition text-left text-xs font-medium"
                >
                  <Icons.flag className="w-4 h-4" />
                  Report {isGroup ? 'Group' : 'Contact'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'media' && (
            <div>
              {mediaItems.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No shared photos or videos yet.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {mediaItems.map(m => (
                    <div
                      key={m.id}
                      onClick={() => onOpenMediaViewer(m.mediaUrl || '', m.mediaType === 'video' ? 'video' : 'image', m.senderName)}
                      className="relative aspect-square rounded-xl overflow-hidden bg-slate-800 cursor-pointer group"
                    >
                      <img
                        src={m.mediaUrl}
                        alt="Media"
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                        referrerPolicy="no-referrer"
                      />
                      {m.mediaType === 'video' && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Icons.play className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'links' && (
            <div className="space-y-2">
              {linkItems.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No links shared in this conversation.
                </div>
              ) : (
                linkItems.map(m => {
                  const urlMatch = m.text.match(/(https?:\/\/[^\s]+)/g);
                  const url = urlMatch ? urlMatch[0] : '#';
                  return (
                    <a
                      key={m.id}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/40 text-left transition group block"
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center shrink-0">
                        <Icons.link className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-semibold text-xs text-white group-hover:text-emerald-400 transition truncate">
                          {url}
                        </h5>
                        <p className="text-[11px] text-slate-400 truncate">
                          Shared by {m.senderName || 'Someone'} · {new Date(m.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </a>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="space-y-2">
              {docItems.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No documents shared in this conversation.
                </div>
              ) : (
                docItems.map(m => (
                  <div
                    key={m.id}
                    onClick={() => onOpenMediaViewer(m.mediaUrl || '', 'doc', m.mediaInfo?.fileName || 'Document')}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/40 cursor-pointer transition group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center text-emerald-400 shrink-0">
                        <Icons.fileDoc className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h5 className="font-semibold text-xs text-white group-hover:text-emerald-400 transition truncate">
                          {m.mediaInfo?.fileName || 'Document File'}
                        </h5>
                        <span className="text-[10px] text-slate-400">
                          {m.mediaInfo?.fileSize ? `${Math.round(m.mediaInfo.fileSize / 1024)} KB` : 'Document'} · {new Date(m.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg"
                      title="Download"
                    >
                      <Icons.download className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Add Member Sub-Modal */}
        {showAddMember && isGroup && group && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-white">Add Member to Group</h4>
                <button
                  type="button"
                  onClick={() => setShowAddMember(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <Icons.close className="w-4 h-4" />
                </button>
              </div>

              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search contacts..."
                className="w-full px-3 py-2 bg-slate-800 rounded-xl text-xs text-white outline-none border border-slate-700"
              />

              <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar">
                {contacts
                  .filter(c => !group.members.some(m => m.uid === c.uid))
                  .filter(c => c.name.toLowerCase().includes(memberSearch.toLowerCase()))
                  .map(c => (
                    <button
                      key={c.uid}
                      type="button"
                      onClick={() => handleAddMemberToGroup(c)}
                      className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-800 transition text-left"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img src={c.dpUrl} alt={c.name} className="w-8 h-8 rounded-full object-cover" />
                        <span className="font-medium text-xs text-white truncate">{c.name}</span>
                      </div>
                      <span className="text-xs font-semibold text-emerald-400">Add</span>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Report Modal */}
        {showReportModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 text-slate-100">
              <h4 className="font-bold text-sm text-white">Submit Report</h4>
              <p className="text-xs text-slate-400">
                Please describe the issue or reason for reporting this conversation/user.
              </p>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Spam, harassment, inappropriate content..."
                className="w-full h-24 p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-rose-500"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendReport}
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-xl transition"
                >
                  Submit Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
