import { CommonModule } from '@angular/common';
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
  imports: [CommonModule],
  templateUrl: './number-box.html',
  styleUrl: './number-box.css',
})
export class NumberBox {
  @Input() placeholder: string = 'Enter Pagenumber';
  @Input() minVal: number = 0;

  @Output() enteredTextEmitter: EventEmitter<string> = new EventEmitter();

  public compref: any;
  public inputInvalid: Boolean = true;

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
  OnInput(value: string) {
    if (isNaN(Number(value)) || Number(value) < this.minVal)
      this.inputInvalid = true;
    else this.inputInvalid = false;
  }

  Cancel() {
    if (this.compref) this.compref.destroy();
  }
}
