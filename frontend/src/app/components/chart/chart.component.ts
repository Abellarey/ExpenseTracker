import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, ViewChild } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-chart',
  template: `
    <div class="chart-wrap" [style.height.px]="height">
      <canvas #chartCanvas></canvas>
    </div>
  `,
  styles: [
    `
      .chart-wrap {
        position: relative;
        width: 100%;
      }
    `,
  ],
})
export class ChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) config!: ChartConfiguration;
  @Input() height = 280;

  @ViewChild('chartCanvas', { static: true }) private readonly canvas!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;

  ngAfterViewInit(): void {
    this.chart = new Chart(this.canvas.nativeElement, this.config);
  }

  ngOnChanges(): void {
    if (!this.chart || !this.config) return;
    this.chart.config.data = this.config.data;
    this.chart.config.options = this.config.options;
    this.chart.update();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}
