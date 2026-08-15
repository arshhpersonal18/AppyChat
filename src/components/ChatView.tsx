import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../services/icons';
import {
  UserProfile,
  ChatMessage,
  GroupChat,
  ReplyReference,
  LocationData,
  SharedContact,
  LinkPreview
} from '../types';
import {
  sendChatMessage,
  editChatMessage,
  deleteMessageForEveryone,
  deleteMessageForMe,
  toggleMessageReaction,
  togglePinMessage,
  toggleStarMessage,
  setTypingStatus,
  subscribeTyping
} from '../services/firebase';
import { AudioVoicePlayer } from './AudioVoicePlayer';
import { VoiceRecorderBar } from './VoiceRecorderBar';
import { EmojiStickerPicker } from './EmojiStickerPicker';
import { LocationPickerModal } from './LocationPickerModal';
import { ContactShareModal } from './ContactShareModal';
import { ForwardMessageModal } from './ForwardMessageModal';
import { MediaViewerModal } from './MediaViewerModal';
import { ChatInfoDrawer } from './ChatInfoDrawer';

interface ChatViewProps {
  chatId: string;
  isGroup: boolean;
  currentUser: UserProfile;
  activeContact?: UserProfile | null;
  activeGroup?: GroupChat | null;
  messages: ChatMessage[];
  contacts: UserProfile[];
  groups: GroupChat[];
  onBack: () => void;
  onStartCall: (type: 'voice' | 'video') => void;
  onOpenProfile: (user: UserProfile) => void;
  bubbleStyle?: 'modern' | 'minimal' | 'rounded';
  wallpaper?: string;
  onMuteChat: (chatId: string, hours: number) => void;
  isMuted?: boolean;
}

