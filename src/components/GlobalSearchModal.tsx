import React, { useState } from 'react';
import { Icons } from '../services/icons';
import { UserProfile, GroupChat, ChatMessage } from '../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: UserProfile[];
  groups: GroupChat[];
  allRecentMessages?: Record<string, ChatMessage[]>;
  onSelectChat: (id: string, isGroup: boolean) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  contacts,
  groups,
  allRecentMessages = {},
  onSelectChat
}) => {
  const [query, setQuery] = useState('');
  const [searchTab, setSearchTab] = useState<'all' | 'chats' | 'messages' | 'media' | 'links'>('all');

  if (!isOpen) return null;

  const cleanQuery = query.toLowerCase().trim();

  // Search filtered results
  const matchedContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(cleanQuery) ||
    c.identifier.toLowerCase().includes(cleanQuery)
  );

  const matchedGroups = groups.filter(g =>
    g.name.toLowerCase().includes(cleanQuery) ||
    (g.description && g.description.toLowerCase().includes(cleanQuery))
  );

  // Search messages across chats
  const matchedMessages: Array<{ chatId: string; message: ChatMessage; chatTitle: string; isGroup: boolean }> = [];
  if (cleanQuery.length >= 2) {
    Object.entries(allRecentMessages).forEach(([chatId, rawMsgs]) => {
      const msgs = Array.isArray(rawMsgs) ? (rawMsgs as ChatMessage[]) : [];
      const isGroup = groups.some(g => g.id === chatId);
      const chatTitle = isGroup
        ? groups.find(g => g.id === chatId)?.name || 'Group'
        : contacts.find(c => chatId.includes(c.uid))?.name || 'Chat';

      msgs.forEach(m => {
        if (m.text && m.text.toLowerCase().includes(cleanQuery)) {
          matchedMessages.push({ chatId, message: m, chatTitle, isGroup });
        }
      });
    });
  }

  const handlePickChat = (chatId: string, isGroup: boolean) => {
    onSelectChat(chatId, isGroup);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 bg-black/80 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl text-slate-100 flex flex-col max-h-[80vh] space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input header */}
        <div className="flex items-center gap-3 px-3 py-2 bg-slate-800 rounded-2xl border border-slate-700/60 text-sm">
          <Icons.search className="w-5 h-5 text-emerald-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contacts, groups, messages, links..."
            className="bg-transparent text-white outline-none w-full placeholder-slate-500 font-medium"
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-white"
            >
              <Icons.close className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs font-semibold pb-1">
          {(['all', 'chats', 'messages', 'media', 'links'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setSearchTab(tab)}
              className={`px-3 py-1 rounded-xl uppercase tracking-wider text-[11px] transition ${
                searchTab === tab
                  ? 'bg-emerald-500 text-white shadow'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
          {query.trim() === '' ? (
            <div className="text-center py-12 text-slate-400 text-xs space-y-1">
              <p className="font-semibold text-slate-300">Quick Global Search</p>
              <p>Type keywords to look up people, group conversations, or chat messages.</p>
            </div>
          ) : (
            <>
              {/* Groups & Direct Chats */}
              {(searchTab === 'all' || searchTab === 'chats') && (
                <>
                  {matchedGroups.length > 0 && (
                    <div className="space-y-1.5">
                      <h5 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                        Groups ({matchedGroups.length})
                      </h5>
                      {matchedGroups.map(g => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => handlePickChat(g.id, true)}
                          className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-800/80 border border-transparent hover:border-slate-700/60 transition text-left"
                        >
                          <img
                            src={g.avatarUrl}
                            alt={g.name}
                            className="w-10 h-10 rounded-full object-cover shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-white truncate">{g.name}</h4>
                            <p className="text-xs text-slate-400 truncate">{g.members.length} members</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {matchedContacts.length > 0 && (
                    <div className="space-y-1.5">
                      <h5 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                        Contacts ({matchedContacts.length})
                      </h5>
                      {matchedContacts.map(c => (
                        <button
                          key={c.uid}
                          type="button"
                          onClick={() => handlePickChat(c.uid, false)}
                          className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-800/80 border border-transparent hover:border-slate-700/60 transition text-left"
                        >
                          <img
                            src={c.dpUrl}
                            alt={c.name}
                            className="w-10 h-10 rounded-full object-cover shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-white truncate">{c.name}</h4>
                            <p className="text-xs text-slate-400 truncate">@{c.identifier} · {c.status}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Messages Results */}
              {(searchTab === 'all' || searchTab === 'messages') && matchedMessages.length > 0 && (
                <div className="space-y-1.5">
                  <h5 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                    Matching Messages ({matchedMessages.length})
                  </h5>
                  {matchedMessages.map((item, idx) => (
                    <button
                      key={`${item.chatId}_${item.message.id}_${idx}`}
                      type="button"
                      onClick={() => handlePickChat(item.chatId, item.isGroup)}
                      className="w-full flex flex-col p-3 rounded-2xl hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700/60 transition text-left space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-emerald-400">{item.chatTitle}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(item.message.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-2">
                        {item.message.text}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {matchedContacts.length === 0 && matchedGroups.length === 0 && matchedMessages.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No matching results for "{query}".
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
