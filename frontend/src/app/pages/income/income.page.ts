import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';
import { Category } from '../../models/category.model';
import { Transaction, TransactionPayload } from '../../models/transaction.model';
import { CategoryService } from '../../services/category.service';
import { getErrorMessage } from '../../services/error.service';
import { NotificationService } from '../../services/notification.service';
import { TransactionService } from '../../services/transaction.service';

type IncomeField = 'source' | 'amount' | 'category' | 'date' | 'notes';

@Component({
  selector: 'app-income',
  imports: [CommonModule, ReactiveFormsModule, EmptyStateComponent],
  templateUrl: './income.page.html',
  styleUrl: './income.page.css',
})
export class IncomePage implements OnInit {
  private readonly transactionService = inject(TransactionService);
  private readonly categoryService = inject(CategoryService);
  private readonly notifications = inject(NotificationService);

  readonly transactions = signal<Transaction[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly editingId = signal<string | null>(null);

  readonly form = new FormGroup({
    source: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2), Validators.maxLength(120)] }),
    amount: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0.01), Validators.max(1000000000)] }),
    category: new FormControl('Salary', { nonNullable: true, validators: [Validators.required] }),
    date: new FormControl(new Date().toISOString().slice(0, 10), { nonNullable: true, validators: [Validators.required] }),
    notes: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(1000)] }),
  });

  ngOnInit(): void {
    this.loadCategories();
    this.loadIncome();
  }

  loadCategories(): void {
    this.categoryService.getCategories('income').subscribe({
      next: (response) => this.categories.set(response.categories),
      error: (error: unknown) => this.notifications.error(getErrorMessage(error, 'Unable to load income categories.')),
    });
  }

  loadIncome(): void {
    this.loading.set(true);
    this.transactionService.getTransactions({ type: 'income', sort: '-date', limit: 100 }).subscribe({
      next: (response) => {
        this.transactions.set(response.transactions);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.notifications.error(getErrorMessage(error, 'Unable to load income records.'));
        this.loading.set(false);
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const values = this.form.getRawValue();
    const payload: TransactionPayload = {
      type: 'income',
      description: values.source,
      amount: values.amount,
      category: values.category,
      date: values.date,
      paymentMethod: '',
      notes: values.notes,
    };

    const editing = this.editingId();
    const request = editing
      ? this.transactionService.update(editing, payload)
      : this.transactionService.create(payload);

    request.subscribe({
      next: (response) => {
        this.notifications.success(response.message);
        this.resetForm();
        this.loadIncome();
        this.saving.set(false);
      },
      error: (error: unknown) => {
        this.notifications.error(getErrorMessage(error, 'Unable to save the income record.'));
        this.saving.set(false);
      },
    });
  }

  edit(transaction: Transaction): void {
    this.editingId.set(transaction.id);
    this.form.patchValue({
      source: transaction.description,
      amount: transaction.amount,
      category: transaction.category,
      date: transaction.date.slice(0, 10),
      notes: transaction.notes || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  resetForm(): void {
    this.editingId.set(null);
    this.form.reset({
      source: '',
      amount: 0,
      category: 'Salary',
      date: new Date().toISOString().slice(0, 10),
      notes: '',
    });
  }

  deleteTransaction(transaction: Transaction): void {
    if (!window.confirm(`Delete income record "${transaction.description}"?`)) return;

    this.transactionService.delete(transaction.id).subscribe({
      next: (response) => {
        this.notifications.success(response.message);
        if (this.editingId() === transaction.id) this.resetForm();
        this.loadIncome();
      },
      error: (error: unknown) => this.notifications.error(getErrorMessage(error, 'Unable to delete the income record.')),
    });
  }

  isInvalid(field: IncomeField): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.touched || control.dirty);
  }
}
