import React from 'react';
import { Icons } from '../services/icons';
import { NavigationTab } from '../types';

interface BottomNavProps {
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  requestCount: number;
  unreadCountTotal: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
  requestCount,
  unreadCountTotal
}) => {
  return (
    <nav
      id="bottom-nav"
      className="bg-[#1A1A1A] border-t border-[#2C2C2C] flex h-14 shrink-0 select-none z-10"
      role="navigation"
      aria-label="Main Navigation"
    >
      {/* Home / Chats Tab */}
      <button
        type="button"
        className={`flex-1 bg-transparent border-0 flex flex-col items-center justify-center gap-1 text-xs transition-colors relative cursor-pointer ${
          currentTab === 'home' ? 'text-[#00A878] font-medium' : 'text-[#A0A0A0] hover:text-[#E0E0E0]'
        }`}
        onClick={() => onTabChange('home')}
        aria-selected={currentTab === 'home'}
        aria-label="Home Chats"
      >
        {currentTab === 'home' ? (
          <Icons.homeActive className="w-5 h-5" />
        ) : (
          <Icons.home className="w-5 h-5" />
        )}
        <span>Home</span>
        {unreadCountTotal > 0 && (
          <span className="absolute top-1.5 right-[28%] bg-[#00A878] text-[#121212] text-[10px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center">
            {unreadCountTotal > 9 ? '9+' : unreadCountTotal}
          </span>
        )}
      </button>

      {/* Friend Requests Tab */}
      <button
        type="button"
        className={`flex-1 bg-transparent border-0 flex flex-col items-center justify-center gap-1 text-xs transition-colors relative cursor-pointer ${
          currentTab === 'requests' ? 'text-[#00A878] font-medium' : 'text-[#A0A0A0] hover:text-[#E0E0E0]'
        }`}
        onClick={() => onTabChange('requests')}
        aria-selected={currentTab === 'requests'}
        aria-label="Friend Requests"
      >
        {currentTab === 'requests' ? (
          <Icons.requestsActive className="w-5 h-5" />
        ) : (
          <Icons.requests className="w-5 h-5" />
        )}
        <span>Requests</span>
        {requestCount > 0 && (
          <span
            id="request-badge"
            className="absolute top-1.5 right-[25%] bg-[#00A878] text-[#121212] text-[10px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center animate-pulse"
          >
            {requestCount}
          </span>
        )}
      </button>

      {/* Call History Tab */}
      <button
        type="button"
        className={`flex-1 bg-transparent border-0 flex flex-col items-center justify-center gap-1 text-xs transition-colors relative cursor-pointer ${
          currentTab === 'calls' ? 'text-[#00A878] font-medium' : 'text-[#A0A0A0] hover:text-[#E0E0E0]'
        }`}
        onClick={() => onTabChange('calls')}
        aria-selected={currentTab === 'calls'}
        aria-label="Call History"
      >
        {currentTab === 'calls' ? (
          <Icons.callsActive className="w-5 h-5" />
        ) : (
          <Icons.calls className="w-5 h-5" />
        )}
        <span>Calls</span>
      </button>
    </nav>
  );
};
