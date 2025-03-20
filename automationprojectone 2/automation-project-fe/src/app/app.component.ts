import { Component } from '@angular/core';
import { AppService } from './app.service';

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
  videoUrl: string | null = null;

  constructor(private appService: AppService) {}

  onRunTestClick() {
    this.disableButton = true;
    this.videoUrl = null; // Reset video before running test

    this.appService.runTest().subscribe({
      next: () => {
        // Delay setting video URL slightly to ensure it's available
        setTimeout(() => {
          this.videoUrl = 'http://34.93.172.107:3000/test-video';
          this.disableButton = false;
        }, 3000);
      },
      error: (err) => {
        this.disableButton = false;
        console.log('Error running test:', err);
      },
    });
  }
}
