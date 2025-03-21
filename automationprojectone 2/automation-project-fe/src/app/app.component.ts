import { Component } from '@angular/core';
import { AppService } from './app.service';
import { io, Socket } from 'socket.io-client';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'automation-project-fe';
  disableButton = false;
  videoUrl: string = '';
  private socket: Socket;

  constructor(private appService: AppService) {
    this.socket = io('http://34.93.172.107:3000');
  }

  onRunTestClick() {
    this.disableButton = true;
    this.appService.runTest().subscribe({
      next: (data: any) => {
        if (data) {
          this.disableButton = false;

          // Listen for video URL from WebSocket (after test completion)
          this.socket.on("test-video", (videoData: any) => {
            this.videoUrl = `http://34.93.172.107:3000${videoData.videoUrl}`;
          });          
        }
      },
      error: (err) => {
        this.disableButton = false;
        console.log('Error', err);
      },
    });
  }
}
