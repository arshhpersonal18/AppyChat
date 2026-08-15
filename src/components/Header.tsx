import React from 'react';
import { Icons } from '../services/icons';
import { UserProfile } from '../types';

interface HeaderProps {
  currentUser: UserProfile | null;
  onOpenMenu: () => void;
  showSearch: boolean;
  onToggleSearch: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onOpenMenu,
  showSearch,
  onToggleSearch,
  title = 'AppyChat'
}) => {
  return (
    <header
      id="app-header"
      className="bg-[#1A1A1A] px-4 py-3 flex justify-between items-center border-b border-[#2C2C2C] h-14 shrink-0 select-none"
    >
      <div className="flex items-center gap-3">
        <button
          id="menu-btn"
          aria-label="Open menu"
          onClick={onOpenMenu}
          className="p-1.5 rounded-lg text-[#A0A0A0] hover:text-[#FFFFFF] hover:bg-[#282828] transition-colors focus:outline-none focus:ring-1 focus:ring-[#00A878]"
        >
          <Icons.menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <h1 id="app-title" className="text-lg font-semibold text-[#FFFFFF] tracking-tight">
            {title}
          </h1>
          {currentUser && (
            <span className="text-[10px] font-medium bg-[#282828] text-[#00A878] px-2 py-0.5 rounded-full border border-[#00A878]/30">
              {currentUser.identifier}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          id="search-btn"
          aria-label="Search"
          onClick={onToggleSearch}
          className={`p-1.5 rounded-lg transition-colors focus:outline-none ${
            showSearch ? 'text-[#00A878] bg-[#00A878]/10' : 'text-[#A0A0A0] hover:text-[#FFFFFF] hover:bg-[#282828]'
          }`}
        >
          <Icons.search className="w-5 h-5" />
        </button>

        {currentUser && (
          <button
            onClick={onOpenMenu}
            className="w-8 h-8 rounded-full overflow-hidden border border-[#2C2C2C] hover:border-[#00A878] transition-colors focus:outline-none"
            aria-label="View Profile"
          >
            <img
              src={currentUser.dpUrl}
              alt={currentUser.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </button>
        )}
      </div>
    </header>
  );
};
