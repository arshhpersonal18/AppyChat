import React, { useState } from 'react';
import { Icons } from '../services/icons';
import { UserProfile, SharedContact } from '../types';

interface ContactShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: UserProfile[];
  onShareContact: (contact: SharedContact) => void;
}

export const ContactShareModal: React.FC<ContactShareModalProps> = ({
  isOpen,
  onClose,
  contacts,
  onShareContact
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.identifier.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (c: UserProfile) => {
    onShareContact({
      uid: c.uid,
      name: c.name,
      identifier: c.identifier,
      dpUrl: c.dpUrl,
      bio: c.bio
    });
    onClose();
  };

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
            <Icons.contacts className="w-6 h-6" />
            <h3 className="text-lg font-bold text-white">Share Contact</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <Icons.close className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-xl text-xs">
          <Icons.search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts by name or ID..."
            className="bg-transparent text-white outline-none w-full placeholder-slate-500"
          />
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No contacts found to share.
            </div>
          ) : (
            filtered.map((c) => (
              <button
                key={c.uid}
                type="button"
                onClick={() => handleSelect(c)}
                className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-800/80 border border-transparent hover:border-slate-700/60 transition text-left group active:scale-[0.99]"
              >
                <img
                  src={c.dpUrl}
                  alt={c.name}
                  className="w-11 h-11 rounded-full object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-white group-hover:text-emerald-400 transition truncate">
                    {c.name}
                  </h4>
                  <p className="text-xs text-slate-400 truncate">@{c.identifier}</p>
                </div>
                <span className="text-xs font-semibold text-emerald-400 px-3 py-1 bg-emerald-950/60 rounded-xl border border-emerald-500/30">
                  Share
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
