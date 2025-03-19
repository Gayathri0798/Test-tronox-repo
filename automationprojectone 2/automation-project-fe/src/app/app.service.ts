import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AppService {
  constructor(private http: HttpClient) {}

  runTest() {
    const RUN_TEST_URL = 'http://localhost:3000/run-test';
    return this.http.post<any>(RUN_TEST_URL, {});
  }
}
