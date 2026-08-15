import React from 'react';
import { Icons } from '../services/icons';
import { UserProfile } from '../types';

interface ContactListProps {
  contacts: UserProfile[];
  onSelectContact: (contact: UserProfile) => void;
  onOpenAddFriend: () => void;
  currentUserId: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  showSearch: boolean;
}

export const ContactList: React.FC<ContactListProps> = ({
  contacts,
  onSelectContact,
  onOpenAddFriend,
  searchQuery,
  onSearchChange,
  showSearch
}) => {
  const filteredContacts = contacts.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.identifier.toLowerCase().includes(q) ||
      c.bio?.toLowerCase().includes(q)
    );
  });

  return (
    <div id="contact-list" className="h-full flex flex-col overflow-hidden bg-[#121212]">
      {/* Search Bar */}
      {showSearch && (
        <div className="p-3 border-b border-[#2C2C2C] bg-[#1A1A1A] transition-all animate-in fade-in duration-150">
          <div className="relative flex items-center">
            <Icons.search className="w-4 h-4 text-[#A0A0A0] absolute left-3 pointer-events-none" />
            <input
              id="input-contact-search"
              type="text"
              placeholder="Search contacts or identifier..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-[#282828] text-sm text-[#FFFFFF] placeholder-[#757575] pl-9 pr-8 py-2 rounded-xl border border-[#2C2C2C] focus:outline-none focus:border-[#00A878] transition-colors"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 text-[#A0A0A0] hover:text-[#FFFFFF]"
              >
                <Icons.close className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* List Container */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#1E1E1E]">
        {filteredContacts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-[#A0A0A0]">
            <div className="w-14 h-14 rounded-full bg-[#1E1E1E] flex items-center justify-center mb-3 text-[#00A878]">
              <Icons.user className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-[#FFFFFF] mb-1">
              {searchQuery ? 'No contacts found' : 'No contacts yet'}
            </h3>
            <p className="text-xs text-[#A0A0A0] max-w-xs mb-4">
              {searchQuery
                ? 'Try searching with a different name or exact identifier.'
                : 'Connect with friends using their unique identifier or email to start chatting and calling.'}
            </p>
            <button
              id="btn-empty-add-friend"
              onClick={onOpenAddFriend}
              className="inline-flex items-center gap-2 bg-[#00A878] hover:bg-[#008F65] text-[#121212] font-semibold text-xs px-4 py-2 rounded-xl transition-colors shadow-md cursor-pointer"
            >
              <Icons.add className="w-4 h-4" />
              <span>Add Friend</span>
            </button>
          </div>
        ) : (
          filteredContacts.map((contact) => {
            return (
              <button
                key={contact.uid}
                onClick={() => onSelectContact(contact)}
                className="w-full flex items-center gap-3.5 p-3.5 hover:bg-[#1A1A1A] transition-colors text-left focus:outline-none focus:bg-[#1A1A1A] group cursor-pointer"
              >
                {/* Avatar with Status */}
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-[#2C2C2C] group-hover:border-[#00A878]/50 transition-colors">
                    <img
                      src={contact.dpUrl}
                      alt={contact.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span
                    className={`status-indicator ${
                      contact.status === 'online'
                        ? 'online'
                        : contact.status === 'away'
                        ? 'bg-[#FFD740]'
                        : 'offline'
                    }`}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-semibold text-[#FFFFFF] truncate">
                      {contact.name}
                    </h4>
                    <span className="text-[10px] font-mono text-[#00A878] bg-[#00A878]/10 px-1.5 py-0.5 rounded border border-[#00A878]/20">
                      {contact.identifier}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-[#A0A0A0] truncate max-w-[220px]">
                      {contact.bio || 'Tap to chat or start a call'}
                    </p>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Floating Add Friend Button */}
      <div className="absolute bottom-16 right-4 z-10">
        <button
          id="btn-fab-add-friend"
          onClick={onOpenAddFriend}
          aria-label="Add Friend"
          className="w-12 h-12 rounded-full bg-[#00A878] hover:bg-[#008F65] text-[#121212] flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <Icons.add className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
