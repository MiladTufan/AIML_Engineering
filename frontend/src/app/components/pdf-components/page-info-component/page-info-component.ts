import { Component, inject, Input } from '@angular/core';
import { ThemeService } from '../../../services/shared/theme-service';

@Component({
  selector: 'app-page-info-component',
  imports: [],
  templateUrl: './page-info-component.html',
  styleUrl: './page-info-component.css',
})
export class PageInfoComponent {
  @Input() pageNumber: number = 1;
  @Input() width: number = 60;
  @Input() fontSize: number = 32;
  @Input() borderRadius: number = 9;

  public themeService: ThemeService = inject(ThemeService);

  ShowInfo(event: Event) {}

  DeletePage(event: Event) {}

  MovePage(event: Event) {}
}
