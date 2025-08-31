import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-info-component',
  imports: [],
  templateUrl: './page-info-component.html',
  styleUrl: './page-info-component.css'
})
export class PageInfoComponent {

  @Input() pageNumber: number = 1;
  @Input() width: number = 60;
  @Input() fontSize: number = 32;
  @Input() borderRadius: number = 9;




  ShowInfo(event: Event) {

  }

  DeletePage(event: Event) {

  }

  MovePage(event: Event) {
  }
}
