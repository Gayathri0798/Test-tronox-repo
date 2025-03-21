import { Component } from '@angular/core';
import { AppService } from './app.service';
import { VideoStreamComponent } from './video-stream/video-stream.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [VideoStreamComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'automation-project-fe';
  disableButton = false;
  videoUrl: string = '';

  constructor(private appService: AppService) {}

  onRunTestClick() {
    this.disableButton = true;
    this.appService.runTest().subscribe({
      next: (data: any) => {
        if (data) {
          this.disableButton = false;
          this.videoUrl = `http://localhost:3000${data.videoUrl}`;
        }
      },
      error: (err) => {
        this.disableButton = false;
        console.log('Error', err);
      },
    });
  }
}
