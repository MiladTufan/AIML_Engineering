import {
  Component,
  ComponentRef,
  EventEmitter,
  Inject,
  Input,
  Output,
} from '@angular/core';

@Component({
  selector: 'app-number-box',
  imports: [],
  templateUrl: './number-box.html',
  styleUrl: './number-box.css',
})
export class NumberBox {
  @Input() placeholder: string = 'Enter Pagenumber';

  @Output() enteredTextEmitter: EventEmitter<string> = new EventEmitter();

  public compref: any;

  constructor() {}

  resetPlaceHolder() {
    this.placeholder = 'Enter Pagenumber';
  }

  clearPlaceholder() {
    this.placeholder = '';
  }

  OnEnter(value: string) {
    this.enteredTextEmitter.emit(value);
  }

  OK(value: string) {
    this.enteredTextEmitter.emit(value);
  }

  Cancel() {
    if (this.compref) this.compref.destroy();
  }
}
