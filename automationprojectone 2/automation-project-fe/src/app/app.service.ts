import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AppService {
  constructor(private http: HttpClient) {}

  runTest() {
    const RUN_TEST_URL = 'http://35.200.245.66:3000/run-test';
    return this.http.post<any>(RUN_TEST_URL, {});
  }
}
