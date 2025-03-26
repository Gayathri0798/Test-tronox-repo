import { Component } from '@angular/core';
import { AppService } from './app.service';
import { io, Socket } from 'socket.io-client';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [],
  templateUrl: './app.component.html',
  styleUrl: ''
})
export class AppComponent {
  title = 'automation-project-fe';
  disableButton = false;
  videoUrl: string = '';
  private socket: Socket;

  constructor(private appService: AppService) {
    this.socket = io('http://35.200.245.66:3000');
  }

  onRunTestClick(): void {
    this.disableButton = true;
    this.appService.runTest().subscribe({
      next: () => {
        console.log('Test execution started.');
      },
      error: (err) => {
        console.error('Test execution failed:', err);
        this.disableButton = false;
      },
      complete: () => {
        this.disableButton = false;
      },
    });
  }
}