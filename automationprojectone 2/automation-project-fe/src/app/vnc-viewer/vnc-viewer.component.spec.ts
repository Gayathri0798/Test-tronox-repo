import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VncViewerComponent } from './vnc-viewer.component';

describe('VncViewerComponent', () => {
  let component: VncViewerComponent;
  let fixture: ComponentFixture<VncViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VncViewerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VncViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
