// src/app/services/socket.service.ts
import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket!: Socket;

  constructor() {
    this.connect();
  }

  // Establish connection to the Socket.IO server
  private connect(): void {
    this.socket = io(environment.SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to Socket.IO server');
    });

    this.socket.on('disconnect', () => {
      console.warn('❌ Disconnected from Socket.IO server');
    });
  }

  // Emit an event to the server
  emitEvent(event: string, data: any): void {
    this.socket.emit(event, data);
  }

  // Listen to an event (without type safety)
  onEvent(event: string, callback: (data: any) => void): void {
    this.socket.on(event, callback);
  }

  // ✅ Generic listener with RxJS Observable for better typing
  listen<T>(eventName: string): Observable<T> {
    return new Observable<T>((subscriber) => {
      this.socket.on(eventName, (data: T) => {
        subscriber.next(data);
      });

      // Cleanup: Remove listener on unsubscribe
      return () => {
        this.socket.off(eventName);
      };
    });
  }

  // Disconnect from the server
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      console.log('🔌 Socket disconnected');
    }
  }
}