export const ChatView: React.FC<ChatViewProps> = ({
  chatId,
  isGroup,
  currentUser,
  activeContact,
  activeGroup,
  messages,
  contacts,
  groups,
  onBack,
  onStartCall,
  onOpenProfile,
  bubbleStyle = 'modern',
  wallpaper = 'default',
  onMuteChat,
  isMuted = false
}) => {
  // Input State
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<ReplyReference | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);

  // Modals & Panels
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardTargetMessage, setForwardTargetMessage] = useState<ChatMessage | null>(null);
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

  // Media Viewer state
  const [mediaViewerData, setMediaViewerData] = useState<{
    isOpen: boolean;
    url: string;
    type: 'image' | 'video' | 'doc';
    senderName?: string;
    caption?: string;
    fileName?: string;
  }>({
    isOpen: false,
    url: '',
    type: 'image'
  });

  // Multi-Select Mode
  const [isMultiSelecting, setIsMultiSelecting] = useState(false);
  const [selectedMsgIds, setSelectedMsgIds] = useState<string[]>([]);

  // Search inside this chat
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');

  // Typing state
  const [typingUsers, setTypingUsers] = useState<Record<string, { isTyping: boolean; name?: string }>>({});
  const typingTimeoutRef = useRef<number | null>(null);

  // Auto-scroll references
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);

  // Wallpaper state with local persistence
  const [currentWallpaper, setCurrentWallpaper] = useState<string>(() => {
    try {
      const custom = localStorage.getItem(`appychat_wallpaper_${chatId}`);
      return custom || wallpaper || 'default';
    } catch {
      return wallpaper || 'default';
    }
  });

  const handleSetWallpaper = (wp: string) => {
    setCurrentWallpaper(wp);
    try {
      localStorage.setItem(`appychat_wallpaper_${chatId}`, wp);
    } catch {}
  };

  // Load draft message on mount
  useEffect(() => {
    try {
      const drafts = JSON.parse(localStorage.getItem('appychat_chat_drafts') || '{}');
      if (drafts[chatId]) {
        setInputText(drafts[chatId]);
      } else {
        setInputText('');
      }
    } catch {
      // ignore
    }
  }, [chatId]);

  // Save draft on change
  const handleInputChange = (text: string) => {
    setInputText(text);
    try {
      const drafts = JSON.parse(localStorage.getItem('appychat_chat_drafts') || '{}');
      if (text.trim()) {
        drafts[chatId] = text;
      } else {
        delete drafts[chatId];
      }
      localStorage.setItem('appychat_chat_drafts', JSON.stringify(drafts));
    } catch {
      // ignore
    }

    // Typing heartbeat
    setTypingStatus(chatId, currentUser.uid, true, currentUser.name);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = window.setTimeout(() => {
      setTypingStatus(chatId, currentUser.uid, false);
    }, 3000);
  };

  // Subscribe to typing indicators
  useEffect(() => {
    const unsub = subscribeTyping(chatId, (map) => {
      setTypingUsers(map);
    });
    return () => {
      unsub();
      setTypingStatus(chatId, currentUser.uid, false);
    };
  }, [chatId, currentUser.uid]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (!showJumpToBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showJumpToBottom]);

  // Detect scroll position for jump-to-bottom button
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const isFarFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight > 250;
    setShowJumpToBottom(isFarFromBottom);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowJumpToBottom(false);
  };

  // Pinned Message in current chat
  const pinnedMessage = messages.find(m => m.pinned);

  // Link detection helper
  const detectLinkPreviews = (text: string): LinkPreview[] => {
    const urls = text.match(/(https?:\/\/[^\s]+)/g);
    if (!urls) return [];
    return urls.slice(0, 1).map(url => {
      let domain = '';
      try {
        domain = new URL(url).hostname;
      } catch {
        domain = 'link';
      }
      return {
        url,
        title: domain.toUpperCase(),
        description: url,
        domain
      };
    });
  };

  // Send text message
  const handleSendMessage = async () => {
    if (!inputText.trim() && !editingMessage) return;

    if (editingMessage) {
      await editChatMessage(chatId, editingMessage.id, inputText.trim());
      setEditingMessage(null);
      setInputText('');
      return;
    }

    const textToSend = inputText.trim();
    const linkPreviews = detectLinkPreviews(textToSend);

    const extra: Partial<ChatMessage> = {
      senderName: currentUser.name,
      replyTo: replyingTo || undefined,
      linkPreviews: linkPreviews.length > 0 ? linkPreviews : undefined,
      mediaType: 'text'
    };

    setInputText('');
    setReplyingTo(null);
    setShowEmojiPicker(false);
    setShowAttachmentMenu(false);

    try {
      // Clear draft
      const drafts = JSON.parse(localStorage.getItem('appychat_chat_drafts') || '{}');
      delete drafts[chatId];
      localStorage.setItem('appychat_chat_drafts', JSON.stringify(drafts));

      await sendChatMessage(chatId, currentUser.uid, textToSend, currentUser.dpUrl, extra);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // Send Voice note
  const handleSendVoice = async (audioUrl: string, durationSec: number, waveform: number[]) => {
    setIsRecordingVoice(false);
    await sendChatMessage(chatId, currentUser.uid, '', currentUser.dpUrl, {
      senderName: currentUser.name,
      mediaType: 'voice',
      mediaUrl: audioUrl,
      mediaInfo: {
        duration: durationSec,
        waveform
      },
      replyTo: replyingTo || undefined
    });
    setReplyingTo(null);
  };

  // Send Image/Video
  const handleSendMediaFile = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'doc') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      await sendChatMessage(chatId, currentUser.uid, '', currentUser.dpUrl, {
        senderName: currentUser.name,
        mediaType: type,
        mediaUrl: dataUrl,
        mediaInfo: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        },
        replyTo: replyingTo || undefined
      });
      setShowAttachmentMenu(false);
      setReplyingTo(null);
    };
    reader.readAsDataURL(file);
  };

  // Send Location
  const handleSendLocation = async (location: LocationData) => {
    await sendChatMessage(chatId, currentUser.uid, `📍 Location: ${location.name || 'Shared Location'}`, currentUser.dpUrl, {
      senderName: currentUser.name,
      mediaType: 'location',
      location,
      replyTo: replyingTo || undefined
    });
    setShowLocationPicker(false);
    setReplyingTo(null);
  };

  // Send Contact
  const handleSendContact = async (contact: SharedContact) => {
    await sendChatMessage(chatId, currentUser.uid, `👤 Contact: ${contact.name}`, currentUser.dpUrl, {
      senderName: currentUser.name,
      mediaType: 'contact',
      sharedContact: contact,
      replyTo: replyingTo || undefined
    });
    setShowContactPicker(false);
    setReplyingTo(null);
  };

  // Send Sticker / GIF
  const handleSendStickerOrGif = async (url: string, type: 'sticker' | 'gif') => {
    await sendChatMessage(chatId, currentUser.uid, '', currentUser.dpUrl, {
      senderName: currentUser.name,
      mediaType: type,
      mediaUrl: url,
      replyTo: replyingTo || undefined
    });
    setShowEmojiPicker(false);
    setReplyingTo(null);
  };

  // Message Action Context Handlers
  const handleReplyMessage = (msg: ChatMessage) => {
    setReplyingTo({
      id: msg.id,
      senderUid: msg.from,
      senderName: msg.senderName || (msg.from === currentUser.uid ? 'You' : 'Someone'),
      text: msg.text || `[${msg.mediaType || 'Media'}]`,
      mediaType: msg.mediaType,
      mediaUrl: msg.mediaUrl
    });
  };

  const handleEditMessage = (msg: ChatMessage) => {
    setEditingMessage(msg);
    setInputText(msg.text);
  };

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleToggleStar = async (msg: ChatMessage) => {
    await toggleStarMessage(chatId, msg.id, currentUser.uid);
  };

  const handleTogglePin = async (msg: ChatMessage) => {
    await togglePinMessage(chatId, msg.id, !msg.pinned);
  };

  const handleReaction = async (msg: ChatMessage, emoji: string) => {
    await toggleMessageReaction(chatId, msg.id, emoji, currentUser.uid);
  };

  const handleForward = (msg: ChatMessage) => {
    setForwardTargetMessage(msg);
    setShowForwardModal(true);
  };

  const handleBulkDelete = async () => {
    for (const id of selectedMsgIds) {
      await deleteMessageForMe(chatId, id, currentUser.uid);
    }
    setIsMultiSelecting(false);
    setSelectedMsgIds([]);
  };

  // Filter messages based on chat search query and deleted status
  const visibleMessages = messages
    .filter(m => !(m.deletedForUids || []).includes(currentUser.uid))
    .filter(m => !chatSearchQuery || m.text.toLowerCase().includes(chatSearchQuery.toLowerCase()));

  // Active typers in this chat
  const otherTypers = Object.entries(typingUsers)
    .filter(([uid, data]) => uid !== currentUser.uid && (data as any)?.isTyping)
    .map(([, data]) => (data as any)?.name || 'Someone');

  // Bubble style classes
  const getBubbleRadius = (isMe: boolean) => {
    if (bubbleStyle === 'minimal') return 'rounded-lg';
    if (bubbleStyle === 'rounded') return 'rounded-3xl';
    return isMe ? 'rounded-2xl rounded-tr-xs' : 'rounded-2xl rounded-tl-xs';
  };

  // Wallpaper backgrounds
  const wallpaperBg = {
    default: 'bg-slate-950',
    emerald: 'bg-gradient-to-b from-slate-950 via-emerald-950/40 to-slate-950',
    midnight: 'bg-slate-900',
    royal: 'bg-gradient-to-b from-slate-950 via-purple-950/40 to-slate-950',
    amoled: 'bg-black'
  }[currentWallpaper] || 'bg-slate-950';

  return (
    <div className={`flex flex-col h-full ${wallpaperBg} text-slate-100 relative overflow-hidden select-text`}>
      {/* Top Header */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md z-30 shrink-0 shadow-sm">
        {/* Left: Back & Avatar & Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition active:scale-95"
            aria-label="Back to chat list"
          >
            <Icons.back className="w-5 h-5" />
          </button>

          <div
            onClick={() => setShowInfoDrawer(true)}
            className="flex items-center gap-2.5 cursor-pointer group min-w-0"
          >
            <div className="relative shrink-0">
              <img
                src={isGroup ? activeGroup?.avatarUrl : activeContact?.dpUrl}
                alt={isGroup ? activeGroup?.name : activeContact?.name}
                className="w-10 h-10 rounded-full object-cover border border-slate-700 shadow"
                referrerPolicy="no-referrer"
              />
              {!isGroup && activeContact?.status === 'online' && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" />
              )}
            </div>

            <div className="min-w-0">
              <h3 className="font-bold text-sm text-white group-hover:text-emerald-400 transition truncate leading-tight">
                {isGroup ? activeGroup?.name : activeContact?.name}
              </h3>
              <p className="text-[11px] text-slate-400 truncate leading-tight">
                {otherTypers.length > 0 ? (
                  <span className="text-emerald-400 font-medium animate-pulse">
                    {otherTypers.join(', ')} is typing...
                  </span>
                ) : isGroup ? (
                  `${activeGroup?.members.length || 0} members`
                ) : activeContact?.status === 'online' ? (
                  <span className="text-emerald-400 font-medium">Online</span>
                ) : (
                  `Offline · @${activeContact?.identifier || 'user'}`
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-1">
          {!isGroup && activeContact && (
            <>
              <button
                type="button"
                onClick={() => onStartCall('voice')}
                className="p-2 rounded-full hover:bg-slate-800 text-slate-300 hover:text-emerald-400 transition active:scale-95"
                title="Start Voice Call"
              >
                <Icons.phone className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => onStartCall('video')}
                className="p-2 rounded-full hover:bg-slate-800 text-slate-300 hover:text-emerald-400 transition active:scale-95"
                title="Start Video Call"
              >
                <Icons.video className="w-5 h-5" />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setShowChatSearch(!showChatSearch)}
            className={`p-2 rounded-full transition active:scale-95 ${
              showChatSearch ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-slate-800 text-slate-300 hover:text-white'
            }`}
            title="Search inside this chat"
          >
            <Icons.search className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setShowInfoDrawer(true)}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white transition active:scale-95"
            title="Conversation Info"
          >
            <Icons.dotsVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* In-Chat Search Bar */}
      {showChatSearch && (
        <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center gap-2 animate-in fade-in z-20">
          <Icons.search className="w-4 h-4 text-emerald-400 shrink-0" />
          <input
            type="text"
            value={chatSearchQuery}
            onChange={(e) => setChatSearchQuery(e.target.value)}
            placeholder="Search within this conversation..."
            className="w-full bg-transparent text-xs text-white outline-none placeholder-slate-500"
            autoFocus
          />
          {chatSearchQuery && (
            <button
              type="button"
              onClick={() => setChatSearchQuery('')}
              className="text-slate-400 hover:text-white"
            >
              <Icons.close className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Pinned Message Banner */}
      {pinnedMessage && (
        <div className="px-4 py-2 bg-emerald-950/80 border-b border-emerald-500/30 flex items-center justify-between text-xs z-10 backdrop-blur-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Icons.pin className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <span className="font-bold text-emerald-300">Pinned Message: </span>
              <span className="text-slate-200 truncate">
                {pinnedMessage.text || `[${pinnedMessage.mediaType || 'Media'}]`}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleTogglePin(pinnedMessage)}
            className="text-slate-400 hover:text-white shrink-0 ml-2"
            title="Unpin message"
          >
            <Icons.close className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Multi-select Action Bar */}
      {isMultiSelecting && (
        <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setIsMultiSelecting(false);
                setSelectedMsgIds([]);
              }}
              className="text-slate-400 hover:text-white"
            >
              <Icons.close className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-white">
              {selectedMsgIds.length} Selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={selectedMsgIds.length === 0}
              className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-lg transition disabled:opacity-50"
              title="Delete Selected"
            >
              <Icons.trash className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Messages List */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar relative"
      >
        {visibleMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3 text-slate-400 select-none">
            <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 shadow-inner">
              <Icons.sparkles className="w-7 h-7" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-200">No messages yet</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Say hello, share a photo, or start a voice call to begin the conversation.
              </p>
            </div>
          </div>
        ) : (
          visibleMessages.map((msg, index) => {
            const isMe = msg.from === currentUser.uid;
            const isDeleted = msg.deletedForEveryone;
            const isStarred = (msg.starredUids || []).includes(currentUser.uid);
            const isSelected = selectedMsgIds.includes(msg.id);

            // Date separator
            const prevMsg = visibleMessages[index - 1];
            const showDateHeader = !prevMsg || new Date(prevMsg.timestamp).toDateString() !== new Date(msg.timestamp).toDateString();

            return (
              <React.Fragment key={msg.id}>
                {showDateHeader && (
                  <div className="flex items-center justify-center my-3 select-none">
                    <span className="px-3 py-1 bg-slate-900/90 border border-slate-800/80 rounded-full text-[10px] font-semibold text-slate-400 uppercase tracking-wider shadow-sm">
                      {new Date(msg.timestamp).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                )}

                <div
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group relative`}
                  onClick={() => {
                    if (isMultiSelecting) {
                      setSelectedMsgIds(prev =>
                        prev.includes(msg.id) ? prev.filter(x => x !== msg.id) : [...prev, msg.id]
                      );
                    }
                  }}
                >
                  {/* Sender Name in Group */}
                  {isGroup && !isMe && msg.senderName && (
                    <span className="text-[10px] font-bold text-emerald-400 ml-3 mb-1 cursor-pointer hover:underline">
                      {msg.senderName}
                    </span>
                  )}

                  {/* Message Bubble Container */}
                  <div
                    className={`relative max-w-[85%] md:max-w-[70%] p-3 text-xs shadow-md transition-all ${getBubbleRadius(isMe)} ${
                      isSelected
                        ? 'ring-2 ring-emerald-400 bg-emerald-950/80'
                        : isMe
                        ? 'bg-emerald-600 text-white shadow-emerald-900/20'
                        : 'bg-slate-800 text-slate-100 border border-slate-700/60 shadow-black/20'
                    }`}
                  >
                    {/* Reply Quoted Card */}
                    {msg.replyTo && (
                      <div
                        onClick={() => {
                          const el = document.getElementById(`msg-${msg.replyTo?.id}`);
                          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        className={`mb-2 p-2 rounded-xl border-l-4 cursor-pointer text-[11px] ${
                          isMe
                            ? 'bg-emerald-700/60 border-emerald-300 text-emerald-100'
                            : 'bg-slate-900/80 border-emerald-500 text-slate-300'
                        }`}
                      >
                        <p className="font-bold text-[10px] uppercase">{msg.replyTo.senderName}</p>
                        <p className="truncate line-clamp-1 italic">{msg.replyTo.text}</p>
                      </div>
                    )}

                    {/* Forwarded Header */}
                    {msg.forwardFrom && (
                      <div className="flex items-center gap-1 text-[10px] opacity-75 mb-1 italic">
                        <Icons.forward className="w-3 h-3" />
                        <span>Forwarded</span>
                      </div>
                    )}

                    {/* DELETED MESSAGE */}
                    {isDeleted ? (
                      <div className="flex items-center gap-2 italic text-slate-400 py-1">
                        <Icons.block className="w-4 h-4" />
                        <span>This message was deleted</span>
                      </div>
                    ) : (
                      <>
                        {/* 1. Image Media */}
                        {msg.mediaType === 'image' && msg.mediaUrl && (
                          <div
                            onClick={() => setMediaViewerData({
                              isOpen: true,
                              url: msg.mediaUrl!,
                              type: 'image',
                              senderName: msg.senderName,
                              caption: msg.text
                            })}
                            className="rounded-xl overflow-hidden cursor-pointer mb-1 max-h-72 bg-black/20"
                          >
                            <img
                              src={msg.mediaUrl}
                              alt="Attached image"
                              className="w-full h-full object-cover hover:scale-102 transition duration-200"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}

                        {/* 2. Video Media */}
                        {msg.mediaType === 'video' && msg.mediaUrl && (
                          <div className="rounded-xl overflow-hidden mb-1 max-h-72 bg-black">
                            <video src={msg.mediaUrl} controls className="w-full h-full object-contain" />
                          </div>
                        )}

                        {/* 3. Voice Message Waveform */}
                        {msg.mediaType === 'voice' && msg.mediaUrl && (
                          <AudioVoicePlayer
                            url={msg.mediaUrl}
                            duration={msg.mediaInfo?.duration}
                            waveform={msg.mediaInfo?.waveform}
                            isOutgoing={isMe}
                          />
                        )}

                        {/* 4. Document File */}
                        {msg.mediaType === 'doc' && msg.mediaUrl && (
                          <div
                            onClick={() => setMediaViewerData({
                              isOpen: true,
                              url: msg.mediaUrl!,
                              type: 'doc',
                              fileName: msg.mediaInfo?.fileName
                            })}
                            className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer ${
                              isMe ? 'bg-emerald-700/50 hover:bg-emerald-700' : 'bg-slate-900/60 hover:bg-slate-900'
                            } transition`}
                          >
                            <Icons.fileDoc className="w-8 h-8 text-emerald-400 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-xs truncate">{msg.mediaInfo?.fileName || 'Document'}</p>
                              <span className="text-[10px] opacity-75">
                                {msg.mediaInfo?.fileSize ? `${Math.round(msg.mediaInfo.fileSize / 1024)} KB` : 'Document'}
                              </span>
                            </div>
                            <Icons.download className="w-4 h-4 shrink-0 opacity-80" />
                          </div>
                        )}

                        {/* 5. Location Card */}
                        {msg.mediaType === 'location' && msg.location && (
                          <div className="rounded-xl overflow-hidden bg-slate-900 border border-slate-700/80 mb-1 space-y-2 p-3">
                            <div className="flex items-center gap-2 text-emerald-400 font-bold">
                              <Icons.location className="w-5 h-5" />
                              <span>{msg.location.name || 'Shared Location'}</span>
                            </div>
                            <p className="text-[11px] text-slate-300 font-mono">
                              Lat: {msg.location.latitude}, Long: {msg.location.longitude}
                            </p>
                            <a
                              href={`https://maps.google.com/?q=${msg.location.latitude},${msg.location.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[11px] font-semibold transition"
                            >
                              Open in Google Maps
                            </a>
                          </div>
                        )}

                        {/* 6. Contact Sharing Card */}
                        {msg.mediaType === 'contact' && msg.sharedContact && (
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-700/80 mb-1">
                            <img
                              src={msg.sharedContact.dpUrl}
                              alt={msg.sharedContact.name}
                              className="w-10 h-10 rounded-full object-cover shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h5 className="font-bold text-xs text-white truncate">{msg.sharedContact.name}</h5>
                              <p className="text-[10px] text-slate-400 truncate">@{msg.sharedContact.identifier}</p>
                            </div>
                          </div>
                        )}

                        {/* 7. Sticker / GIF */}
                        {(msg.mediaType === 'sticker' || msg.mediaType === 'gif') && msg.mediaUrl && (
                          <div className="max-w-[200px] rounded-xl overflow-hidden my-1">
                            <img
                              src={msg.mediaUrl}
                              alt="Sticker"
                              className="w-full h-auto rounded-xl"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}

                        {/* Main Text Content */}
                        {msg.text && (
                          <p className="whitespace-pre-wrap break-words leading-relaxed text-xs">
                            {msg.text}
                          </p>
                        )}

                        {/* Automatic Link Preview Card */}
                        {msg.linkPreviews && msg.linkPreviews.map((lp, lIdx) => (
                          <a
                            key={lIdx}
                            href={lp.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`mt-2 p-2.5 rounded-xl border flex flex-col gap-1 block transition ${
                              isMe ? 'bg-emerald-700/40 border-emerald-500/40' : 'bg-slate-900/60 border-slate-700/60'
                            }`}
                          >
                            <span className="text-[10px] font-bold text-emerald-300 uppercase">{lp.domain}</span>
                            <span className="text-xs font-semibold line-clamp-1">{lp.title}</span>
                            <span className="text-[10px] opacity-75 line-clamp-1 truncate">{lp.url}</span>
                          </a>
                        ))}
                      </>
                    )}

                    {/* Bubble Footer: Timestamp, Edited tag, Star, Status ticks */}
                    <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] opacity-80 select-none">
                      {isStarred && <Icons.star className="w-3 h-3 text-amber-300 fill-amber-300" />}
                      {msg.pinned && <Icons.pin className="w-3 h-3 text-emerald-300" />}
                      {msg.edited && <span>(edited)</span>}
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isMe && (
                        <span>
                          {msg.status === 'read' ? (
                            <Icons.checkDouble className="w-3.5 h-3.5 text-sky-300" />
                          ) : msg.status === 'delivered' ? (
                            <Icons.checkDouble className="w-3.5 h-3.5 text-slate-300" />
                          ) : (
                            <Icons.check className="w-3.5 h-3.5 text-slate-300" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reaction Badges Pill Bar under bubble */}
                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1 px-1">
                      {Object.entries(msg.reactions).map(([emoji, rawUids]) => {
                        const uids = Array.isArray(rawUids) ? rawUids : [];
                        return (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleReaction(msg, emoji)}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border transition active:scale-95 ${
                              uids.includes(currentUser.uid)
                                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 shadow'
                                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <span>{emoji}</span>
                            <span>{uids.length}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Hover Quick Action Toolbar */}
                  <div
                    className={`hidden group-hover:flex items-center gap-0.5 p-1 rounded-full bg-slate-900/90 border border-slate-700/80 shadow-lg absolute -top-4 ${
                      isMe ? 'right-2' : 'left-2'
                    } z-20 backdrop-blur-xs`}
                  >
                    {/* Quick Reactions */}
                    {['👍', '❤️', '😂', '🔥'].map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleReaction(msg, emoji)}
                        className="p-1 hover:bg-slate-800 rounded-full text-xs transition active:scale-125"
                      >
                        {emoji}
                      </button>
                    ))}

                    <div className="w-[1px] h-3.5 bg-slate-700 mx-0.5" />

                    <button
                      type="button"
                      onClick={() => handleReplyMessage(msg)}
                      className="p-1 hover:bg-slate-800 rounded-full text-slate-300 hover:text-white"
                      title="Reply"
                    >
                      <Icons.reply className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyMessage(msg.text)}
                      className="p-1 hover:bg-slate-800 rounded-full text-slate-300 hover:text-white"
                      title="Copy"
                    >
                      <Icons.copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleStar(msg)}
                      className="p-1 hover:bg-slate-800 rounded-full text-slate-300 hover:text-amber-400"
                      title="Star"
                    >
                      <Icons.star className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTogglePin(msg)}
                      className="p-1 hover:bg-slate-800 rounded-full text-slate-300 hover:text-emerald-400"
                      title="Pin"
                    >
                      <Icons.pin className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleForward(msg)}
                      className="p-1 hover:bg-slate-800 rounded-full text-slate-300 hover:text-white"
                      title="Forward"
                    >
                      <Icons.forward className="w-3.5 h-3.5" />
                    </button>

                    {isMe && !isDeleted && (
                      <button
                        type="button"
                        onClick={() => handleEditMessage(msg)}
                        className="p-1 hover:bg-slate-800 rounded-full text-slate-300 hover:text-white"
                        title="Edit"
                      >
                        <Icons.edit className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {isMe && !isDeleted && (
                      <button
                        type="button"
                        onClick={() => deleteMessageForEveryone(chatId, msg.id)}
                        className="p-1 hover:bg-rose-500/20 rounded-full text-rose-400"
                        title="Delete for everyone"
                      >
                        <Icons.trash className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Jump to Bottom Button */}
      {showJumpToBottom && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="absolute bottom-20 right-5 w-10 h-10 rounded-full bg-slate-800/90 hover:bg-slate-700 text-white shadow-xl flex items-center justify-center border border-slate-700 active:scale-95 transition z-30"
          title="Jump to latest"
        >
          <Icons.chevronDown className="w-5 h-5" />
        </button>
      )}

      {/* Reply or Edit Banner above input */}
      {(replyingTo || editingMessage) && (
        <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs z-20">
          <div className="flex items-center gap-2 min-w-0">
            {replyingTo ? (
              <Icons.reply className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Icons.edit className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <div className="min-w-0">
              <span className="font-bold text-white">
                {replyingTo ? `Replying to ${replyingTo.senderName}` : 'Editing Message'}
              </span>
              <p className="text-slate-400 truncate italic">
                {replyingTo ? replyingTo.text : editingMessage?.text}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setReplyingTo(null);
              setEditingMessage(null);
              if (editingMessage) setInputText('');
            }}
            className="text-slate-400 hover:text-white"
          >
            <Icons.close className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Voice Recorder Bar replaces input when active */}
      {isRecordingVoice ? (
        <VoiceRecorderBar
          onSendVoice={handleSendVoice}
          onCancel={() => setIsRecordingVoice(false)}
        />
      ) : (
        /* Standard Bottom Input Bar */
        <div className="p-3 bg-slate-900 border-t border-slate-800 relative z-30">
          <div className="flex items-center gap-2">
            {/* Attachment Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition active:scale-95"
                title="Attach files, media, location"
              >
                <Icons.paperclip className="w-5 h-5" />
              </button>

              {/* Attachment Popover Menu */}
              {showAttachmentMenu && (
                <div className="absolute bottom-12 left-0 w-48 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 space-y-1 text-xs z-50 animate-in fade-in">
                  {/* Photo / Image */}
                  <label className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800 cursor-pointer transition">
                    <Icons.image className="w-4 h-4 text-emerald-400" />
                    <span>Photo / Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleSendMediaFile(e, 'image')}
                    />
                  </label>

                  {/* Video */}
                  <label className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800 cursor-pointer transition">
                    <Icons.video className="w-4 h-4 text-blue-400" />
                    <span>Video</span>
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => handleSendMediaFile(e, 'video')}
                    />
                  </label>

                  {/* Document */}
                  <label className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800 cursor-pointer transition">
                    <Icons.fileDoc className="w-4 h-4 text-amber-400" />
                    <span>Document File</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => handleSendMediaFile(e, 'doc')}
                    />
                  </label>

                  {/* Location */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowAttachmentMenu(false);
                      setShowLocationPicker(true);
                    }}
                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800 text-left transition"
                  >
                    <Icons.location className="w-4 h-4 text-rose-400" />
                    <span>Location</span>
                  </button>

                  {/* Share Contact */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowAttachmentMenu(false);
                      setShowContactPicker(true);
                    }}
                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800 text-left transition"
                  >
                    <Icons.contacts className="w-4 h-4 text-purple-400" />
                    <span>Share Contact</span>
                  </button>
                </div>
              )}
            </div>

            {/* Emoji & Sticker Picker Toggle */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition active:scale-95"
              title="Emojis, Stickers, GIFs"
            >
              <Icons.emoji className="w-5 h-5" />
            </button>

            {/* Text Input */}
            <div className="flex-1 bg-slate-800/90 rounded-2xl border border-slate-700/60 px-3 py-1.5 flex items-center">
              <input
                type="text"
                value={inputText}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type a message..."
                className="w-full bg-transparent text-xs text-white outline-none placeholder-slate-500"
              />
            </div>

            {/* Send OR Mic Button */}
            {inputText.trim() || editingMessage ? (
              <button
                type="button"
                onClick={handleSendMessage}
                className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white flex items-center justify-center transition shadow-lg shadow-emerald-500/20"
                title="Send Message"
              >
                <Icons.send className="w-4 h-4 ml-0.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsRecordingVoice(true)}
                className="w-10 h-10 rounded-full bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white active:scale-95 flex items-center justify-center transition"
                title="Hold or click to record voice message"
              >
                <Icons.mic className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Emoji & Sticker Drawer */}
      {showEmojiPicker && (
        <div className="absolute bottom-16 left-3 z-40 animate-in fade-in slide-in-from-bottom duration-150">
          <EmojiStickerPicker
            onSelectEmoji={(emoji) => setInputText(prev => prev + emoji)}
            onSelectSticker={(url) => handleSendStickerOrGif(url, 'sticker')}
            onSelectGif={(url) => handleSendStickerOrGif(url, 'gif')}
            onClose={() => setShowEmojiPicker(false)}
          />
        </div>
      )}

      {/* Location Picker Modal */}
      <LocationPickerModal
        isOpen={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onSendLocation={handleSendLocation}
      />

      {/* Contact Share Modal */}
      <ContactShareModal
        isOpen={showContactPicker}
        onClose={() => setShowContactPicker(false)}
        contacts={contacts}
        onShareContact={handleSendContact}
      />

      {/* Forward Message Modal */}
      <ForwardMessageModal
        isOpen={showForwardModal}
        onClose={() => setShowForwardModal(false)}
        message={forwardTargetMessage}
        contacts={contacts}
        groups={groups}
        onForward={async (targetId, isGrp) => {
          if (!forwardTargetMessage) return;
          const targetChatId = isGrp ? targetId : [currentUser.uid, targetId].sort().join('_');
          await sendChatMessage(targetChatId, currentUser.uid, forwardTargetMessage.text, currentUser.dpUrl, {
            senderName: currentUser.name,
            forwardFrom: {
              senderName: forwardTargetMessage.senderName || 'Someone'
            },
            mediaType: forwardTargetMessage.mediaType,
            mediaUrl: forwardTargetMessage.mediaUrl,
            mediaInfo: forwardTargetMessage.mediaInfo,
            location: forwardTargetMessage.location,
            sharedContact: forwardTargetMessage.sharedContact
          });
        }}
      />

      {/* Fullscreen Media Viewer */}
      <MediaViewerModal
        isOpen={mediaViewerData.isOpen}
        onClose={() => setMediaViewerData(prev => ({ ...prev, isOpen: false }))}
        mediaUrl={mediaViewerData.url}
        mediaType={mediaViewerData.type}
        senderName={mediaViewerData.senderName}
        caption={mediaViewerData.caption}
        fileName={mediaViewerData.fileName}
      />

      {/* Right Details / Media Gallery Drawer */}
      <ChatInfoDrawer
        isOpen={showInfoDrawer}
        onClose={() => setShowInfoDrawer(false)}
        chatId={chatId}
        isGroup={isGroup}
        group={activeGroup}
        contact={activeContact}
        currentUser={currentUser}
        contacts={contacts}
        messages={messages}
        onOpenMediaViewer={(url, type, title) => setMediaViewerData({
          isOpen: true,
          url,
          type,
          senderName: title
        })}
        onMuteToggle={onMuteChat}
        isMuted={isMuted}
        onSetWallpaper={handleSetWallpaper}
        currentWallpaper={currentWallpaper}
        onStartCall={onStartCall}
      />
    </div>
  );
};
