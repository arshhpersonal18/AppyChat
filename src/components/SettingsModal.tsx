import React, { useState } from 'react';
import { Icons } from '../services/icons';
import { UserProfile, AppSettings } from '../types';
import { updateUserProfile, unblockUser } from '../services/firebase';
import { generateInitialsAvatar } from '../services/avatar';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  appSettings: AppSettings;
  onUpdateAppSettings: (newSettings: Partial<AppSettings>) => void;
  onSignOut: () => void;
  allUsers?: UserProfile[];
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  appSettings,
  onUpdateAppSettings,
  onSignOut,
  allUsers = []
}) => {
  const [activeSection, setActiveSection] = useState<'account' | 'appearance' | 'privacy' | 'notifications' | 'storage' | 'about'>('account');
  const [name, setName] = useState(currentUser.name);
  const [bio, setBio] = useState(currentUser.bio);
  const [dpUrl, setDpUrl] = useState(currentUser.dpUrl);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(currentUser.identifier);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setDpUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRegenerateInitials = () => {
    const newAvatar = generateInitialsAvatar(name, currentUser.identifier);
    setDpUrl(newAvatar);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateUserProfile({
        ...currentUser,
        name: name.trim() || currentUser.name,
        bio: bio.trim(),
        dpUrl
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Error updating profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const accentColors = [
    { name: 'Emerald Mint', value: '#00A878', class: 'bg-[#00A878]' },
    { name: 'Electric Blue', value: '#3B82F6', class: 'bg-blue-500' },
    { name: 'Royal Violet', value: '#8B5CF6', class: 'bg-purple-500' },
    { name: 'Sunset Amber', value: '#F59E0B', class: 'bg-amber-500' },
    { name: 'Rose Red', value: '#EF4444', class: 'bg-rose-500' },
    { name: 'Neon Teal', value: '#14B8A6', class: 'bg-teal-500' }
  ];

  const blockedList = currentUser.blockedUids || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-slate-100 flex flex-col md:flex-row max-h-[88vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Settings Navigation */}
        <div className="w-full md:w-56 bg-slate-950/70 border-b md:border-b-0 md:border-r border-slate-800 p-4 flex flex-col justify-between shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 px-3 py-2 text-emerald-400 font-bold text-sm mb-2">
              <Icons.settings className="w-5 h-5" />
              <span>Settings</span>
            </div>

            {[
              { id: 'account', label: 'Account & Profile', icon: Icons.user },
              { id: 'appearance', label: 'Theme & Styling', icon: Icons.palette },
              { id: 'privacy', label: 'Privacy & Security', icon: Icons.shield },
              { id: 'notifications', label: 'Notifications', icon: Icons.bell },
              { id: 'storage', label: 'Storage & Cache', icon: Icons.fileDoc },
              { id: 'about', label: 'About AppyChat', icon: Icons.info },
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id as any)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition text-left ${
                    isActive
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onSignOut}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
            >
              <Icons.logout className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col min-h-0 bg-slate-900">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
            <h3 className="font-bold text-base text-white capitalize">
              {activeSection.replace('-', ' ')}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <Icons.close className="w-5 h-5" />
            </button>
          </div>

          {/* Section Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-xs">
            {/* 1. Account Section */}
            {activeSection === 'account' && (
              <div className="space-y-5">
                {/* Profile Photo */}
                <div className="flex items-center gap-4">
                  <img
                    src={dpUrl}
                    alt={name}
                    className="w-20 h-20 rounded-full object-cover shadow-lg border-2 border-emerald-500/40 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium cursor-pointer border border-slate-700 transition">
                        Upload Photo
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarFileUpload}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={handleRegenerateInitials}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium border border-slate-700 transition"
                      >
                        Reset Initial DP
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">JPG, PNG, or GIF up to 5MB.</p>
                  </div>
                </div>

                {/* Display Name */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Display Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Bio / Status */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">About / Status</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-emerald-500"
                  />
                </div>

                {/* AppyChat ID */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Your AppyChat ID</label>
                  <div className="flex items-center justify-between px-3 py-2 bg-slate-800/80 rounded-xl border border-slate-700">
                    <span className="font-mono text-emerald-400 font-bold">{currentUser.identifier}</span>
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="text-slate-400 hover:text-white flex items-center gap-1 font-semibold"
                    >
                      <Icons.copy className="w-3.5 h-3.5" />
                      {copiedId ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                {saveSuccess && (
                  <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 rounded-xl text-center">
                    Profile successfully updated!
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-semibold rounded-xl transition shadow-lg shadow-emerald-500/20"
                >
                  {saving ? 'Saving Changes...' : 'Save Profile Details'}
                </button>
              </div>
            )}

            {/* 2. Appearance Section */}
            {activeSection === 'appearance' && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="font-semibold text-slate-300">Theme Mode</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['dark', 'light', 'amoled'] as const).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => onUpdateAppSettings({ theme: t })}
                        className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 font-semibold capitalize transition ${
                          appSettings.theme === t
                            ? 'bg-emerald-950/60 border-emerald-500 text-white'
                            : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="text-sm">{t === 'dark' ? '🌙' : t === 'light' ? '☀️' : '⬛'}</span>
                        <span>{t}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accent Color */}
                <div className="space-y-2">
                  <label className="font-semibold text-slate-300">Accent Color</label>
                  <div className="grid grid-cols-3 gap-2">
                    {accentColors.map(c => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => onUpdateAppSettings({ accentColor: c.value })}
                        className={`flex items-center gap-2 p-2.5 rounded-2xl border transition ${
                          appSettings.accentColor === c.value
                            ? 'bg-slate-800 border-white text-white'
                            : 'bg-slate-800/50 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full ${c.class} shadow-sm shrink-0`} />
                        <span className="truncate">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message Bubble Style */}
                <div className="space-y-2">
                  <label className="font-semibold text-slate-300">Message Bubble Shape</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['modern', 'minimal', 'rounded'] as const).map(style => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => onUpdateAppSettings({ bubbleStyle: style })}
                        className={`p-2.5 rounded-2xl border text-center capitalize font-semibold transition ${
                          appSettings.bubbleStyle === style
                            ? 'bg-emerald-950/60 border-emerald-500 text-white'
                            : 'bg-slate-800/50 border-slate-700/60 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 3. Privacy & Security */}
            {activeSection === 'privacy' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-2xl border border-slate-700/50">
                  <div>
                    <h5 className="font-semibold text-white">Read Receipts</h5>
                    <p className="text-[11px] text-slate-400">Show blue checkmarks when messages are read</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={appSettings.readReceipts}
                    onChange={(e) => onUpdateAppSettings({ readReceipts: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-2xl border border-slate-700/50">
                  <div>
                    <h5 className="font-semibold text-white">Typing Indicators</h5>
                    <p className="text-[11px] text-slate-400">Show when you are currently typing</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={appSettings.typingIndicator}
                    onChange={(e) => onUpdateAppSettings({ typingIndicator: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500 cursor-pointer"
                  />
                </div>

                {/* Blocked Users Manager */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <h5 className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                    Blocked Users ({blockedList.length})
                  </h5>
                  {blockedList.length === 0 ? (
                    <p className="text-slate-400 text-[11px]">You have not blocked any users.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {blockedList.map(uid => {
                        const blockedProfile = allUsers.find(u => u.uid === uid);
                        return (
                          <div
                            key={uid}
                            className="flex items-center justify-between p-2.5 bg-slate-800/50 rounded-xl border border-slate-700/40"
                          >
                            <span className="font-semibold text-white truncate">
                              {blockedProfile ? blockedProfile.name : `User (${uid.slice(0, 8)})`}
                            </span>
                            <button
                              type="button"
                              onClick={() => unblockUser(currentUser.uid, uid)}
                              className="px-2.5 py-1 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                            >
                              Unblock
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. Notifications */}
            {activeSection === 'notifications' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-2xl border border-slate-700/50">
                  <div>
                    <h5 className="font-semibold text-white">Audio Sounds & Ringtones</h5>
                    <p className="text-[11px] text-slate-400">Play chime on incoming messages & calls</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={appSettings.soundEnabled}
                    onChange={(e) => onUpdateAppSettings({ soundEnabled: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-2xl border border-slate-700/50">
                  <div>
                    <h5 className="font-semibold text-white">In-App Toast Banners</h5>
                    <p className="text-[11px] text-slate-400">Show notification toasts for new messages</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={appSettings.toastNotifications}
                    onChange={(e) => onUpdateAppSettings({ toastNotifications: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* 5. Storage & Cache */}
            {activeSection === 'storage' && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/40 space-y-3">
                  <h5 className="font-semibold text-white">Local Storage & Cache</h5>
                  <div className="space-y-1.5 text-slate-300">
                    <div className="flex justify-between">
                      <span>Message Drafts & State:</span>
                      <span className="font-mono text-emerald-400">Healthy (Local Cache)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Offline Media Previews:</span>
                      <span className="font-mono text-emerald-400">Synchronized</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem('appychat_chat_settings');
                      alert('Local cache reset successfully.');
                    }}
                    className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded-xl transition"
                  >
                    Clear Local State Cache
                  </button>
                </div>
              </div>
            )}

            {/* 6. About AppyChat */}
            {activeSection === 'about' && (
              <div className="space-y-4 text-center py-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white text-2xl font-black mx-auto shadow-xl">
                  AC
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">AppyChat</h4>
                  <p className="text-xs text-emerald-400 font-semibold">Version 3.0 Pro</p>
                </div>
                <p className="text-slate-400 text-xs max-w-sm mx-auto leading-relaxed">
                  Real-time communications platform featuring high-definition WebRTC voice/video calling, rich multi-media messaging, expressive reactions, group management, and synthesized ringtones.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
