import React, { useEffect, useRef, useState } from 'react';
import { Icons } from '../services/icons';
import { CallData, UserProfile } from '../types';
import { webrtcManager } from '../services/webrtc';
import { soundService } from '../services/toneAudio';

interface CallModalProps {
  incomingCall: CallData | null;
  activeCall: CallData | null;
  currentUser: UserProfile;
  onAnswerCall: (call: CallData) => void;
  onDeclineCall: (call: CallData) => void;
  onEndCall: () => void;
}

export const CallModal: React.FC<CallModalProps> = ({
  incomingCall,
  activeCall,
  currentUser,
  onAnswerCall,
  onDeclineCall,
  onEndCall
}) => {
  const [callState, setCallState] = useState<{
    call: CallData | null;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    callSeconds: number;
    isMuted: boolean;
    isVideoOff: boolean;
  }>({
    call: activeCall,
    localStream: webrtcManager.localStream,
    remoteStream: webrtcManager.remoteStream,
    callSeconds: webrtcManager.callSeconds,
    isMuted: webrtcManager.isMuted,
    isVideoOff: webrtcManager.isVideoOff
  });

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  // Drag state for PiP local video
  const [pipPos, setPipPos] = useState({ x: 16, y: 16 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ startX: 0, startY: 0, initX: 0, initY: 0 });

  // Subscribe to WebRTC manager changes
  useEffect(() => {
    const unsub = webrtcManager.subscribeState((state) => {
      setCallState({ ...state });
    });
    return () => unsub();
  }, []);

  // Play Tone.js ringtone when incoming call arrives
  useEffect(() => {
    if (incomingCall && incomingCall.status === 'ringing') {
      soundService.startRingtone();
    } else {
      soundService.stopRingtone();
    }
    return () => {
      soundService.stopRingtone();
    };
  }, [incomingCall]);

  // Bind video streams to elements
  useEffect(() => {
    if (localVideoRef.current && callState.localStream) {
      localVideoRef.current.srcObject = callState.localStream;
    }
  }, [callState.localStream, activeCall]);

  useEffect(() => {
    if (remoteVideoRef.current && callState.remoteStream) {
      remoteVideoRef.current.srcObject = callState.remoteStream;
    }
  }, [callState.remoteStream, activeCall]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: pipPos.x,
      initY: pipPos.y
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;
    setPipPos({
      x: Math.max(8, Math.min(window.innerWidth - 120, dragStartRef.current.initX + dx)),
      y: Math.max(8, Math.min(window.innerHeight - 180, dragStartRef.current.initY + dy))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 1. INCOMING CALL MODAL PROMPT
  if (incomingCall && incomingCall.status === 'ringing' && currentUser && incomingCall.to === currentUser.uid && !activeCall) {
    const isVideo = incomingCall.type === 'video';
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
        <div className="w-full max-w-sm bg-[#1A1A1A] border border-[#2C2C2C] rounded-3xl p-6 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute -top-12 -left-12 w-36 h-36 bg-[#00A878]/20 rounded-full blur-2xl pointer-events-none" />

          {/* Caller Avatar with pulsating ringtone aura */}
          <div className="relative mb-5 mt-2">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#00A878] shadow-2xl ringing-pulse">
              <img
                src={incomingCall.callerDpUrl}
                alt={incomingCall.callerName || 'Caller'}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-2 right-1 bg-[#00A878] text-[#121212] p-2 rounded-full shadow-lg">
              {isVideo ? <Icons.video className="w-4 h-4" /> : <Icons.phone className="w-4 h-4" />}
            </div>
          </div>

          <h3 className="text-xl font-bold text-[#FFFFFF] mb-1">
            {incomingCall.callerName || 'Incoming Call'}
          </h3>
          <p className="text-xs text-[#00A878] font-medium tracking-wide uppercase mb-8">
            Incoming {isVideo ? 'Video' : 'Voice'} Call...
          </p>

          {/* Accept / Decline Action Buttons */}
          <div className="w-full flex items-center justify-around gap-6">
            {/* Decline Button */}
            <div className="flex flex-col items-center gap-1.5">
              <button
                onClick={() => onDeclineCall(incomingCall)}
                className="w-14 h-14 rounded-full bg-[#FF5252] hover:bg-[#E03A3A] text-[#FFFFFF] flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
                aria-label="Decline Call"
              >
                <Icons.endCall className="w-7 h-7" />
              </button>
              <span className="text-xs text-[#A0A0A0]">Decline</span>
            </div>

            {/* Accept Button */}
            <div className="flex flex-col items-center gap-1.5">
              <button
                onClick={() => onAnswerCall(incomingCall)}
                className="w-14 h-14 rounded-full bg-[#00A878] hover:bg-[#008F65] text-[#121212] flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all animate-bounce"
                aria-label="Answer Call"
              >
                {isVideo ? <Icons.video className="w-7 h-7" /> : <Icons.phone className="w-7 h-7" />}
              </button>
              <span className="text-xs text-[#00A878] font-medium">Answer</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. ACTIVE / OUTGOING CALL FULLSCREEN INTERFACE
  if (activeCall && currentUser) {
    const isCaller = activeCall.from === currentUser.uid;
    const otherName = (isCaller ? activeCall.calleeName : activeCall.callerName) || 'User';
    const otherDpUrl = (isCaller ? activeCall.calleeDpUrl : activeCall.callerDpUrl) || '';
    const isVideo = activeCall.type === 'video';
    const isRinging = activeCall.status === 'ringing';

    return (
      <div
        id="call-screen"
        className="fixed inset-0 z-50 bg-[#0A0A0A] flex flex-col justify-between overflow-hidden select-none"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Background / Video Feed Area */}
        <div className="absolute inset-0 bg-[#0A0A0A] flex items-center justify-center overflow-hidden">
          {isVideo && !callState.isVideoOff ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <div className="relative mb-6">
                <div
                  className={`w-32 h-32 rounded-full overflow-hidden border-4 border-[#00A878] shadow-2xl ${
                    isRinging ? 'ringing-pulse' : 'ring-4 ring-[#00A878]/30'
                  }`}
                >
                  <img
                    src={otherDpUrl}
                    alt={otherName || 'User'}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-[#FFFFFF] mb-2">{otherName}</h2>
              <p className="text-sm text-[#00A878] font-medium">
                {isRinging
                  ? 'Calling & waiting for answer...'
                  : `${isVideo ? 'Video' : 'Voice'} Call Connected`}
              </p>
              {!isRinging && (
                <div className="mt-3 text-lg font-mono font-semibold text-[#FFFFFF] bg-[#1A1A1A] px-4 py-1.5 rounded-full border border-[#2C2C2C]">
                  {formatTimer(callState.callSeconds)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Top Floating Bar */}
        <div className="relative z-10 p-5 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-[#2C2C2C]">
              <img src={otherDpUrl} alt="" className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#FFFFFF] drop-shadow">{otherName}</h3>
              <p className="text-xs text-[#00E676] font-medium drop-shadow">
                {isRinging ? 'Ringing...' : formatTimer(callState.callSeconds)}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold bg-[#282828]/80 text-[#00A878] px-3 py-1 rounded-full border border-[#00A878]/30 backdrop-blur-xs">
            {isVideo ? 'Video Call' : 'Voice Call'}
          </span>
        </div>

        {/* Draggable PiP (Picture in Picture) Local Video (for video calls) */}
        {isVideo && (
          <div
            style={{
              position: 'absolute',
              right: `${pipPos.x}px`,
              top: `${pipPos.y}px`,
              cursor: isDragging ? 'grabbing' : 'grab'
            }}
            onMouseDown={handleMouseDown}
            className="w-28 h-38 bg-[#1E1E1E] rounded-2xl overflow-hidden border-2 border-[#00A878] shadow-2xl z-20"
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {callState.isVideoOff && (
              <div className="absolute inset-0 bg-[#121212] flex items-center justify-center text-xs text-[#A0A0A0]">
                Camera Off
              </div>
            )}
          </div>
        )}

        {/* Bottom Call Controls */}
        <div
          id="call-controls"
          className="relative z-10 p-6 pb-10 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex items-center justify-center gap-6"
        >
          {/* Mute Audio Toggle */}
          <button
            onClick={() => webrtcManager.toggleMute()}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${
              callState.isMuted
                ? 'bg-[#FF5252] text-[#FFFFFF]'
                : 'bg-[#282828] text-[#FFFFFF] hover:bg-[#333333]'
            }`}
            aria-label={callState.isMuted ? 'Unmute' : 'Mute'}
            title={callState.isMuted ? 'Unmute' : 'Mute'}
          >
            {callState.isMuted ? <Icons.mute className="w-6 h-6" /> : <Icons.unmute className="w-6 h-6" />}
          </button>

          {/* End Call Button */}
          <button
            onClick={onEndCall}
            className="w-16 h-16 rounded-full bg-[#FF5252] hover:bg-[#E03A3A] text-[#FFFFFF] flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all"
            aria-label="End Call"
            title="End Call"
          >
            <Icons.endCall className="w-8 h-8" />
          </button>

          {/* Toggle Video (for video calls) */}
          {isVideo && (
            <button
              onClick={() => webrtcManager.toggleVideo()}
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${
                callState.isVideoOff
                  ? 'bg-[#FF5252] text-[#FFFFFF]'
                  : 'bg-[#282828] text-[#FFFFFF] hover:bg-[#333333]'
              }`}
              aria-label={callState.isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
              title={callState.isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
            >
              {callState.isVideoOff ? (
                <Icons.videoOff className="w-6 h-6" />
              ) : (
                <Icons.video className="w-6 h-6" />
              )}
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
};
