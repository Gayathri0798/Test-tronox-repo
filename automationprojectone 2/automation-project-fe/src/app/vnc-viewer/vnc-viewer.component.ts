import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';

declare var RFB: any; // Declare noVNC globally

@Component({
  selector: 'app-vnc-viewer',
  templateUrl: './vnc-viewer.component.html',
  styleUrls: ['./vnc-viewer.component.css'],
  standalone: true, // ✅ If using standalone
})
export class VncViewerComponent implements AfterViewInit {
  @ViewChild('vncContainer', { static: false }) vncContainer!: ElementRef;
  private rfb: any;

  ngAfterViewInit() {
    if (typeof RFB !== 'undefined') {
      this.rfb = new RFB(
        this.vncContainer.nativeElement,
        'ws://34.93.172.107:5900'
      );
      this.rfb.viewOnly = false; // Enable interaction
    } else {
      console.error('noVNC is not loaded');
    }
  }
}
