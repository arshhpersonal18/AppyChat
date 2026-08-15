import React, { useState } from 'react';
import { Icons } from '../services/icons';

interface EmojiStickerPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onSelectSticker?: (stickerUrl: string) => void;
  onSelectGif?: (gifUrl: string) => void;
  onClose?: () => void;
}

const EMOJI_CATEGORIES: Record<string, string[]> = {
  'Frequently Used': ['❤️', '😂', '👍', '🔥', '🎉', '😍', '👏', '🙏', '😊', '🥳', '😎', '💯'],
  'Smileys & Emotion': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐'],
  'Gestures & People': ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄'],
  'Hearts & Symbols': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳'],
  'Animals & Nature': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🦣', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🦬', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐈‍⬛', '🐓', '🦃', '🦤', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝', '🦨', '🦡', '🦫', '🦦', '🦥', '🐁', '🐀', '🐿️', '🦔'],
  'Food & Drink': ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🌭', '🍔', '🍟', '🍕', '🫓', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '☕', '🫖', '🍵', '🍶', '🍾', '🍷', '🍸', '🍹', '🍺', '🍻', '🥂', '🥃', '🥤', '🧋', '🧃', '🧉', '🧊']
};

const APP_STICKERS = [
  { id: 'stk_hello', title: 'Hello!', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=150&auto=format&fit=crop&q=60' },
  { id: 'stk_love', title: 'With Love', url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=150&auto=format&fit=crop&q=60' },
  { id: 'stk_party', title: 'Party Time', url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=150&auto=format&fit=crop&q=60' },
  { id: 'stk_coffee', title: 'Coffee Time', url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=150&auto=format&fit=crop&q=60' },
  { id: 'stk_cat', title: 'Cute Cat', url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=150&auto=format&fit=crop&q=60' },
  { id: 'stk_dog', title: 'Happy Dog', url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=150&auto=format&fit=crop&q=60' },
  { id: 'stk_fire', title: 'On Fire', url: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32b?w=150&auto=format&fit=crop&q=60' },
  { id: 'stk_peace', title: 'Peace & Relax', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=150&auto=format&fit=crop&q=60' }
];

const CURATED_GIFS = [
  { id: 'gif_celebrate', title: 'Celebrate', url: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif' },
  { id: 'gif_laugh', title: 'Laughing', url: 'https://media.giphy.com/media/10JhviFuU2gWD6/giphy.gif' },
  { id: 'gif_thumbsup', title: 'Thumbs Up', url: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif' },
  { id: 'gif_mindblown', title: 'Mind Blown', url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif' },
  { id: 'gif_dance', title: 'Happy Dance', url: 'https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif' },
  { id: 'gif_cat_vibing', title: 'Cat Jam', url: 'https://media.giphy.com/media/jpbnoe3UIa8TU8LM13/giphy.gif' },
  { id: 'gif_nod', title: 'Nodding Yes', url: 'https://media.giphy.com/media/NEvPzZ8bd1V4Y/giphy.gif' },
  { id: 'gif_bye', title: 'Wave Goodbye', url: 'https://media.giphy.com/media/m9eG1qVjvNsfWgHtgc/giphy.gif' }
];

export const EmojiStickerPicker: React.FC<EmojiStickerPickerProps> = ({
  onSelectEmoji,
  onSelectSticker,
  onSelectGif,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'emojis' | 'stickers' | 'gifs'>('emojis');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Frequently Used');

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden w-full max-w-sm h-80 text-slate-100 z-40">
      {/* Top Header & Tab selector */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab('emojis')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
              activeTab === 'emojis' ? 'bg-emerald-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Emojis
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('stickers')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
              activeTab === 'stickers' ? 'bg-emerald-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Stickers
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('gifs')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
              activeTab === 'gifs' ? 'bg-emerald-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            GIFs
          </button>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition"
            aria-label="Close picker"
          >
            <Icons.close className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="p-2 border-b border-slate-800">
        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-800 rounded-xl text-xs">
          <Icons.search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="bg-transparent text-white outline-none w-full placeholder-slate-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-slate-400 hover:text-white"
            >
              <Icons.close className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {activeTab === 'emojis' && (
          <div className="space-y-3">
            {Object.entries(EMOJI_CATEGORIES).map(([catTitle, emojis]) => {
              const filtered = searchQuery
                ? emojis
                : emojis;

              return (
                <div key={catTitle}>
                  <h5 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 px-0.5">
                    {catTitle}
                  </h5>
                  <div className="grid grid-cols-8 gap-1">
                    {filtered.map((emoji, idx) => (
                      <button
                        key={`${catTitle}_${idx}`}
                        type="button"
                        onClick={() => onSelectEmoji(emoji)}
                        className="text-2xl p-1.5 rounded-lg hover:bg-slate-800 active:scale-125 transition flex items-center justify-center select-none"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'stickers' && (
          <div className="grid grid-cols-3 gap-2">
            {APP_STICKERS.filter(s => !searchQuery || s.title.toLowerCase().includes(searchQuery.toLowerCase())).map((stk) => (
              <button
                key={stk.id}
                type="button"
                onClick={() => onSelectSticker && onSelectSticker(stk.url)}
                className="group p-2 bg-slate-800/60 hover:bg-slate-800 rounded-xl border border-slate-700/50 flex flex-col items-center gap-1.5 transition active:scale-95"
              >
                <img
                  src={stk.url}
                  alt={stk.title}
                  className="w-16 h-16 object-cover rounded-lg group-hover:scale-105 transition"
                  referrerPolicy="no-referrer"
                />
                <span className="text-[10px] text-slate-300 font-medium truncate w-full text-center">
                  {stk.title}
                </span>
              </button>
            ))}
          </div>
        )}

        {activeTab === 'gifs' && (
          <div className="grid grid-cols-2 gap-2">
            {CURATED_GIFS.filter(g => !searchQuery || g.title.toLowerCase().includes(searchQuery.toLowerCase())).map((gif) => (
              <button
                key={gif.id}
                type="button"
                onClick={() => onSelectGif && onSelectGif(gif.url)}
                className="relative group overflow-hidden rounded-xl border border-slate-800 aspect-video bg-slate-800/80 active:scale-95 transition"
              >
                <img
                  src={gif.url}
                  alt={gif.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5">
                  <span className="text-[10px] text-white font-medium truncate">{gif.title}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
