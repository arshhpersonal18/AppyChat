import React, { useState } from 'react';
import { Icons } from '../services/icons';
import { ChatCategory } from '../types';

interface CategoryFilterBarProps {
  activeCategory: string;
  onSelectCategory: (categoryId: string) => void;
  unreadCount: number;
  groupsCount: number;
  pinnedCount: number;
  archivedCount: number;
  customCategories: ChatCategory[];
  onAddCustomCategory: (name: string) => void;
  onDeleteCustomCategory?: (categoryId: string) => void;
}

export const CategoryFilterBar: React.FC<CategoryFilterBarProps> = ({
  activeCategory,
  onSelectCategory,
  unreadCount,
  groupsCount,
  pinnedCount,
  archivedCount,
  customCategories,
  onAddCustomCategory,
  onDeleteCustomCategory
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const handleCreate = () => {
    if (!newCatName.trim()) return;
    onAddCustomCategory(newCatName.trim());
    setNewCatName('');
    setShowAddModal(false);
  };

  const standardCategories = [
    { id: 'all', name: 'All Chats', count: null },
    { id: 'unread', name: 'Unread', count: unreadCount },
    { id: 'groups', name: 'Groups', count: groupsCount },
    { id: 'personal', name: 'Direct', count: null },
    { id: 'pinned', name: 'Pinned', count: pinnedCount },
    { id: 'archived', name: 'Archived', count: archivedCount }
  ];

  return (
    <div className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto no-scrollbar select-none border-b border-slate-800/80 bg-slate-950/40">
      {standardCategories.map(cat => {
        const isActive = activeCategory === cat.id;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 shrink-0 active:scale-95 ${
              isActive
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span>{cat.name}</span>
            {cat.count !== null && cat.count > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                isActive ? 'bg-white text-emerald-600' : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {cat.count}
              </span>
            )}
          </button>
        );
      })}

      {/* Custom user-defined category tabs */}
      {customCategories.map(cat => {
        const isActive = activeCategory === cat.id;
        return (
          <div key={cat.id} className="relative group shrink-0">
            <button
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 active:scale-95 ${
                isActive
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>{cat.name}</span>
            </button>
            {onDeleteCustomCategory && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteCustomCategory(cat.id);
                }}
                className="hidden group-hover:flex absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white items-center justify-center text-[10px] shadow"
                title="Delete Category"
              >
                ×
              </button>
            )}
          </div>
        );
      })}

      {/* Plus button to add custom category folder */}
      <button
        type="button"
        onClick={() => setShowAddModal(true)}
        className="p-1.5 rounded-full bg-slate-800/70 hover:bg-slate-800 text-slate-400 hover:text-white transition shrink-0"
        title="Add Custom Category / Tag"
      >
        <Icons.add className="w-4 h-4" />
      </button>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-white">Create Custom Category</h4>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <Icons.close className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="e.g. Work, Family, Gaming..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
              autoFocus
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={!newCatName.trim()}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
