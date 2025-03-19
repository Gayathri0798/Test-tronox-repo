import { Component, AfterViewInit } from '@angular/core';
import RFB from 'novnc/core/rfb';

@Component({
  selector: 'app-vnc-viewer',
  standalone: true,
  imports: [],
  templateUrl: './vnc-viewer.component.html',
  styleUrls: ['./vnc-viewer.component.css'],
})
export class VncViewerComponent implements AfterViewInit {
  ngAfterViewInit() {
    const container = document.getElementById('vnc-container') as HTMLElement;

    if (!container) {
      console.error('VNC container element not found!');
      return;
    }

    const vncUrl = 'ws://34.93.172.107:6080/websockify';
    try {
      const rfb = new RFB(container, vncUrl);
      rfb.viewOnly = false; // ✅ Allow user interaction
    } catch (error) {
      console.error('Error initializing noVNC:', error);
    }
  }
}
