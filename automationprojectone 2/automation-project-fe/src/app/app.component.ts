// import { Component } from '@angular/core';
// import { AppService } from './app.service';
// import { io, Socket } from 'socket.io-client';

// @Component({
//   selector: 'app-root',
//   standalone: true,
//   imports: [],
//   templateUrl: './app.component.html',
//   styleUrl: './app.component.css',
// })
// export class AppComponent {
//   title = 'automation-project-fe';
//   disableButton = false;
//   videoUrl: string = '';
//   private socket: Socket;

//   constructor(private appService: AppService) {
//     this.socket = io('http://35.200.245.66:3000');
//   }

//   onRunTestClick(): void {
//     this.disableButton = true;
//     this.appService.runTest().subscribe({
//       next: () => {
//         console.log('Test execution started.');
//       },
//       error: (err) => {
//         console.error('Test execution failed:', err);
//         this.disableButton = false;
//       },
//       complete: () => {
//         this.disableButton = false;
//       },
//     });
//   }
// }

// src/app/app.component.ts
import { Component, OnDestroy } from '@angular/core';
import { NgIf } from '@angular/common'; // ✅ Import NgIf
import { AppService } from './app.service';
import { SocketService } from './services/socket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgIf], // ✅ Add NgIf to imports
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnDestroy {
  title = 'automation-project-fe';
  disableButton = false;
  videoUrl: string = '';
  private socketSubscription: Subscription = new Subscription();

  constructor(
    private appService: AppService,
    private socketService: SocketService
  ) {
    this.listenForVideoStream();
  }

  onRunTestClick(): void {
    this.disableButton = true;
    this.appService.runTest().subscribe({
      next: () => console.log('🚀 Test execution started.'),
      error: (err) => {
        console.error('❌ Test execution failed:', err);
        this.disableButton = false;
      },
      complete: () => (this.disableButton = false),
    });
  }

  private listenForVideoStream(): void {
    this.socketSubscription.add(
      this.socketService.listen<string>('video-stream').subscribe((url) => {
        console.log('📹 Received Video URL:', url);
        this.videoUrl = url; // ✅ Update the videoUrl dynamically
      })
    );
  }

  ngOnDestroy(): void {
    this.socketSubscription.unsubscribe();
    this.socketService.disconnect();
  }
}
