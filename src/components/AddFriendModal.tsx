import React, { useState } from 'react';
import { Icons } from '../services/icons';
import { UserProfile } from '../types';
import { findUserByIdentifier, findUserByEmail, sendFriendRequest } from '../services/firebase';

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  contacts: UserProfile[];
  onShowToast: (msg: string) => void;
}

export const AddFriendModal: React.FC<AddFriendModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  contacts,
  onShowToast
}) => {
  const [identifierInput, setIdentifierInput] = useState('');
  const [searchResult, setSearchResult] = useState<UserProfile | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const input = identifierInput.trim().toLowerCase();

    if (!input) {
      setErrorMsg('Please enter an identifier (e.g. ar-1234) or email.');
      setSearchResult(null);
      setHasSearched(true);
      return;
    }

    if (input === currentUser.identifier.toLowerCase()) {
      setErrorMsg('You cannot add your own identifier.');
      setSearchResult(null);
      setHasSearched(true);
      return;
    }

    setIsSearching(true);
    try {
      let found: UserProfile | null = null;
      if (input.includes('@')) {
        found = await findUserByEmail(input);
      } else {
        found = await findUserByIdentifier(input);
      }

      setSearchResult(found);
      setHasSearched(true);
      if (!found) {
        setErrorMsg('No user registered with this identifier or email.');
      }
    } catch (err: any) {
      console.error('Error finding user:', err);
      setErrorMsg('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async () => {
    if (!searchResult) return;

    // Check if already friends
    if (contacts.some((c) => c.uid === searchResult.uid)) {
      onShowToast(`${searchResult.name} is already in your contacts.`);
      return;
    }

    setIsSending(true);
    try {
      await sendFriendRequest(currentUser, searchResult);
      onShowToast(`Friend request sent to ${searchResult.name}!`);
      onClose();
    } catch (err) {
      console.error('Send friend request failed:', err);
      onShowToast('Could not send friend request.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div
        id="add-friend-modal"
        className="w-full max-w-sm bg-[#1A1A1A] border border-[#2C2C2C] rounded-3xl p-5 shadow-2xl relative select-none"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#2C2C2C] mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#00A878]/15 flex items-center justify-center text-[#00A878]">
              <Icons.add className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-[#FFFFFF]">Add Friend</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#A0A0A0] hover:text-[#FFFFFF] hover:bg-[#282828] transition-colors"
          >
            <Icons.close className="w-5 h-5" />
          </button>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-[#A0A0A0] mb-1.5">
              Enter User Identifier or Email
            </label>
            <div className="relative">
              <input
                id="input-friend-search"
                type="text"
                placeholder="e.g. ar-1042 or user@email.com"
                value={identifierInput}
                onChange={(e) => {
                  setIdentifierInput(e.target.value);
                  setErrorMsg('');
                  setHasSearched(false);
                }}
                className="w-full bg-[#282828] text-sm text-[#FFFFFF] placeholder-[#757575] font-mono px-3.5 py-2.5 rounded-xl border border-[#2C2C2C] focus:outline-none focus:border-[#00A878]"
                autoFocus
              />
              <button
                id="btn-search-friend"
                type="submit"
                disabled={isSearching}
                className="absolute right-2 top-2 bg-[#00A878] hover:bg-[#008F65] text-[#121212] px-3 py-1 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {isSearching ? '...' : 'Search'}
              </button>
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs text-[#FF5252] flex items-center gap-1 mt-1">
              <Icons.info className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </p>
          )}
        </form>

        {/* Search Result Card */}
        {hasSearched && (
          <div className="mt-4 pt-4 border-t border-[#2C2C2C]">
            {searchResult ? (
              <div className="bg-[#121212] border border-[#2C2C2C] rounded-2xl p-4 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#00A878] mb-2 shadow-md">
                  <img
                    src={searchResult.dpUrl}
                    alt={searchResult.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h4 className="text-sm font-semibold text-[#FFFFFF]">{searchResult.name}</h4>
                <span className="text-xs font-mono text-[#00A878] bg-[#00A878]/10 px-2 py-0.5 rounded border border-[#00A878]/20 mt-1 mb-2">
                  {searchResult.identifier}
                </span>
                {searchResult.bio && (
                  <p className="text-xs text-[#A0A0A0] line-clamp-2 mb-3 max-w-[240px]">
                    {searchResult.bio}
                  </p>
                )}

                <button
                  id="btn-send-friend-req"
                  onClick={handleSendRequest}
                  disabled={isSending}
                  className="w-full bg-[#00A878] hover:bg-[#008F65] text-[#121212] font-semibold text-xs py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  <Icons.add className="w-4 h-4" />
                  <span>{isSending ? 'Sending Request...' : 'Send Friend Request'}</span>
                </button>
              </div>
            ) : (
              !errorMsg && (
                <div className="text-center py-4 text-xs text-[#A0A0A0]">
                  No user found matching <strong className="text-[#FFFFFF] font-mono">{identifierInput}</strong>
                </div>
              )
            )}
          </div>
        )}

        {/* Share your identifier tip */}
        <div className="mt-4 p-3 bg-[#121212] rounded-xl border border-[#2C2C2C] text-[11px] text-[#A0A0A0] flex items-center justify-between">
          <span>Your ID: <strong className="font-mono text-[#00A878]">{currentUser.identifier}</strong></span>
          <span className="text-[10px] text-[#757575]">Share with friends to connect</span>
        </div>
      </div>
    </div>
  );
};
