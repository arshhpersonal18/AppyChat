import { CallData, UserProfile } from '../types';
import {
  saveCallSignal,
  subscribeCallSignal,
  addCallLogEntry,
  db
} from './firebase';
import { collection, addDoc, onSnapshot } from 'firebase/firestore';
import { soundService } from './toneAudio';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  public localStream: MediaStream | null = null;
  public remoteStream: MediaStream | null = null;
  public activeCall: CallData | null = null;
  private isCaller: boolean = false;
  private callTimerInterval: number | null = null;
  public callSeconds: number = 0;

  private stateListeners: Set<(state: {
    call: CallData | null;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    callSeconds: number;
    isMuted: boolean;
    isVideoOff: boolean;
  }) => void> = new Set();

  public isMuted: boolean = false;
  public isVideoOff: boolean = false;
  private unsubscribeCallUpdates: (() => void) | null = null;
  private unsubscribeIceUpdates: (() => void) | null = null;

  public setOnStateChange(cb: (state: any) => void) {
    this.stateListeners.add(cb);
  }

  public subscribeState(cb: (state: any) => void): () => void {
    this.stateListeners.add(cb);
    return () => {
      this.stateListeners.delete(cb);
    };
  }

  private notify() {
    const state = {
      call: this.activeCall,
      localStream: this.localStream,
      remoteStream: this.remoteStream,
      callSeconds: this.callSeconds,
      isMuted: this.isMuted,
      isVideoOff: this.isVideoOff
    };
    this.stateListeners.forEach((cb) => {
      try {
        cb(state);
      } catch (err) {
        console.error('WebRTC state listener error:', err);
      }
    });
  }

  // Get user camera & audio
  public async getMedia(type: 'voice' | 'video'): Promise<MediaStream | null> {
    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: type === 'video' ? {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.localStream = stream;
      return stream;
    } catch (err) {
      console.warn('Could not access real camera/mic, generating mock media stream for simulator:', err);
      // Create fallback synthetic audio/video track so call doesn't fail in environments without hardware
      const fallbackStream = this.createSyntheticMediaStream(type === 'video');
      this.localStream = fallbackStream;
      return fallbackStream;
    }
  }

  // Fallback synthetic stream (black/gradient canvas + silent audio) for test environments
  private createSyntheticMediaStream(includeVideo: boolean): MediaStream {
    const stream = new MediaStream();

    if (includeVideo) {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        let frame = 0;
        const draw = () => {
          ctx.fillStyle = '#1A1A1A';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#00A878';
          ctx.beginPath();
          ctx.arc(canvas.width / 2, canvas.height / 2 + Math.sin(frame * 0.1) * 10, 40, 0, Math.PI * 2);
          ctx.fill();
          frame++;
          requestAnimationFrame(draw);
        };
        draw();
      }
      const canvasStream = (canvas as any).captureStream ? (canvas as any).captureStream(15) : null;
      if (canvasStream && canvasStream.getVideoTracks().length > 0) {
        stream.addTrack(canvasStream.getVideoTracks()[0]);
      }
    }

    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const dst = osc.connect(audioCtx.createMediaStreamDestination()) as any;
      osc.start();
      if (dst && dst.stream && dst.stream.getAudioTracks().length > 0) {
        stream.addTrack(dst.stream.getAudioTracks()[0]);
      }
    } catch {
      // ignore
    }

    return stream;
  }

  // Initiator starts a call
  public async startCall(
    caller: UserProfile,
    callee: UserProfile,
    type: 'voice' | 'video'
  ): Promise<string> {
    this.isCaller = true;
    const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    // Acquire local media
    await this.getMedia(type);

    this.peerConnection = new RTCPeerConnection(ICE_SERVERS);
    this.remoteStream = new MediaStream();

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection?.addTrack(track, this.localStream!);
      });
    }

    this.peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach(track => {
        this.remoteStream?.addTrack(track);
      });
      this.notify();
    };

    this.peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        try {
          await addDoc(collection(db, 'calls', callId, 'candidates'), event.candidate.toJSON());
        } catch {
          // ignore
        }
      }
    };

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    const serializedOffer: RTCSessionDescriptionInit = {
      type: offer.type,
      sdp: offer.sdp
    };

    const callData: CallData = {
      callId,
      type,
      from: caller.uid,
      to: callee.uid,
      callerName: caller.name,
      callerDpUrl: caller.dpUrl,
      calleeName: callee.name,
      calleeDpUrl: callee.dpUrl,
      status: 'ringing',
      offer: serializedOffer,
      iceCandidates: [],
      startTime: Date.now()
    };

    this.activeCall = callData;
    await saveCallSignal(callData);

    // Play outgoing dial tone
    soundService.playOutgoingBeep();

    // Listen for answer and ICE candidates
    this.listenForCallUpdates(callId, caller.uid);

    this.notify();
    return callId;
  }

  // Callee answers an incoming call
  public async answerCall(call: CallData, callee: UserProfile) {
    this.isCaller = false;
    this.activeCall = call;

    await this.getMedia(call.type);
    soundService.stopRingtone();

    this.peerConnection = new RTCPeerConnection(ICE_SERVERS);
    this.remoteStream = new MediaStream();

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection?.addTrack(track, this.localStream!);
      });
    }

    this.peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach(track => {
        this.remoteStream?.addTrack(track);
      });
      this.notify();
    };

    this.peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        try {
          await addDoc(collection(db, 'calls', call.callId, 'candidates'), event.candidate.toJSON());
        } catch {
          // ignore
        }
      }
    };

    if (call.offer) {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(call.offer));
    }

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    const serializedAnswer: RTCSessionDescriptionInit = {
      type: answer.type,
      sdp: answer.sdp
    };

    const updatedCall: CallData = {
      ...call,
      status: 'ongoing',
      answer: serializedAnswer,
      startTime: Date.now()
    };

    this.activeCall = updatedCall;
    await saveCallSignal(updatedCall);

    soundService.playCallConnect();
    this.startCallTimer();
    this.listenForCallUpdates(call.callId, callee.uid);
    this.notify();
  }

  // Callee declines call
  public declineCall(call: CallData, callee: UserProfile) {
    soundService.stopRingtone();
    if (!call) {
      this.cleanup();
      return;
    }

    const updatedCall: CallData = {
      ...call,
      status: 'missed',
      endTime: Date.now()
    };
    saveCallSignal(updatedCall);

    // Log missed call
    if (call.from) {
      addCallLogEntry(callee.uid, {
        type: 'missed',
        duration: 0,
        timestamp: Date.now(),
        with: call.from,
        withName: call.callerName || 'Unknown',
        withDpUrl: call.callerDpUrl,
        isOutgoing: false
      });

      addCallLogEntry(call.from, {
        type: 'missed',
        duration: 0,
        timestamp: Date.now(),
        with: callee.uid,
        withName: callee.name,
        withDpUrl: callee.dpUrl,
        isOutgoing: true
      });
    }

    this.cleanup();
  }

  // End active call
  public endCall(currentUserId?: string) {
    soundService.stopRingtone();
    soundService.playHangup();

    const callToEnd = this.activeCall;
    this.activeCall = null; // Unset immediately to break re-entrancy / recursion

    if (callToEnd) {
      const duration = this.callSeconds;
      const isOngoing = callToEnd.status === 'ongoing';
      const updatedCall: CallData = {
        ...callToEnd,
        status: isOngoing ? 'ended' : 'missed',
        endTime: Date.now()
      };
      saveCallSignal(updatedCall);

      // Save call logs for caller & callee if currentUserId provided
      const logType = isOngoing ? callToEnd.type : 'missed';

      if (currentUserId && callToEnd.from && callToEnd.to) {
        const isCaller = currentUserId === callToEnd.from;
        const otherId = isCaller ? callToEnd.to : callToEnd.from;
        const otherName = isCaller ? (callToEnd.calleeName || 'User') : (callToEnd.callerName || 'User');
        const otherDpUrl = isCaller ? callToEnd.calleeDpUrl : callToEnd.callerDpUrl;

        addCallLogEntry(currentUserId, {
          type: logType,
          duration,
          timestamp: Date.now(),
          with: otherId,
          withName: otherName,
          withDpUrl: otherDpUrl,
          isOutgoing: isCaller
        });
      }
    }

    this.cleanup();
  }

  // Toggle Mute Audio
  public toggleMute(): boolean {
    if (this.localStream) {
      const audioTracks = this.localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks[0].enabled = !audioTracks[0].enabled;
        this.isMuted = !audioTracks[0].enabled;
        this.notify();
        return this.isMuted;
      }
    }
    this.isMuted = !this.isMuted;
    this.notify();
    return this.isMuted;
  }

  // Toggle Video Track
  public toggleVideo(): boolean {
    if (this.localStream) {
      const videoTracks = this.localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks[0].enabled = !videoTracks[0].enabled;
        this.isVideoOff = !videoTracks[0].enabled;
        this.notify();
        return this.isVideoOff;
      }
    }
    this.isVideoOff = !this.isVideoOff;
    this.notify();
    return this.isVideoOff;
  }

  private startCallTimer() {
    if (this.callTimerInterval) clearInterval(this.callTimerInterval);
    this.callSeconds = 0;
    this.callTimerInterval = window.setInterval(() => {
      this.callSeconds++;
      this.notify();
    }, 1000);
  }

  private listenForCallUpdates(callId: string, currentUid: string) {
    if (this.unsubscribeCallUpdates) this.unsubscribeCallUpdates();
    if (this.unsubscribeIceUpdates) this.unsubscribeIceUpdates();

    this.unsubscribeCallUpdates = subscribeCallSignal(callId, async (call: CallData | null) => {
      if (!call) return;

      if (call.status === 'ongoing' && this.isCaller && call.answer && this.peerConnection) {
        this.activeCall = call;
        try {
          if (this.peerConnection.currentRemoteDescription === null) {
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(call.answer));
            soundService.playCallConnect();
            this.startCallTimer();
          }
        } catch (e) {
          console.warn('Failed to set remote answer:', e);
        }
      } else if (call.status === 'ended' || call.status === 'missed') {
        if (this.activeCall) {
          this.activeCall = null;
          soundService.stopRingtone();
          soundService.playHangup();
          this.cleanup();
        }
      } else {
        this.activeCall = call;
      }
      this.notify();
    });

    this.unsubscribeIceUpdates = onSnapshot(collection(db, 'calls', callId, 'candidates'), (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const candidateData = change.doc.data() as RTCIceCandidateInit;
          if (candidateData && this.peerConnection && this.peerConnection.remoteDescription) {
            try {
              await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidateData));
            } catch {
              // ignore
            }
          }
        }
      });
    });
  }

  public cleanup() {
    if (this.callTimerInterval) {
      clearInterval(this.callTimerInterval);
      this.callTimerInterval = null;
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    if (this.unsubscribeCallUpdates) {
      this.unsubscribeCallUpdates();
      this.unsubscribeCallUpdates = null;
    }
    if (this.unsubscribeIceUpdates) {
      this.unsubscribeIceUpdates();
      this.unsubscribeIceUpdates = null;
    }
    this.remoteStream = null;
    this.activeCall = null;
    this.callSeconds = 0;
    this.isMuted = false;
    this.isVideoOff = false;
    this.notify();
  }
}

export const webrtcManager = new WebRTCManager();
