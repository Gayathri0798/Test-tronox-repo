import { Injectable } from '@angular/core';
import { io } from 'socket.io-client';

@Injectable({
  providedIn: 'root',
})
export class StreamService {
  private socket = io('http://34.93.172.107:3000');
  private peerConnection!: RTCPeerConnection;
  private remoteStream!: MediaStream;

  constructor() {}

  async startStreaming(videoElement: HTMLVideoElement) {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    this.remoteStream = new MediaStream();
    videoElement.srcObject = this.remoteStream;

    this.peerConnection.ontrack = (event) => {
      this.remoteStream.addTrack(event.track);
    };

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('candidate', event.candidate);
      }
    };

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    this.socket.emit('offer', offer);

    this.socket.on('answer', async (answer) => {
      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    });

    this.socket.on('candidate', async (candidate) => {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    });
  }
}
