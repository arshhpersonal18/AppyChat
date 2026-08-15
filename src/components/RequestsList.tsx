import React from 'react';
import { Icons } from '../services/icons';
import { FriendRequest } from '../types';

interface RequestsListProps {
  requests: FriendRequest[];
  onAccept: (senderUid: string) => void;
  onDecline: (senderUid: string) => void;
  onOpenAddFriend: () => void;
}

export const RequestsList: React.FC<RequestsListProps> = ({
  requests,
  onAccept,
  onDecline,
  onOpenAddFriend
}) => {
  return (
    <div id="requests-list" className="h-full flex flex-col overflow-hidden bg-[#121212]">
      {/* Header Info */}
      <div className="p-4 border-b border-[#2C2C2C] bg-[#1A1A1A] flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[#FFFFFF]">Friend Requests</h2>
          <p className="text-xs text-[#A0A0A0]">
            {requests.length === 1 ? '1 pending request' : `${requests.length} pending requests`}
          </p>
        </div>
        <button
          onClick={onOpenAddFriend}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#00A878] hover:text-[#33C49A] transition-colors"
        >
          <Icons.add className="w-4 h-4" />
          <span>Add Friend</span>
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#1E1E1E]">
        {requests.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-[#A0A0A0]">
            <div className="w-14 h-14 rounded-full bg-[#1E1E1E] flex items-center justify-center mb-3 text-[#757575]">
              <Icons.requests className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-[#FFFFFF] mb-1">No Pending Requests</h3>
            <p className="text-xs text-[#A0A0A0] max-w-xs mb-4">
              When others send you a friend request using your identifier, you will see them here.
            </p>
            <button
              onClick={onOpenAddFriend}
              className="inline-flex items-center gap-2 bg-[#00A878] hover:bg-[#008F65] text-[#121212] font-semibold text-xs px-4 py-2 rounded-xl transition-colors shadow-md"
            >
              <Icons.add className="w-4 h-4" />
              <span>Search & Add Friends</span>
            </button>
          </div>
        ) : (
          requests.map((req) => (
            <div key={req.senderUid} className="p-4 bg-[#121212] hover:bg-[#1A1A1A] transition-colors">
              <div className="flex items-center gap-3.5 mb-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-[#2C2C2C] shrink-0">
                  <img
                    src={req.dpUrl}
                    alt={req.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-[#FFFFFF] truncate">{req.name}</h4>
                    <span className="text-[11px] text-[#757575]">
                      {new Date(req.timestamp).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-[#00A878] bg-[#00A878]/10 px-2 py-0.5 rounded border border-[#00A878]/20 inline-block mt-0.5">
                    {req.identifier}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pl-15">
                <button
                  onClick={() => onAccept(req.senderUid)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[#00A878] hover:bg-[#008F65] text-[#121212] font-semibold text-xs py-2 px-3 rounded-xl transition-colors shadow-sm"
                >
                  <Icons.check className="w-4 h-4" />
                  <span>Accept</span>
                </button>
                <button
                  onClick={() => onDecline(req.senderUid)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[#282828] hover:bg-[#333333] text-[#E0E0E0] font-semibold text-xs py-2 px-3 rounded-xl transition-colors border border-[#2C2C2C]"
                >
                  <Icons.close className="w-4 h-4" />
                  <span>Decline</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
