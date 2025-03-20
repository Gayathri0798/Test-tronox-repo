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

  constructor(private appService: AppService) {}

  onRunTestClick() {
    this.disableButton = true;
    this.appService.runTest().subscribe({
      next: (data: any) => {
        if (data) {
          this.disableButton = false;
        }
      },
      error: (err) => {
        this.disableButton = false;
        console.log('Error', err);
      },
    });
  }
}
