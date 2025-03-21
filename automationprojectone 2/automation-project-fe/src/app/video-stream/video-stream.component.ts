import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StreamService } from '../stream.service';

@Component({
  selector: 'app-video-stream',
  standalone: true,
  imports: [CommonModule],
  template: `<video #videoPlayer autoplay playsinline></video>`,
  styles: ['video { width: 100%; height: auto; }'],
})
export class VideoStreamComponent implements AfterViewInit {
  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;

  constructor(private streamService: StreamService) {}

  ngAfterViewInit() {
    // Ensure ViewChild is available before accessing
    Promise.resolve().then(() => {
      if (this.videoPlayer?.nativeElement) {
        this.streamService
          .startStreaming(this.videoPlayer.nativeElement)
          .catch((error) => {
            console.error('❌ Error starting stream:', error);
          });
      } else {
        console.error('⚠️ Video player not found!');
      }
    });
  }
}
