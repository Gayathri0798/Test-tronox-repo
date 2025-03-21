import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AppService {
  constructor(private http: HttpClient) {}

  runTest() {
    const RUN_TEST_URL = 'http://34.93.172.107:3000/run-test';
    return this.http.post<any>(RUN_TEST_URL, {});
  }
}
