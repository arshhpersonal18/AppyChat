import React from 'react';
import { Icons } from '../services/icons';
import { CallLog, UserProfile } from '../types';

interface CallLogsListProps {
  logs: CallLog[];
  onInitiateCall: (contact: UserProfile, type: 'voice' | 'video') => void;
  getUserProfile: (uid: string) => UserProfile | null;
}

export const CallLogsList: React.FC<CallLogsListProps> = ({
  logs,
  onInitiateCall,
  getUserProfile
}) => {
  const formatDuration = (secs: number) => {
    if (!secs || secs === 0) return '0s';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  const formatLogDate = (timestamp: number) => {
    const d = new Date(timestamp);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div id="call-logs" className="h-full flex flex-col overflow-hidden bg-[#121212]">
      <div className="p-4 border-b border-[#2C2C2C] bg-[#1A1A1A]">
        <h2 className="text-sm font-semibold text-[#FFFFFF]">Recent Calls</h2>
        <p className="text-xs text-[#A0A0A0]">
          {logs.length === 1 ? '1 call recorded' : `${logs.length} calls recorded`}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-[#1E1E1E]">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-[#A0A0A0]">
            <div className="w-14 h-14 rounded-full bg-[#1E1E1E] flex items-center justify-center mb-3 text-[#757575]">
              <Icons.calls className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-[#FFFFFF] mb-1">No Call History</h3>
            <p className="text-xs text-[#A0A0A0] max-w-xs">
              Make voice or video calls with your contacts and their records will appear here.
            </p>
          </div>
        ) : (
          logs.map((log) => {
            const user = getUserProfile(log.with);
            const isMissed = log.type === 'missed';
            const isVideo = log.type === 'video';

            return (
              <div
                key={log.id}
                className="p-3.5 flex items-center justify-between hover:bg-[#1A1A1A] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full overflow-hidden border border-[#2C2C2C] shrink-0">
                    <img
                      src={log.withDpUrl || user?.dpUrl}
                      alt={log.withName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Info */}
                  <div className="min-w-0">
                    <h4
                      className={`text-sm font-semibold truncate ${
                        isMissed ? 'text-[#FF5252]' : 'text-[#FFFFFF]'
                      }`}
                    >
                      {log.withName}
                    </h4>

                    <div className="flex items-center gap-1.5 mt-0.5 text-xs text-[#A0A0A0]">
                      {/* Call direction icon */}
                      {isMissed ? (
                        <Icons.callMissed className="w-3.5 h-3.5 text-[#FF5252]" />
                      ) : log.isOutgoing ? (
                        <Icons.callOutgoing className="w-3.5 h-3.5 text-[#00A878]" />
                      ) : (
                        <Icons.callIncoming className="w-3.5 h-3.5 text-[#33C49A]" />
                      )}

                      <span className="capitalize">{isMissed ? 'Missed' : isVideo ? 'Video' : 'Voice'}</span>
                      <span>•</span>
                      <span>{formatLogDate(log.timestamp)}</span>
                      {!isMissed && log.duration > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-[#00A878] font-mono text-[11px]">
                            {formatDuration(log.duration)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Call Back Action */}
                {user && (
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      onClick={() => onInitiateCall(user, 'voice')}
                      className="p-2 rounded-xl text-[#00A878] hover:bg-[#00A878]/15 transition-colors"
                      title="Voice Call"
                      aria-label="Voice Call"
                    >
                      <Icons.phone className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onInitiateCall(user, 'video')}
                      className="p-2 rounded-xl text-[#00A878] hover:bg-[#00A878]/15 transition-colors"
                      title="Video Call"
                      aria-label="Video Call"
                    >
                      <Icons.video className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
