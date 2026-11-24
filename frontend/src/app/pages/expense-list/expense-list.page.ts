import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';
import { Category } from '../../models/category.model';
import { Transaction } from '../../models/transaction.model';
import { CategoryService } from '../../services/category.service';
import { getErrorMessage } from '../../services/error.service';
import { NotificationService } from '../../services/notification.service';
import { TransactionService } from '../../services/transaction.service';

@Component({
  selector: 'app-expense-list',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, EmptyStateComponent],
  templateUrl: './expense-list.page.html',
  styleUrl: './expense-list.page.css',
})
export class ExpenseListPage implements OnInit {
  private readonly transactionService = inject(TransactionService);
  private readonly categoryService = inject(CategoryService);
  private readonly notifications = inject(NotificationService);

  readonly filters = new FormGroup({
    search: new FormControl('', { nonNullable: true }),
    category: new FormControl('', { nonNullable: true }),
    dateFrom: new FormControl('', { nonNullable: true }),
    dateTo: new FormControl('', { nonNullable: true }),
  });

  readonly transactions = signal<Transaction[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly page = signal(1);
  readonly total = signal(0);
  readonly pagination = signal({ page: 1, limit: 10, pages: 1 });

  ngOnInit(): void {
    this.loadCategories();
    this.loadTransactions();
  }

  loadCategories(): void {
    this.categoryService.getCategories('expense').subscribe({
      next: (response) => this.categories.set(response.categories),
      error: (error: unknown) => this.notifications.error(getErrorMessage(error, 'Unable to load categories.')),
    });
  }

  loadTransactions(): void {
    this.loading.set(true);
    this.transactionService
      .getTransactions({ ...this.filters.getRawValue(), type: 'expense', page: this.page(), limit: 10 })
      .subscribe({
        next: (response) => {
          this.transactions.set(response.transactions);
          this.total.set(response.total);
          this.pagination.set(response.pagination);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.notifications.error(getErrorMessage(error, 'Unable to load expenses.'));
          this.loading.set(false);
        },
      });
  }

  applyFilters(): void {
    this.page.set(1);
    this.loadTransactions();
  }

  resetFilters(): void {
    this.filters.reset({ search: '', category: '', dateFrom: '', dateTo: '' });
    this.applyFilters();
  }

  changePage(page: number): void {
    if (page < 1 || page > this.pagination().pages) return;
    this.page.set(page);
    this.loadTransactions();
  }

  deleteTransaction(transaction: Transaction): void {
    if (!window.confirm(`Delete "${transaction.description}"? This cannot be undone.`)) return;

    this.transactionService.delete(transaction.id).subscribe({
      next: (response) => {
        this.notifications.success(response.message);
        if (this.transactions().length === 1 && this.page() > 1) this.page.update((current) => current - 1);
        this.loadTransactions();
      },
      error: (error: unknown) => this.notifications.error(getErrorMessage(error, 'Unable to delete the expense.')),
    });
  }

  trackById(_index: number, item: Transaction): string {
    return item.id;
  }
}
