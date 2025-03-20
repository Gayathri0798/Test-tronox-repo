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
  @ViewChild('videoPlayer', { static: false })
  videoPlayer!: ElementRef<HTMLVideoElement>;

  constructor(private streamService: StreamService) {}

  ngAfterViewInit() {
    this.streamService.startStreaming(this.videoPlayer.nativeElement);
  }
}
