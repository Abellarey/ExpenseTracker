import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastComponent } from '../toast/toast.component';

@Component({
  selector: 'app-main-layout',
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, ToastComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
})
export class MainLayoutComponent {
  private readonly auth = inject(AuthService);

  readonly currentUser = this.auth.currentUser;
  readonly sidebarOpen = signal(false);
  readonly year = new Date().getFullYear();

  readonly navigation = [
    { label: 'Dashboard', path: '/dashboard', icon: 'bi-grid-1x2' },
    { label: 'Expenses', path: '/expenses', icon: 'bi-receipt' },
    { label: 'Add Expense', path: '/expenses/new', icon: 'bi-plus-circle' },
    { label: 'Income', path: '/income', icon: 'bi-wallet2' },
    { label: 'Categories', path: '/categories', icon: 'bi-tags' },
    { label: 'Reports', path: '/reports', icon: 'bi-bar-chart-line' },
    { label: 'Profile', path: '/profile', icon: 'bi-person' },
  ];

  toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  logout(): void {
    this.closeSidebar();
    this.auth.logout();
  }
}
