import React, { useState } from 'react';
import { Icons } from '../services/icons';

interface MediaViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string;
  mediaType: 'image' | 'video' | 'doc';
  senderName?: string;
  timestamp?: number;
  caption?: string;
  fileName?: string;
}

export const MediaViewerModal: React.FC<MediaViewerModalProps> = ({
  isOpen,
  onClose,
  mediaUrl,
  mediaType,
  senderName = 'Media',
  timestamp,
  caption,
  fileName
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);

  if (!isOpen || !mediaUrl) return null;

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setZoomLevel(1);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = mediaUrl;
    link.download = fileName || `appychat_media_${Date.now()}.${mediaType === 'video' ? 'mp4' : mediaType === 'image' ? 'png' : 'pdf'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top Header Bar */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 active:scale-95 transition"
            aria-label="Close"
          >
            <Icons.back className="w-6 h-6" />
          </button>
          <div>
            <h3 className="font-semibold text-sm leading-tight text-white">{senderName}</h3>
            {timestamp && (
              <p className="text-xs text-white/60">
                {new Date(timestamp).toLocaleDateString()} at {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {mediaType === 'image' && (
            <>
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-2 rounded-full hover:bg-white/10 transition text-sm font-semibold"
                title="Zoom In"
              >
                +
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-2 rounded-full hover:bg-white/10 transition text-sm font-semibold"
                title="Zoom Out"
              >
                -
              </button>
              {zoomLevel !== 1 && (
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="px-2 py-1 bg-white/10 rounded text-xs hover:bg-white/20 transition"
                >
                  Reset
                </button>
              )}
            </>
          )}

          <button
            type="button"
            onClick={handleDownload}
            className="p-2 rounded-full hover:bg-white/10 transition text-white"
            title="Download file"
          >
            <Icons.download className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition"
            title="Close"
          >
            <Icons.close className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        className="flex-1 flex items-center justify-center p-4 overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {mediaType === 'image' && (
          <div className="max-w-full max-h-full overflow-auto flex items-center justify-center">
            <img
              src={mediaUrl}
              alt="Media preview"
              className="max-w-full max-h-[80vh] object-contain transition-transform duration-150 select-none shadow-2xl rounded-lg"
              style={{ transform: `scale(${zoomLevel})` }}
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        {mediaType === 'video' && (
          <video
            src={mediaUrl}
            controls
            autoPlay
            className="max-w-full max-h-[80vh] rounded-lg shadow-2xl"
          />
        )}

        {mediaType === 'doc' && (
          <div className="flex flex-col items-center justify-center p-8 bg-slate-900/90 rounded-2xl border border-slate-800 text-center max-w-md">
            <Icons.fileDoc className="w-16 h-16 text-emerald-400 mb-4" />
            <h4 className="text-lg font-semibold mb-2 break-all">{fileName || 'Document File'}</h4>
            <p className="text-sm text-slate-400 mb-6">Click download below to view this document.</p>
            <button
              type="button"
              onClick={handleDownload}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-medium rounded-xl flex items-center gap-2 transition shadow-lg shadow-emerald-500/20"
            >
              <Icons.download className="w-5 h-5" />
              Download Document
            </button>
          </div>
        )}
      </div>

      {/* Bottom Caption Bar */}
      {caption && (
        <div
          className="p-4 bg-gradient-to-t from-black/90 via-black/70 to-transparent text-center z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-sm text-white/90 max-w-xl mx-auto">{caption}</p>
        </div>
      )}
    </div>
  );
};
