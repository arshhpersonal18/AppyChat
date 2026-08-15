import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../services/icons';
import { UserProfile, ChatMessage } from '../types';
import {
  sendMessage,
  subscribeMessages,
  subscribeTyping,
  setTypingStatus,
  getChatId
} from '../services/firebase';
import { soundService } from '../services/toneAudio';

interface ChatViewProps {
  contact: UserProfile;
  currentUser: UserProfile;
  onBack: () => void;
  onInitiateCall: (contact: UserProfile, type: 'voice' | 'video') => void;
  onShowToast: (msg: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  contact,
  currentUser,
  onBack,
  onInitiateCall,
  onShowToast
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimerRef = useRef<number | null>(null);

  const chatId = getChatId(currentUser.uid, contact.uid);

  // Load and subscribe to messages
  useEffect(() => {
    // Subscribe to incoming messages
    const unsubscribeMsgs = subscribeMessages(chatId, (newMessages: ChatMessage[]) => {
      setMessages(newMessages);
      const last = newMessages[newMessages.length - 1];
      if (last && last.from !== currentUser.uid) {
        soundService.playMessageChime();
      }
    });

    // Subscribe to typing indicator
    const unsubscribeTyping = subscribeTyping(chatId, (typingMap: Record<string, boolean>) => {
      if (typingMap && typeof typingMap[contact.uid] === 'boolean') {
        setIsOtherTyping(typingMap[contact.uid]);
      } else {
        setIsOtherTyping(false);
      }
    });

    return () => {
      unsubscribeMsgs();
      unsubscribeTyping();
      setTypingStatus(chatId, currentUser.uid, false);
    };
  }, [chatId, contact.uid, currentUser.uid]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOtherTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    // Typing indicator
    setTypingStatus(chatId, currentUser.uid, true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = window.setTimeout(() => {
      setTypingStatus(chatId, currentUser.uid, false);
    }, 2500);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    setInputText('');
    setTypingStatus(chatId, currentUser.uid, false);

    try {
      await sendMessage(chatId, currentUser.uid, text, currentUser.dpUrl);
    } catch (err) {
      console.error('Failed to send message:', err);
      onShowToast('Failed to send message. Please try again.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div id="chat-view" className="h-full flex flex-col bg-[#121212] overflow-hidden select-none z-20">
      {/* Chat Header */}
      <div
        id="chat-header"
        className="bg-[#1A1A1A] px-3 py-2.5 border-b border-[#2C2C2C] flex items-center justify-between h-14 shrink-0"
      >
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg text-[#A0A0A0] hover:text-[#FFFFFF] hover:bg-[#282828] transition-colors"
            aria-label="Back"
          >
            <Icons.back className="w-5 h-5" />
          </button>

          {/* Contact Details */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-full overflow-hidden border border-[#2C2C2C]">
                <img
                  src={contact.dpUrl}
                  alt={contact.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span
                className={`w-2.5 h-2.5 rounded-full border-2 border-[#1A1A1A] absolute bottom-0 right-0 ${
                  contact.status === 'online'
                    ? 'bg-[#00E676]'
                    : contact.status === 'away'
                    ? 'bg-[#FFD740]'
                    : 'bg-[#757575]'
                }`}
              />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-[#FFFFFF] truncate leading-tight">
                {contact.name}
              </h3>
              <p className="text-[11px] text-[#A0A0A0] truncate">
                {isOtherTyping ? (
                  <span className="text-[#00A878] font-medium">typing...</span>
                ) : contact.status === 'online' ? (
                  'Online'
                ) : contact.status === 'away' ? (
                  'Away'
                ) : (
                  'Offline'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons: Voice Call, Video Call, More Options */}
        <div className="flex items-center gap-1 shrink-0 relative">
          <button
            onClick={() => onInitiateCall(contact, 'voice')}
            className="p-2 rounded-xl text-[#00A878] hover:bg-[#00A878]/15 hover:text-[#33C49A] transition-colors"
            aria-label="Voice Call"
            title="Voice Call"
          >
            <Icons.phone className="w-5 h-5" />
          </button>
          <button
            onClick={() => onInitiateCall(contact, 'video')}
            className="p-2 rounded-xl text-[#00A878] hover:bg-[#00A878]/15 hover:text-[#33C49A] transition-colors"
            aria-label="Video Call"
            title="Video Call"
          >
            <Icons.video className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div
        id="messages-container"
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0A0A0A]"
        onClick={() => setShowOptions(false)}
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#A0A0A0]">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#00A878]/30 mb-3 shadow-lg">
              <img src={contact.dpUrl} alt={contact.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <h4 className="text-sm font-semibold text-[#FFFFFF] mb-1">{contact.name}</h4>
            <span className="text-xs font-mono text-[#00A878] bg-[#00A878]/10 px-2 py-0.5 rounded border border-[#00A878]/20 mb-2">
              {contact.identifier}
            </span>
            <p className="text-xs text-[#757575] max-w-xs">
              This is the start of your direct conversation. Send a message or start a call.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.from === currentUser.uid;

            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 message-bubble ${isMe ? 'justify-end me' : 'justify-start other'}`}
              >
                {/* Avatar for other messages */}
                {!isMe && (
                  <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-[#2C2C2C] mb-1">
                    <img
                      src={contact.dpUrl}
                      alt={contact.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                {/* Content Bubble */}
                <div
                  className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl relative shadow-sm text-sm break-words select-text ${
                    isMe
                      ? 'bg-[#00A878] text-[#121212] rounded-br-xs'
                      : 'bg-[#2C2C2C] text-[#E0E0E0] rounded-bl-xs'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  <div
                    className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${
                      isMe ? 'text-[#121212]/70 font-medium' : 'text-[#A0A0A0]'
                    }`}
                  >
                    <span>{formatTime(msg.timestamp)}</span>
                    {isMe && <Icons.checkDouble className="w-3.5 h-3.5 inline" />}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {isOtherTyping && (
          <div className="flex items-center gap-2 text-[#A0A0A0] text-xs pt-1">
            <div className="w-6 h-6 rounded-full overflow-hidden border border-[#2C2C2C]">
              <img src={contact.dpUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="bg-[#2C2C2C] px-3 py-2 rounded-2xl rounded-bl-xs flex items-center gap-1.5 shadow-sm">
              <div className="typing-dots flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00A878] animate-[typingBounce_1.4s_infinite]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#00A878] animate-[typingBounce_1.4s_infinite_0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#00A878] animate-[typingBounce_1.4s_infinite_0.4s]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div id="chat-input-area" className="p-3 bg-[#1A1A1A] border-t border-[#2C2C2C] shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            id="input-chat-message"
            type="text"
            placeholder="Type a message..."
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            maxLength={1000}
            className="flex-1 bg-[#282828] text-sm text-[#FFFFFF] placeholder-[#757575] px-4 py-2.5 rounded-2xl border border-[#2C2C2C] focus:outline-none focus:border-[#00A878] transition-colors"
          />
          <button
            id="btn-send-message"
            type="submit"
            disabled={!inputText.trim()}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              inputText.trim()
                ? 'bg-[#00A878] text-[#121212] hover:bg-[#008F65] shadow-md hover:scale-105 active:scale-95 cursor-pointer'
                : 'bg-[#282828] text-[#666666] cursor-not-allowed'
            }`}
            aria-label="Send Message"
          >
            <Icons.send className="w-5 h-5 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
