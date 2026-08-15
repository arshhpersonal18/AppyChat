import React, { useState } from 'react';
import { Icons } from '../services/icons';
import { UserProfile } from '../types';
import { generateInitialsAvatar } from '../services/avatar';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSave: (updated: UserProfile) => void;
  onShowToast: (msg: string) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSave,
  onShowToast
}) => {
  const [name, setName] = useState(currentUser.name);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [status, setStatus] = useState<'online' | 'offline' | 'away'>(currentUser.status || 'online');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const previewAvatar = generateInitialsAvatar(name || 'User', currentUser.identifier);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();

    if (!cleanName || cleanName.length > 20) {
      setErrorMsg('Name must be between 1 and 20 characters.');
      return;
    }

    if (bio.length > 100) {
      setErrorMsg('Bio cannot exceed 100 characters.');
      return;
    }

    const updated: UserProfile = {
      ...currentUser,
      name: cleanName,
      bio: bio.trim(),
      status,
      dpUrl: previewAvatar,
      last_changed: Date.now()
    };

    onSave(updated);
    onShowToast('Profile updated successfully!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in select-none">
      <div
        id="profile-modal"
        className="w-full max-w-sm bg-[#1A1A1A] border border-[#2C2C2C] rounded-3xl p-5 shadow-2xl relative"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#2C2C2C] mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#00A878]/15 flex items-center justify-center text-[#00A878]">
              <Icons.edit className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-[#FFFFFF]">Edit Profile</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#A0A0A0] hover:text-[#FFFFFF] hover:bg-[#282828] transition-colors"
          >
            <Icons.close className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Preview */}
          <div className="flex flex-col items-center">
            <div className="relative mb-2">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#00A878] shadow-lg">
                <img src={previewAvatar} alt="Preview" className="w-full h-full object-cover" />
              </div>
            </div>
            <span className="text-[11px] text-[#A0A0A0]">
              Avatar auto-generated from your initials
            </span>
          </div>

          {/* Identifier Display */}
          <div>
            <label className="block text-xs font-medium text-[#A0A0A0] mb-1">
              Your AppyChat Identifier
            </label>
            <div className="w-full bg-[#121212] text-sm text-[#00A878] font-mono px-3.5 py-2.5 rounded-xl border border-[#2C2C2C] flex items-center justify-between">
              <span>{currentUser.identifier}</span>
              <span className="text-[10px] text-[#757575] font-sans">Permanent ID</span>
            </div>
          </div>

          {/* Name Field */}
          <div>
            <label className="block text-xs font-medium text-[#A0A0A0] mb-1">
              Display Name <span className="text-[#FF5252]">*</span> ({name.length}/20)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value.slice(0, 20));
                setErrorMsg('');
              }}
              placeholder="Your name"
              maxLength={20}
              className="w-full bg-[#282828] text-sm text-[#FFFFFF] placeholder-[#757575] px-3.5 py-2.5 rounded-xl border border-[#2C2C2C] focus:outline-none focus:border-[#00A878]"
              required
            />
          </div>

          {/* Bio Field */}
          <div>
            <label className="block text-xs font-medium text-[#A0A0A0] mb-1">
              Bio ({bio.length}/100)
            </label>
            <textarea
              value={bio}
              onChange={(e) => {
                setBio(e.target.value.slice(0, 100));
                setErrorMsg('');
              }}
              placeholder="A few words about you..."
              maxLength={100}
              rows={2}
              className="w-full bg-[#282828] text-sm text-[#FFFFFF] placeholder-[#757575] px-3.5 py-2 rounded-xl border border-[#2C2C2C] focus:outline-none focus:border-[#00A878] resize-none"
            />
          </div>

          {/* Status Field */}
          <div>
            <label className="block text-xs font-medium text-[#A0A0A0] mb-1.5">
              Presence Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['online', 'away', 'offline'] as const).map((st) => (
                <button
                  type="button"
                  key={st}
                  onClick={() => setStatus(st)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 capitalize transition-all ${
                    status === st
                      ? 'bg-[#00A878]/15 border-[#00A878] text-[#FFFFFF]'
                      : 'bg-[#282828] border-[#2C2C2C] text-[#A0A0A0] hover:text-[#FFFFFF]'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      st === 'online'
                        ? 'bg-[#00E676]'
                        : st === 'away'
                        ? 'bg-[#FFD740]'
                        : 'bg-[#757575]'
                    }`}
                  />
                  <span>{st}</span>
                </button>
              ))}
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs text-[#FF5252] flex items-center gap-1">
              <Icons.info className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </p>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#282828] hover:bg-[#333333] text-[#E0E0E0] font-semibold text-xs py-2.5 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-[#00A878] hover:bg-[#008F65] text-[#121212] font-semibold text-xs py-2.5 rounded-xl transition-colors shadow-md"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
