import React from 'react';
import { Icons } from '../services/icons';
import { UserProfile } from '../types';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onOpenEditProfile: () => void;
  onOpenAddFriend: () => void;
  onOpenCreateGroup: () => void;
  onOpenSettings: () => void;
  onOpenGlobalSearch: () => void;
  onLogout: () => void;
}

export const SideMenu: React.FC<SideMenuProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenEditProfile,
  onOpenAddFriend,
  onOpenCreateGroup,
  onOpenSettings,
  onOpenGlobalSearch,
  onLogout
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        id="side-menu"
        className="relative w-[300px] max-w-[85vw] h-full bg-[#121212] border-r border-[#2C2C2C] flex flex-col shadow-2xl z-10 animate-in slide-in-from-left duration-200"
      >
        {/* User Profile Header */}
        <div id="user-profile-header" className="p-5 border-b border-[#2C2C2C] bg-[#1A1A1A]">
          <div className="flex justify-between items-start mb-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#00A878] shadow-md">
                <img
                  src={currentUser?.dpUrl}
                  alt={currentUser?.name || 'User'}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span
                className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#1A1A1A] ${
                  currentUser?.status === 'online'
                    ? 'bg-[#00E676]'
                    : currentUser?.status === 'away'
                    ? 'bg-[#FFD740]'
                    : 'bg-[#757575]'
                }`}
              />
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#A0A0A0] hover:text-[#FFFFFF] hover:bg-[#282828] transition-colors"
              aria-label="Close menu"
            >
              <Icons.close className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-base font-semibold text-[#FFFFFF] truncate">
            {currentUser?.name || 'User'}
          </h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs font-mono text-[#00A878] bg-[#00A878]/10 px-2 py-0.5 rounded border border-[#00A878]/20">
              {currentUser?.identifier}
            </span>
            <span className="text-[11px] text-[#A0A0A0] capitalize">
              • {currentUser?.status || 'Offline'}
            </span>
          </div>
          {currentUser?.bio && (
            <p className="text-xs text-[#A0A0A0] mt-2.5 line-clamp-2 leading-relaxed">
              {currentUser.bio}
            </p>
          )}
        </div>

        {/* Menu Actions */}
        <div className="flex-1 overflow-y-auto py-3 px-2 custom-scrollbar">
          <ul id="menu-items" className="space-y-1">
            <li>
              <button
                type="button"
                id="edit-profile-btn"
                onClick={() => {
                  onClose();
                  onOpenEditProfile();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#E0E0E0] hover:text-[#FFFFFF] hover:bg-[#1E1E1E] transition-colors text-left"
              >
                <Icons.edit className="w-5 h-5 text-[#00A878]" />
                <span>Edit Profile</span>
              </button>
            </li>

            <li>
              <button
                type="button"
                id="add-friend-btn"
                onClick={() => {
                  onClose();
                  onOpenAddFriend();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#E0E0E0] hover:text-[#FFFFFF] hover:bg-[#1E1E1E] transition-colors text-left"
              >
                <Icons.add className="w-5 h-5 text-[#00A878]" />
                <span>Add Contact</span>
              </button>
            </li>

            <li>
              <button
                type="button"
                id="create-group-btn"
                onClick={() => {
                  onClose();
                  onOpenCreateGroup();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#E0E0E0] hover:text-[#FFFFFF] hover:bg-[#1E1E1E] transition-colors text-left"
              >
                <Icons.group className="w-5 h-5 text-[#00A878]" />
                <span>New Group Chat</span>
              </button>
            </li>

            <li>
              <button
                type="button"
                id="global-search-btn"
                onClick={() => {
                  onClose();
                  onOpenGlobalSearch();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#E0E0E0] hover:text-[#FFFFFF] hover:bg-[#1E1E1E] transition-colors text-left"
              >
                <Icons.search className="w-5 h-5 text-[#00A878]" />
                <span>Global Search</span>
              </button>
            </li>

            <li>
              <button
                type="button"
                id="settings-btn"
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#E0E0E0] hover:text-[#FFFFFF] hover:bg-[#1E1E1E] transition-colors text-left"
              >
                <Icons.settings className="w-5 h-5 text-[#00A878]" />
                <span>Settings & Preferences</span>
              </button>
            </li>
          </ul>

          <div className="mt-6 p-3 bg-[#1A1A1A] border border-[#2C2C2C] rounded-2xl">
            <p className="text-[11px] font-medium text-[#A0A0A0] mb-1">Your AppyChat ID</p>
            <p className="text-xs font-mono font-bold text-[#00A878]">{currentUser?.identifier}</p>
            <p className="text-[10px] text-[#757575] mt-1.5 leading-normal">
              Share your AppyChat ID with friends to connect and chat in real-time.
            </p>
          </div>
        </div>

        {/* Footer / Logout */}
        <div className="p-3 border-t border-[#2C2C2C] bg-[#1A1A1A]">
          <button
            type="button"
            id="logout-btn"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#FF5252] hover:bg-[#FF5252]/10 transition-colors cursor-pointer"
          >
            <Icons.logout className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </div>
  );
};
