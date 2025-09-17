import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  standalone: true,
  selector: 'app-status-card',
  templateUrl: './status-card.component.html',
  styleUrls: ['./status-card.component.scss'],
  imports: [MatCardModule]
})
export class StatusCardComponent {
  @Input() title!: string;
  @Input() value!: string | number;
  @Input() delta?: string;
}
