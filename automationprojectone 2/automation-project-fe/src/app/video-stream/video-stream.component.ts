import {
  Component,
  AfterViewInit,
  ViewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { StreamService } from '../stream.service';

@Component({
  selector: 'app-video-stream',
  standalone: true,
  imports: [CommonModule],
  template: `<video #videoPlayer autoplay playsinline></video>`,
  styles: ['video { width: 100%; height: auto; }'],
})
export class VideoStreamComponent implements AfterViewInit, OnDestroy {
  @ViewChild('videoPlayer', { static: false })
  videoPlayer?: ElementRef<HTMLVideoElement>;

  constructor(private streamService: StreamService) {}

  ngAfterViewInit() {
    if (!this.videoPlayer?.nativeElement) {
      console.error('⚠️ Video player not found!');
      return;
    }

    console.log('🎥 Video player found, starting stream...');
    this.streamService
      .startStreaming(this.videoPlayer.nativeElement)
      .catch((error) => console.error('❌ Error starting stream:', error));
  }

  ngOnDestroy() {
    console.log('🛑 VideoStreamComponent destroyed, stopping stream...');
    this.streamService.stopStreaming();
  }
}
