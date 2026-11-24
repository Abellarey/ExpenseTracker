import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DashboardResponse, ReportPeriod, ReportResponse } from '../models/report.model';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly url = `${environment.apiUrl}/reports`;

  constructor(private readonly http: HttpClient) {}

  dashboard(): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(`${this.url}/dashboard`);
  }

  report(period: ReportPeriod, date: string, category: string): Observable<ReportResponse> {
    let params = new HttpParams().set('period', period);
    if (date) params = params.set('date', date);
    if (category) params = params.set('category', category);
    return this.http.get<ReportResponse>(this.url, { params });
  }
}
