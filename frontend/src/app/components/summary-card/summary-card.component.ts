import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-summary-card',
  imports: [CommonModule],
  templateUrl: './summary-card.component.html',
  styleUrl: './summary-card.component.css',
})
export class SummaryCardComponent {
  @Input({ required: true }) label = '';
  @Input({ required: true }) value: number | string = 0;
  @Input() icon = 'bi-cash-coin';
  @Input() tone: 'green' | 'blue' | 'amber' | 'red' = 'green';
  @Input() detail = '';
  @Input() change: number | null = null;
  @Input() currency = false;
}
