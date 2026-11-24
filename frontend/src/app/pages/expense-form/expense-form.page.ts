import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Category } from '../../models/category.model';
import { TransactionPayload } from '../../models/transaction.model';
import { CategoryService } from '../../services/category.service';
import { getErrorMessage, getFieldErrors } from '../../services/error.service';
import { NotificationService } from '../../services/notification.service';
import { TransactionService } from '../../services/transaction.service';

type ExpenseField = 'description' | 'amount' | 'category' | 'date' | 'paymentMethod' | 'notes';

@Component({
  selector: 'app-expense-form',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './expense-form.page.html',
  styleUrl: './expense-form.page.css',
})
export class ExpenseFormPage implements OnInit {
  private readonly transactionService = inject(TransactionService);
  private readonly categoryService = inject(CategoryService);
  private readonly notifications = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isEdit = signal(false);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal('');
  readonly categories = signal<Category[]>([]);
  readonly serverErrors = signal<Record<string, string>>({});

  private transactionId = '';

  readonly form = new FormGroup({
    description: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2), Validators.maxLength(120)] }),
    amount: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0.01), Validators.max(1000000000)] }),
    category: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    date: new FormControl(new Date().toISOString().slice(0, 10), { nonNullable: true, validators: [Validators.required] }),
    paymentMethod: new FormControl('Cash', { nonNullable: true, validators: [Validators.maxLength(40)] }),
    notes: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(1000)] }),
  });

  ngOnInit(): void {
    this.loadCategories();
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.transactionId = id;
    this.isEdit.set(true);
    this.loading.set(true);

    this.transactionService.getTransaction(id).subscribe({
      next: (response) => {
        this.form.patchValue({
          description: response.transaction.description,
          amount: response.transaction.amount,
          category: response.transaction.category,
          date: response.transaction.date.slice(0, 10),
          paymentMethod: response.transaction.paymentMethod || 'Cash',
          notes: response.transaction.notes || '',
        });
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.errorMessage.set(getErrorMessage(error, 'Unable to load this expense.'));
        this.loading.set(false);
      },
    });
  }

  loadCategories(): void {
    this.categoryService.getCategories('expense').subscribe({
      next: (response) => this.categories.set(response.categories),
      error: (error: unknown) => this.notifications.error(getErrorMessage(error, 'Unable to load categories.')),
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    this.serverErrors.set({});

    const payload: TransactionPayload = { ...this.form.getRawValue(), type: 'expense' };

    const request = this.isEdit()
      ? this.transactionService.update(this.transactionId, payload)
      : this.transactionService.create(payload);

    request.subscribe({
      next: (response) => {
        this.notifications.success(response.message);
        void this.router.navigate(['/expenses']);
      },
      error: (error: unknown) => {
        this.errorMessage.set(getErrorMessage(error, 'Unable to save the expense.'));
        this.serverErrors.set(getFieldErrors(error));
        this.saving.set(false);
      },
    });
  }

  isInvalid(field: ExpenseField): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.touched || control.dirty);
  }

  fieldMessage(field: ExpenseField): string {
    const serverMessage = this.serverErrors()[field];
    if (serverMessage) return serverMessage;

    const control = this.form.controls[field];
    if (control.hasError('required')) return 'This field is required.';
    if (control.hasError('minlength')) return 'Use at least 2 characters.';
    if (control.hasError('min')) return 'Amount must be greater than zero.';
    if (control.hasError('maxlength')) return 'This is too long.';
    return 'Please check this field.';
  }
}
