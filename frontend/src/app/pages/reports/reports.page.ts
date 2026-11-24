import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ChartConfiguration } from 'chart.js';
import { ChartComponent } from '../../components/chart/chart.component';
import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';
import { SummaryCardComponent } from '../../components/summary-card/summary-card.component';
import { Category } from '../../models/category.model';
import { CategoryBreakdownItem, ReportData, ReportPeriod } from '../../models/report.model';
import { CategoryService } from '../../services/category.service';
import { getErrorMessage } from '../../services/error.service';
import { NotificationService } from '../../services/notification.service';
import { ReportService } from '../../services/report.service';

@Component({
  selector: 'app-reports',
  imports: [CommonModule, ReactiveFormsModule, ChartComponent, EmptyStateComponent, SummaryCardComponent],
  templateUrl: './reports.page.html',
  styleUrl: './reports.page.css',
})
export class ReportsPage implements OnInit {
  private readonly reportService = inject(ReportService);
  private readonly categoryService = inject(CategoryService);
  private readonly notifications = inject(NotificationService);

  readonly data = signal<ReportData | null>(null);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);

  readonly filters = new FormGroup({
    period: new FormControl<ReportPeriod>('month', { nonNullable: true }),
    date: new FormControl(new Date().toISOString().slice(0, 10), { nonNullable: true }),
    category: new FormControl('', { nonNullable: true }),
  });

  readonly categoryChart = computed<ChartConfiguration>(() => {
    const items = this.data()?.categorySummary || [];
    return {
      type: 'doughnut',
      data: {
        labels: items.length ? items.map((item) => item.category) : ['No spending'],
        datasets: [
          {
            data: items.length ? items.map((item) => item.amount) : [1],
            backgroundColor: items.length ? items.map((item) => item.color) : ['#e9ecef'],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, usePointStyle: true } } },
      },
    };
  });

  readonly trendChart = computed<ChartConfiguration>(() => {
    const items = this.data()?.trend || [];
    return {
      type: 'bar',
      data: {
        labels: items.map((item) => item.label),
        datasets: [
          {
            label: 'Amount spent',
            data: items.map((item) => item.amount),
            backgroundColor: '#198754',
            borderRadius: 5,
            barPercentage: 0.75,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: '#edf2ef' } },
          x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 12 } },
        },
      },
    };
  });

  ngOnInit(): void {
    this.loadCategories();
    this.loadReport();
  }

  loadCategories(): void {
    this.categoryService.getCategories('expense').subscribe({
      next: (response) => this.categories.set(response.categories),
      error: (error: unknown) => this.notifications.error(getErrorMessage(error, 'Unable to load categories.')),
    });
  }

  loadReport(): void {
    this.loading.set(true);
    const { period, date, category } = this.filters.getRawValue();

    this.reportService.report(period, date, category).subscribe({
      next: (response) => {
        this.data.set(response.data);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.notifications.error(getErrorMessage(error, 'Unable to load the report.'));
        this.loading.set(false);
      },
    });
  }

  trackCategory(_index: number, item: CategoryBreakdownItem): string {
    return item.category;
  }
}
