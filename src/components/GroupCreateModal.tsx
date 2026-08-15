import React, { useState } from 'react';
import { Icons } from '../services/icons';
import { UserProfile, GroupChat } from '../types';
import { createGroupChat } from '../services/firebase';
import { generateInitialsAvatar } from '../services/avatar';

interface GroupCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  contacts: UserProfile[];
  onGroupCreated: (newGroup: GroupChat) => void;
}

export const GroupCreateModal: React.FC<GroupCreateModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  contacts,
  onGroupCreated
}) => {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMemberUids, setSelectedMemberUids] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleMember = (uid: string) => {
    setSelectedMemberUids(prev =>
      prev.includes(uid) ? prev.filter(x => x !== uid) : [...prev, uid]
    );
  };

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      setError('Please enter a group name');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const selectedProfiles = contacts.filter(c => selectedMemberUids.includes(c.uid));
      const finalAvatar = avatarUrl || generateInitialsAvatar(groupName.trim(), 'GRP');
      const group = await createGroupChat(
        groupName.trim(),
        description.trim(),
        finalAvatar,
        currentUser,
        selectedProfiles
      );
      onGroupCreated(group);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.identifier.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 space-y-5 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400">
            <Icons.group className="w-6 h-6" />
            <h3 className="text-lg font-bold text-white">Create New Group</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <Icons.close className="w-5 h-5" />
          </button>
        </div>

        {/* Group Info Inputs */}
        <div className="flex items-center gap-4">
          <label className="relative w-14 h-14 rounded-full bg-slate-800 border-2 border-dashed border-slate-600 hover:border-emerald-400 flex items-center justify-center cursor-pointer overflow-hidden shrink-0 group">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Group Avatar" className="w-full h-full object-cover" />
            ) : (
              <Icons.image className="w-6 h-6 text-slate-400 group-hover:text-emerald-400" />
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFileUpload}
            />
          </label>

          <div className="flex-1 space-y-2">
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group Subject / Name..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
            />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional Group Description..."
              className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
            />
          </div>
        </div>

        {/* Member Selector */}
        <div className="flex-1 flex flex-col min-h-0 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-300">
              Add Members ({selectedMemberUids.length} selected)
            </h4>
            {selectedMemberUids.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedMemberUids([])}
                className="text-[11px] text-rose-400 hover:underline"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-xl text-xs">
            <Icons.search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts..."
              className="bg-transparent text-white outline-none w-full placeholder-slate-500"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {filteredContacts.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                No contacts available. Add contacts to invite them.
              </div>
            ) : (
              filteredContacts.map(c => {
                const isSelected = selectedMemberUids.includes(c.uid);
                return (
                  <button
                    key={c.uid}
                    type="button"
                    onClick={() => toggleMember(c.uid)}
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
                      <h5 className="font-semibold text-sm text-white truncate">{c.name}</h5>
                      <p className="text-xs text-slate-400 truncate">@{c.identifier}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${
                      isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-600'
                    }`}>
                      {isSelected && <Icons.check className="w-3.5 h-3.5" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {error && <p className="text-xs text-rose-400">{error}</p>}

        {/* Action Footer */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!groupName.trim() || loading}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:pointer-events-none active:scale-95 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition shadow-lg shadow-emerald-500/20"
          >
            <Icons.add className="w-4 h-4" />
            {loading ? 'Creating Group...' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
};
