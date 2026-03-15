import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { ThemeService } from '../../../services/shared/theme-service';

@Component({
  selector: 'app-checkbox',
  imports: [CommonModule],
  templateUrl: './checkbox.html',
  styleUrl: './checkbox.css',
})
export class Checkbox {
  public themeService: ThemeService = inject(ThemeService);
  @Input() IsChecked: Boolean = false;
  @Input() text: string = '';

  @Output() IsCheckedChange: EventEmitter<Boolean> = new EventEmitter();

  toggleCheck() {
    this.IsChecked = !this.IsChecked;
    this.IsCheckedChange.emit(this.IsChecked);
  }
}
