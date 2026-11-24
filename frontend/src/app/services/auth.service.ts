import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthPayload, AuthResponse, PasswordPayload, ProfilePayload, User } from '../models/auth.model';
import { ApiMessage } from '../models/api.model';

interface MeResponse {
  success: boolean;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storageKey = 'expense-tracker-token';
  private readonly tokenState = signal<string | null>(this.readToken());
  private readonly userState = signal<User | null>(null);

  readonly token = this.tokenState.asReadonly();
  readonly currentUser = this.userState.asReadonly();
  readonly isAuthenticated = computed(() => !!this.tokenState());

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router
  ) {}

  restoreSession(): Observable<User | null> {
    if (!this.tokenState()) return of(null);

    return this.http.get<MeResponse>(`${environment.apiUrl}/auth/me`).pipe(
      map((response) => response.user),
      tap((user) => this.userState.set(user)),
      catchError(() => {
        this.clearSession();
        void this.router.navigate(['/login']);
        return of(null);
      })
    );
  }

  register(payload: AuthPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, payload).pipe(tap((response) => this.setSession(response)));
  }

  login(payload: AuthPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, payload).pipe(tap((response) => this.setSession(response)));
  }

  updateProfile(payload: ProfilePayload): Observable<ApiMessage & { user: User }> {
    return this.http.put<ApiMessage & { user: User }>(`${environment.apiUrl}/auth/profile`, payload).pipe(
      tap((response) => this.userState.set(response.user))
    );
  }

  changePassword(payload: PasswordPayload): Observable<ApiMessage> {
    return this.http.put<ApiMessage>(`${environment.apiUrl}/auth/password`, payload);
  }

  logout(navigate = true): void {
    this.clearSession();
    if (navigate) void this.router.navigate(['/login']);
  }

  private setSession(response: AuthResponse): void {
    localStorage.setItem(this.storageKey, response.token);
    this.tokenState.set(response.token);
    this.userState.set(response.user);
  }

  private clearSession(): void {
    localStorage.removeItem(this.storageKey);
    this.tokenState.set(null);
    this.userState.set(null);
  }

  private readToken(): string | null {
    try {
      return localStorage.getItem(this.storageKey);
    } catch {
      return null;
    }
  }
}
