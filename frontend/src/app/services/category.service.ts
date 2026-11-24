import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiMessage } from '../models/api.model';
import { Category, CategoryListResponse, CategoryPayload, CategoryType } from '../models/category.model';

interface CategoryResponse {
  success: boolean;
  message: string;
  category: Category;
}

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly url = `${environment.apiUrl}/categories`;

  constructor(private readonly http: HttpClient) {}

  getCategories(type: CategoryType | 'all' = 'all'): Observable<CategoryListResponse> {
    const params = new HttpParams().set('type', type);
    return this.http.get<CategoryListResponse>(this.url, { params });
  }

  create(payload: CategoryPayload): Observable<CategoryResponse> {
    return this.http.post<CategoryResponse>(this.url, payload);
  }

  update(id: string, payload: CategoryPayload): Observable<CategoryResponse> {
    return this.http.put<CategoryResponse>(`${this.url}/${id}`, payload);
  }

  delete(id: string): Observable<ApiMessage> {
    return this.http.delete<ApiMessage>(`${this.url}/${id}`);
  }
}
