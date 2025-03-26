// import { bootstrapApplication } from '@angular/platform-browser';
// import { appConfig } from './app/app.config';
// import { AppComponent } from './app/app.component';

// bootstrapApplication(AppComponent, appConfig)
//   .catch((err) => console.error(err));
//Gayathri changes
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { provideHttpClient, withFetch } from '@angular/common/http';

// Merge the HTTP client with fetch into the existing appConfig
const updatedAppConfig = {
  ...appConfig,
  providers: [...(appConfig.providers || []), provideHttpClient(withFetch())],
};

bootstrapApplication(AppComponent, updatedAppConfig)
  .catch((err) => console.error(err));
//Gayathri changes ends

