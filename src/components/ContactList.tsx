import React, { useState } from 'react';
import { Icons } from '../services/icons';
import { UserProfile, GroupChat, ChatCategory, ChatSettings } from '../types';
import { CategoryFilterBar } from './CategoryFilterBar';

interface ContactListProps {
  contacts: UserProfile[];
  groups: GroupChat[];
  onSelectContact: (contact: UserProfile) => void;
  onSelectGroup: (group: GroupChat) => void;
  onOpenAddFriend: () => void;
  onOpenCreateGroup: () => void;
  currentUserId: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  showSearch: boolean;
  chatSettings: Record<string, ChatSettings>;
  onTogglePinChat: (chatId: string) => void;
  onToggleArchiveChat: (chatId: string) => void;
  onToggleMuteChat: (chatId: string) => void;
}

export const ContactList: React.FC<ContactListProps> = ({
  contacts,
  groups,
  onSelectContact,
  onSelectGroup,
  onOpenAddFriend,
  onOpenCreateGroup,
  currentUserId,
  searchQuery,
  onSearchChange,
  showSearch,
  chatSettings,
  onTogglePinChat,
  onToggleArchiveChat,
  onToggleMuteChat
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [customCategories, setCustomCategories] = useState<ChatCategory[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('appychat_custom_categories') || '[]');
    } catch {
      return [];
    }
  });

  const handleAddCustomCategory = (name: string) => {
    const newCat: ChatCategory = {
      id: `cat_${Date.now()}`,
      name,
      icon: 'folder'
    };
    const updated = [...customCategories, newCat];
    setCustomCategories(updated);
    localStorage.setItem('appychat_custom_categories', JSON.stringify(updated));
  };

  const handleDeleteCustomCategory = (catId: string) => {
    const updated = customCategories.filter(c => c.id !== catId);
    setCustomCategories(updated);
    localStorage.setItem('appychat_custom_categories', JSON.stringify(updated));
    if (activeCategory === catId) setActiveCategory('all');
  };

  // Combine Contacts and Groups into unified list for display
  type ChatItem = {
    id: string;
    type: 'direct' | 'group';
    name: string;
    identifier?: string;
    avatarUrl: string;
    status?: string;
    bio?: string;
    memberCount?: number;
    rawContact?: UserProfile;
    rawGroup?: GroupChat;
    isPinned: boolean;
    isArchived: boolean;
    isMuted: boolean;
    unreadCount: number;
    categoryId?: string;
  };

  const allChatItems: ChatItem[] = [
    ...groups.map((g): ChatItem => {
      const settings = chatSettings[g.id] || {};
      return {
        id: g.id,
        type: 'group',
        name: g.name,
        avatarUrl: g.avatarUrl,
        memberCount: g.members.length,
        bio: g.description || `${g.members.length} members`,
        rawGroup: g,
        isPinned: !!settings.pinned,
        isArchived: !!settings.archived,
        isMuted: !!settings.mutedUntil && settings.mutedUntil > Date.now(),
        unreadCount: 0,
        categoryId: settings.categoryId
      };
    }),
    ...contacts.map((c): ChatItem => {
      const chatId = [currentUserId, c.uid].sort().join('_');
      const settings = chatSettings[chatId] || {};
      return {
        id: chatId,
        type: 'direct',
        name: c.name,
        identifier: c.identifier,
        avatarUrl: c.dpUrl,
        status: c.status,
        bio: c.bio || 'Hey there! I am using AppyChat.',
        rawContact: c,
        isPinned: !!settings.pinned,
        isArchived: !!settings.archived,
        isMuted: !!settings.mutedUntil && settings.mutedUntil > Date.now(),
        unreadCount: 0,
        categoryId: settings.categoryId
      };
    })
  ];

  // Filter based on active category and search
  const filteredItems = allChatItems.filter((item) => {
    // Search query check
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchIdent = item.identifier?.toLowerCase().includes(q);
      const matchBio = item.bio?.toLowerCase().includes(q);
      if (!matchName && !matchIdent && !matchBio) return false;
    }

    // Category filter
    if (activeCategory === 'pinned') return item.isPinned;
    if (activeCategory === 'archived') return item.isArchived;
    if (activeCategory === 'groups') return item.type === 'group' && !item.isArchived;
    if (activeCategory === 'personal') return item.type === 'direct' && !item.isArchived;
    if (activeCategory === 'unread') return item.unreadCount > 0 && !item.isArchived;

    // Custom category match
    if (activeCategory !== 'all') {
      return item.categoryId === activeCategory && !item.isArchived;
    }

    // Default 'all' hides archived chats
    return !item.isArchived;
  });

  // Sort pinned to the top
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return a.name.localeCompare(b.name);
  });

  const pinnedCount = allChatItems.filter(i => i.isPinned).length;
  const archivedCount = allChatItems.filter(i => i.isArchived).length;
  const groupsCount = allChatItems.filter(i => i.type === 'group').length;

  return (
    <div id="contact-list" className="h-full flex flex-col overflow-hidden bg-[#121212] select-none">
      {/* Category Filter Tabs */}
      <CategoryFilterBar
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        unreadCount={0}
        groupsCount={groupsCount}
        pinnedCount={pinnedCount}
        archivedCount={archivedCount}
        customCategories={customCategories}
        onAddCustomCategory={handleAddCustomCategory}
        onDeleteCustomCategory={handleDeleteCustomCategory}
      />

      {/* Search Input if toggled */}
      {showSearch && (
        <div className="p-3 border-b border-[#2C2C2C] bg-[#1A1A1A] transition-all animate-in fade-in duration-150">
          <div className="relative flex items-center">
            <Icons.search className="w-4 h-4 text-[#A0A0A0] absolute left-3 pointer-events-none" />
            <input
              id="input-contact-search"
              type="text"
              placeholder="Search conversations, groups, ID..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-[#282828] text-sm text-[#FFFFFF] placeholder-[#757575] pl-9 pr-8 py-2 rounded-xl border border-[#2C2C2C] focus:outline-none focus:border-[#00A878] transition-colors"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 text-[#A0A0A0] hover:text-[#FFFFFF]"
              >
                <Icons.close className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Conversation List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#1E1E1E] custom-scrollbar">
        {sortedItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-[#A0A0A0]">
            <div className="w-14 h-14 rounded-full bg-[#1E1E1E] flex items-center justify-center mb-3 text-[#00A878]">
              <Icons.sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-[#FFFFFF] mb-1">
              {searchQuery ? 'No chats found' : 'No conversations yet'}
            </h3>
            <p className="text-xs text-[#A0A0A0] max-w-xs mb-4">
              {searchQuery
                ? 'Try searching with a different name or exact user ID.'
                : 'Connect with friends using their AppyChat ID or create a group to start messaging.'}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenAddFriend}
                className="inline-flex items-center gap-2 bg-[#00A878] hover:bg-[#008F65] text-[#121212] font-semibold text-xs px-3.5 py-2 rounded-xl transition shadow-md cursor-pointer"
              >
                <Icons.add className="w-4 h-4" />
                <span>Add Contact</span>
              </button>
              <button
                type="button"
                onClick={onOpenCreateGroup}
                className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition border border-slate-700 cursor-pointer"
              >
                <Icons.group className="w-4 h-4" />
                <span>New Group</span>
              </button>
            </div>
          </div>
        ) : (
          sortedItems.map((item) => {
            return (
              <div
                key={item.id}
                onClick={() => {
                  if (item.type === 'group' && item.rawGroup) {
                    onSelectGroup(item.rawGroup);
                  } else if (item.rawContact) {
                    onSelectContact(item.rawContact);
                  }
                }}
                className={`w-full flex items-center gap-3.5 p-3.5 hover:bg-[#1A1A1A] transition-colors text-left group cursor-pointer relative ${
                  item.isPinned ? 'bg-slate-900/40' : ''
                }`}
              >
                {/* Avatar with Status */}
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-[#2C2C2C] group-hover:border-[#00A878]/50 transition-colors">
                    <img
                      src={item.avatarUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  {item.type === 'direct' && (
                    <span
                      className={`status-indicator ${
                        item.status === 'online'
                          ? 'online'
                          : item.status === 'away'
                          ? 'bg-[#FFD740]'
                          : 'offline'
                      }`}
                    />
                  )}
                  {item.type === 'group' && (
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] border border-slate-900 shadow">
                      <Icons.group className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h4 className="text-sm font-semibold text-[#FFFFFF] group-hover:text-[#00A878] transition truncate">
                        {item.name}
                      </h4>
                      {item.isPinned && (
                        <Icons.pin className="w-3 h-3 text-emerald-400 shrink-0" />
                      )}
                      {item.isMuted && (
                        <Icons.mute className="w-3 h-3 text-slate-400 shrink-0" />
                      )}
                    </div>

                    {item.identifier && (
                      <span className="text-[10px] font-mono text-[#00A878] bg-[#00A878]/10 px-1.5 py-0.5 rounded border border-[#00A878]/20 shrink-0">
                        {item.identifier}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-[#A0A0A0] truncate max-w-[220px]">
                      {item.bio}
                    </p>

                    {item.unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold shrink-0">
                        {item.unreadCount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Action Flyout on hover */}
                <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePinChat(item.id);
                    }}
                    className={`p-1.5 rounded-lg hover:bg-slate-700 transition ${
                      item.isPinned ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
                    }`}
                    title={item.isPinned ? 'Unpin' : 'Pin'}
                  >
                    <Icons.pin className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleMuteChat(item.id);
                    }}
                    className={`p-1.5 rounded-lg hover:bg-slate-700 transition ${
                      item.isMuted ? 'text-rose-400' : 'text-slate-400 hover:text-white'
                    }`}
                    title={item.isMuted ? 'Unmute' : 'Mute'}
                  >
                    <Icons.mute className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleArchiveChat(item.id);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
                    title={item.isArchived ? 'Unarchive' : 'Archive'}
                  >
                    <Icons.archive className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Buttons */}
      <div className="absolute bottom-16 right-4 z-10 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={onOpenCreateGroup}
          aria-label="New Group"
          className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-emerald-400 flex items-center justify-center shadow-lg border border-slate-700 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="Create New Group"
        >
          <Icons.group className="w-5 h-5" />
        </button>

        <button
          id="btn-fab-add-friend"
          type="button"
          onClick={onOpenAddFriend}
          aria-label="Add Friend"
          className="w-12 h-12 rounded-full bg-[#00A878] hover:bg-[#008F65] text-[#121212] flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer font-bold"
          title="Add New Contact"
        >
          <Icons.add className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
