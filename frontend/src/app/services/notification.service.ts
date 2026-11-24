import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'info';

export interface NotificationItem {
  id: number;
  type: NotificationType;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly items = signal<NotificationItem[]>([]);
  private nextId = 1;

  readonly all = this.items.asReadonly();

  success(message: string): void {
    this.add('success', message);
  }

  error(message: string): void {
    this.add('error', message);
  }

  info(message: string): void {
    this.add('info', message);
  }

  dismiss(id: number): void {
    this.items.update((current) => current.filter((item) => item.id !== id));
  }

  private add(type: NotificationType, message: string): void {
    const id = this.nextId;
    this.nextId += 1;
    this.items.update((current) => [...current, { id, type, message }]);
    window.setTimeout(() => this.dismiss(id), 5000);
  }
}
