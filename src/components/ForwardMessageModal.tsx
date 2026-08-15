import React, { useState } from 'react';
import { Icons } from '../services/icons';
import { UserProfile, GroupChat, ChatMessage } from '../types';

interface ForwardMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: ChatMessage | null;
  contacts: UserProfile[];
  groups: GroupChat[];
  onForward: (targetId: string, isGroup: boolean) => Promise<void>;
}

export const ForwardMessageModal: React.FC<ForwardMessageModalProps> = ({
  isOpen,
  onClose,
  message,
  contacts,
  groups,
  onForward
}) => {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  if (!isOpen || !message) return null;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSend = async () => {
    if (selectedIds.length === 0) return;
    setSending(true);
    try {
      for (const targetId of selectedIds) {
        const isGroup = groups.some(g => g.id === targetId);
        await onForward(targetId, isGroup);
      }
      onClose();
    } catch (err) {
      console.error('Error forwarding message:', err);
    } finally {
      setSending(false);
    }
  };

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.identifier.toLowerCase().includes(search.toLowerCase())
  );

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 space-y-4 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400">
            <Icons.forward className="w-6 h-6" />
            <h3 className="text-lg font-bold text-white">Forward Message</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <Icons.close className="w-5 h-5" />
          </button>
        </div>

        {/* Snippet preview */}
        <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 text-xs text-slate-300 italic truncate">
          "{message.text || `[${message.mediaType || 'Media'}]`}"
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-xl text-xs">
          <Icons.search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats to forward to..."
            className="bg-transparent text-white outline-none w-full placeholder-slate-500"
          />
        </div>

        {/* Target List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {filteredGroups.length > 0 && (
            <div>
              <h5 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 px-1">
                Groups
              </h5>
              <div className="space-y-1">
                {filteredGroups.map(g => {
                  const isSelected = selectedIds.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => toggleSelect(g.id)}
                      className={`w-full flex items-center gap-3 p-2 rounded-2xl border transition text-left ${
                        isSelected
                          ? 'bg-emerald-950/60 border-emerald-500/50'
                          : 'hover:bg-slate-800/80 border-transparent hover:border-slate-700/60'
                      }`}
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
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${
                        isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-600'
                      }`}>
                        {isSelected && <Icons.check className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {filteredContacts.length > 0 && (
            <div>
              <h5 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 px-1">
                Contacts
              </h5>
              <div className="space-y-1">
                {filteredContacts.map(c => {
                  const isSelected = selectedIds.includes(c.uid);
                  return (
                    <button
                      key={c.uid}
                      type="button"
                      onClick={() => toggleSelect(c.uid)}
                      className={`w-full flex items-center gap-3 p-2 rounded-2xl border transition text-left ${
                        isSelected
                          ? 'bg-emerald-950/60 border-emerald-500/50'
                          : 'hover:bg-slate-800/80 border-transparent hover:border-slate-700/60'
                      }`}
                    >
                      <img
                        src={c.dpUrl}
                        alt={c.name}
                        className="w-10 h-10 rounded-full object-cover shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-white truncate">{c.name}</h4>
                        <p className="text-xs text-slate-400 truncate">@{c.identifier}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${
                        isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-600'
                      }`}>
                        {isSelected && <Icons.check className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Forward footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <span className="text-xs text-slate-400">
            {selectedIds.length} chat{selectedIds.length === 1 ? '' : 's'} selected
          </span>
          <button
            type="button"
            onClick={handleSend}
            disabled={selectedIds.length === 0 || sending}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:pointer-events-none active:scale-95 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition shadow-lg shadow-emerald-500/20"
          >
            <Icons.forward className="w-4 h-4" />
            {sending ? 'Forwarding...' : 'Forward'}
          </button>
        </div>
      </div>
    </div>
  );
};
