import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Category, CategoryPayload, CategoryType } from '../../models/category.model';
import { CategoryService } from '../../services/category.service';
import { getErrorMessage } from '../../services/error.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-categories',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './categories.page.html',
  styleUrl: './categories.page.css',
})
export class CategoriesPage implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly notifications = inject(NotificationService);

  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly editingId = signal<string | null>(null);

  readonly expenseCategories = computed(() => this.categories().filter((category) => category.type === 'expense'));
  readonly incomeCategories = computed(() => this.categories().filter((category) => category.type === 'income'));

  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2), Validators.maxLength(40)] }),
    type: new FormControl<CategoryType>('expense', { nonNullable: true, validators: [Validators.required] }),
  });

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading.set(true);
    this.categoryService.getCategories('all').subscribe({
      next: (response) => {
        this.categories.set(response.categories);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.notifications.error(getErrorMessage(error, 'Unable to load categories.'));
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
    const payload: CategoryPayload = this.form.getRawValue();
    const editing = this.editingId();
    const request = editing
      ? this.categoryService.update(editing, payload)
      : this.categoryService.create(payload);

    request.subscribe({
      next: (response) => {
        this.notifications.success(response.message);
        this.cancelEdit();
        this.loadCategories();
        this.saving.set(false);
      },
      error: (error: unknown) => {
        this.notifications.error(getErrorMessage(error, 'Unable to save the category.'));
        this.saving.set(false);
      },
    });
  }

  edit(category: Category): void {
    if (category.isDefault) return;
    this.editingId.set(category.id);
    this.form.patchValue({ name: category.name, type: category.type });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', type: 'expense' });
  }

  deleteCategory(category: Category): void {
    if (category.isDefault || !window.confirm(`Delete the "${category.name}" category?`)) return;

    this.categoryService.delete(category.id).subscribe({
      next: (response) => {
        this.notifications.success(response.message);
        if (this.editingId() === category.id) this.cancelEdit();
        this.loadCategories();
      },
      error: (error: unknown) => this.notifications.error(getErrorMessage(error, 'Unable to delete the category.')),
    });
  }
}
