import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-info-component',
  imports: [],
  templateUrl: './page-info-component.html',
  styleUrl: './page-info-component.css'
})
export class PageInfoComponent {
    @Input() pageNumber: number = 1;
}
