import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiMessage } from '../models/api.model';
import { Transaction, TransactionListResponse, TransactionPayload, TransactionQuery, TransactionResponse } from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly url = `${environment.apiUrl}/transactions`;

  constructor(private readonly http: HttpClient) {}

  getTransactions(query: TransactionQuery = {}): Observable<TransactionListResponse> {
    let params = new HttpParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<TransactionListResponse>(this.url, { params });
  }

  getTransaction(id: string): Observable<{ success: boolean; transaction: Transaction }> {
    return this.http.get<{ success: boolean; transaction: Transaction }>(`${this.url}/${id}`);
  }

  create(payload: TransactionPayload): Observable<TransactionResponse> {
    return this.http.post<TransactionResponse>(this.url, payload);
  }

  update(id: string, payload: Partial<TransactionPayload>): Observable<TransactionResponse> {
    return this.http.put<TransactionResponse>(`${this.url}/${id}`, payload);
  }

  delete(id: string): Observable<ApiMessage> {
    return this.http.delete<ApiMessage>(`${this.url}/${id}`);
  }
}
