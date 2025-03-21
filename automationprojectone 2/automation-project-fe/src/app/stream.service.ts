import { Injectable } from '@angular/core';
import { io } from 'socket.io-client';

@Injectable({
  providedIn: 'root',
})
export class StreamService {
  private socket = io('http://34.93.172.107:3000');
  private peerConnection!: RTCPeerConnection;
  private remoteStream!: MediaStream;

  constructor() {
    this.setupSocketListeners();
  }

  async startStreaming(videoElement: HTMLVideoElement) {
    console.log('🎥 Initializing WebRTC connection...');

    // Cleanup existing connection if already open
    if (this.peerConnection) {
      console.warn('⚠️ Closing existing WebRTC connection...');
      this.peerConnection.close();
    }

    this.peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    this.remoteStream = new MediaStream();
    videoElement.srcObject = this.remoteStream; // ✅ Set immediately

    this.peerConnection.ontrack = (event) => {
      console.log('🔹 Received track:', event.track);
      if (event.track.kind === 'video') {
        console.log('✅ Adding video track to remote stream');
        this.remoteStream.addTrack(event.track);
      }
    };

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('📡 Sending ICE Candidate:', event.candidate);
        this.socket.emit('candidate', event.candidate);
      }
    };

    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      console.log('📤 Sending Offer:', offer);

      // Ensure socket is connected before emitting
      if (this.socket.connected) {
        this.socket.emit('offer', offer);
      } else {
        console.error('❌ Socket connection lost. Reconnecting...');
        this.socket.connect();
      }
    } catch (error) {
      console.error('❌ Error creating or sending offer:', error);
    }
  }

  private setupSocketListeners() {
    this.socket.on('connect', () => {
      console.log('✅ Connected to WebSocket');
    });

    this.socket.on('disconnect', () => {
      console.warn(
        '⚠️ Disconnected from WebSocket. Attempting to reconnect...'
      );
      this.socket.connect(); // Auto-reconnect
    });

    this.socket.on('answer', async (answer) => {
      console.log('📥 Received Answer:', answer);
      try {
        await this.peerConnection.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
        console.log('✅ Remote description set successfully.');
      } catch (error) {
        console.error('❌ Error setting remote description:', error);
      }
    });

    this.socket.on('candidate', async (candidate) => {
      console.log('📥 Received ICE Candidate:', candidate);
      try {
        await this.peerConnection.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
        console.log('✅ ICE Candidate added.');
      } catch (error) {
        console.error('❌ Error adding ICE Candidate:', error);
      }
    });
  }
}
