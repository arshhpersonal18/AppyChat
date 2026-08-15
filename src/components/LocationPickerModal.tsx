import React, { useState } from 'react';
import { Icons } from '../services/icons';
import { LocationData } from '../types';

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendLocation: (location: LocationData) => void;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  onClose,
  onSendLocation
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLoc, setCurrentLoc] = useState<LocationData | null>(null);
  const [placeName, setPlaceName] = useState('Current Live Location');

  if (!isOpen) return null;

  const handleFetchCurrentLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc: LocationData = {
          latitude: Number(position.coords.latitude.toFixed(5)),
          longitude: Number(position.coords.longitude.toFixed(5)),
          name: placeName || 'Current Location',
          address: `Lat: ${position.coords.latitude.toFixed(4)}, Long: ${position.coords.longitude.toFixed(4)}`
        };
        setCurrentLoc(loc);
        setLoading(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        // Fallback default coordinates (e.g. San Francisco or London)
        const fallbackLoc: LocationData = {
          latitude: 37.7749,
          longitude: -122.4194,
          name: 'San Francisco, CA',
          address: 'Market Street, CA 94103'
        };
        setCurrentLoc(fallbackLoc);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleConfirm = () => {
    if (currentLoc) {
      onSendLocation({
        ...currentLoc,
        name: placeName.trim() || currentLoc.name
      });
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400">
            <Icons.location className="w-6 h-6" />
            <h3 className="text-lg font-bold text-white">Share Location</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <Icons.close className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Share your precise live GPS location or enter a custom destination name to send to the chat.
        </p>

        {/* Location Display Card */}
        <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Target Coordinates</span>
            {currentLoc && (
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                {currentLoc.latitude}, {currentLoc.longitude}
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-400">Location Label</label>
            <input
              type="text"
              value={placeName}
              onChange={(e) => setPlaceName(e.target.value)}
              placeholder="e.g. Coffee Shop, Home, Office"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
            />
          </div>

          {!currentLoc && (
            <button
              type="button"
              onClick={handleFetchCurrentLocation}
              disabled={loading}
              className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 active:scale-95 text-white font-medium rounded-xl flex items-center justify-center gap-2 text-xs transition"
            >
              <Icons.location className="w-4 h-4 text-emerald-400" />
              {loading ? 'Locating Device...' : 'Detect Current GPS Location'}
            </button>
          )}

          {error && <p className="text-xs text-rose-400">{error}</p>}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!currentLoc}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:pointer-events-none active:scale-95 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition shadow-lg shadow-emerald-500/20"
          >
            <Icons.send className="w-4 h-4 ml-0.5" />
            Send Location
          </button>
        </div>
      </div>
    </div>
  );
};
