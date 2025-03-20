import { Injectable } from '@angular/core';
import { io } from 'socket.io-client';

@Injectable({
  providedIn: 'root',
})
export class StreamService {
  private socket = io('http://34.93.172.107:3000');
  private peerConnection!: RTCPeerConnection;
  private remoteStream!: MediaStream;
  private videoElement!: HTMLVideoElement;

  constructor() {
    console.log('🚀 StreamService instantiated!');
    this.setupSocketListeners();
  }

  async startStreaming(videoElement: HTMLVideoElement) {
    console.log('🎬 Initializing WebRTC connection...');

    this.videoElement = videoElement;
    this.peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    this.remoteStream = new MediaStream();
    this.videoElement.srcObject = this.remoteStream;

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
      this.socket.emit('offer', offer);
    } catch (error) {
      console.error('❌ Error creating or sending offer:', error);
    }
  }

  stopStreaming() {
    console.log('🛑 Stopping WebRTC stream...');

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null!;
    }

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach((track) => track.stop());
      this.remoteStream = null!;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
  }

  private setupSocketListeners() {
    console.log('🛠️ Setting up WebSocket listeners...');

    this.socket.on('connect', () => {
      console.log('✅ Connected to WebSocket');
    });

    this.socket.on('disconnect', () => {
      console.warn(
        '⚠️ Disconnected from WebSocket. Attempting to reconnect...'
      );
      this.stopStreaming();
    });

    this.socket.on('answer', async (answer) => {
      console.log('📥 Received Answer:', answer);
      try {
        if (this.peerConnection) {
          await this.peerConnection.setRemoteDescription(
            new RTCSessionDescription(answer)
          );
          console.log('✅ Remote description set successfully.');
        }
      } catch (error) {
        console.error('❌ Error setting remote description:', error);
      }
    });

    this.socket.on('candidate', async (candidate) => {
      console.log('📥 Received ICE Candidate:', candidate);
      try {
        if (this.peerConnection) {
          await this.peerConnection.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
          console.log('✅ ICE Candidate added.');
        }
      } catch (error) {
        console.error('❌ Error adding ICE Candidate:', error);
      }
    });
  }
}
