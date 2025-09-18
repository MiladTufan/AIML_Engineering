import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Output } from '@angular/core';
import { ThemeService } from '../../../services/shared/theme-service';

@Component({
  selector: 'app-checkbox',
  imports: [CommonModule],
  templateUrl: './checkbox.html',
  styleUrl: './checkbox.css',
})
export class Checkbox {
  public themeService: ThemeService = inject(ThemeService);
  public IsChecked: Boolean = false;

  @Output() checkChanged: EventEmitter<Boolean> = new EventEmitter();

  toggleCheck() {
    this.IsChecked = !this.IsChecked;
    this.checkChanged.emit(this.IsChecked);
  }
}
