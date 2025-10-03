import { Component, inject, Input } from '@angular/core';
import { ThemeService } from '../../../services/shared/theme-service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-image-button',
  imports: [CommonModule],
  templateUrl: './image-button.html',
  styleUrl: './image-button.css',
})
export class ImageButton {
  @Input() darkSrc: string = '';
  @Input() lightSrc: string = '';
  @Input() btnText: string = '';
  @Input() bgColor: string = 'transparent';
  @Input() imgSide: string = '';

  @Input() width: number = 24;
  @Input() height: number = 24;

  public themeService: ThemeService = inject(ThemeService);
}
