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
//     this.socket = io('http://34.93.172.107:3000');
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
//New code Gayathri
// src/app/app.component.ts
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { io } from 'socket.io-client';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  private socket: any;
  videoUrl: string = ''; // ✅ Add this property

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // Connect to Socket.IO (Replace with your GCP IP)
    this.socket = io('http://35.200.245.66/:3000');

    // Receive video frames and update videoUrl
    this.socket.on('frame', (data: string) => {
      this.videoUrl = data; // ✅ Update video stream
    });
  }

  onRunTestClick(): void {
    console.log('Run Test button clicked!');
    this.http.post('http://35.200.245.66/:3000/run-test', {}).subscribe({
      next: (response) => console.log('✅ Test started:', response),
      error: (error) => console.error('❌ Error starting test:', error),
    });
  }
}
