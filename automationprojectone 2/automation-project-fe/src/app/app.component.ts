import { Component } from '@angular/core';
import { AppService } from './app.service';
import { io, Socket } from 'socket.io-client';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [],
  templateUrl: './app.component.html',
  styles: [
    `
    body {
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background-color: #f4f4f4;
      font-family: Arial, sans-serif;
    }
 
    .run-test-btn {
      background-color: #007bff;
      color: white;
      border: none;
      padding: 15px 30px;
      font-size: 18px;
      border-radius: 8px;
      cursor: pointer;
      transition: 0.3s ease-in-out;
      box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
    }
 
    .run-test-btn:hover {
      background-color: #0056b3;
      transform: scale(1.05);
    }
 
    .main-container {
      display: flex;
      justify-content: center;
      margin-top: 50px;
    }
    `
  ]
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