import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChartConfiguration } from 'chart.js';
import { ChartComponent } from '../../components/chart/chart.component';
import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';
import { SummaryCardComponent } from '../../components/summary-card/summary-card.component';
import { DashboardData } from '../../models/report.model';
import { ReportService } from '../../services/report.service';
import { getErrorMessage } from '../../services/error.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, ChartComponent, EmptyStateComponent, SummaryCardComponent],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.css',
})
export class DashboardPage implements OnInit {
  private readonly reportService = inject(ReportService);
  private readonly notifications = inject(NotificationService);

  readonly data = signal<DashboardData | null>(null);
  readonly loading = signal(true);

  readonly expenseChart = computed<ChartConfiguration>(() => {
    const items = this.data()?.categoryBreakdown || [];
    return {
      type: 'doughnut',
      data: {
        labels: items.length ? items.map((item) => item.category) : ['No expenses'],
        datasets: [
          {
            data: items.length ? items.map((item) => item.amount) : [1],
            backgroundColor: items.length ? items.map((item) => item.color) : ['#e9ecef'],
            borderWidth: 0,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, usePointStyle: true } },
        },
      },
    };
  });

  readonly trendChart = computed<ChartConfiguration>(() => {
    const items = this.data()?.monthlyTrend || [];
    return {
      type: 'bar',
      data: {
        labels: items.map((item) => item.month),
        datasets: [
          {
            label: 'Income',
            data: items.map((item) => item.income),
            backgroundColor: '#198754',
            borderRadius: 6,
            barPercentage: 0.7,
          },
          {
            label: 'Expenses',
            data: items.map((item) => item.expense),
            backgroundColor: '#fd7e14',
            borderRadius: 6,
            barPercentage: 0.7,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, usePointStyle: true } } },
        scales: {
          y: { beginAtZero: true, grid: { color: '#edf2ef' }, ticks: { precision: 0 } },
          x: { grid: { display: false } },
        },
      },
    };
  });

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.reportService.dashboard().subscribe({
      next: (response) => {
        this.data.set(response.data);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.notifications.error(getErrorMessage(error, 'Unable to load the dashboard.'));
        this.loading.set(false);
      },
    });
  }
}
