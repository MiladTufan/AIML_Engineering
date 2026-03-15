import { Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-test',
  imports: [],
  templateUrl: './test.html',
  styleUrl: './test.css',
})
export class Test {
  @ViewChild('editor') editor!: ElementRef<HTMLDivElement>;
  public boxText: string = '<h1>hhhh</h>';

  // capture input content as HTML
  onInput(event: Event) {
    const content = (event.target as HTMLDivElement).innerHTML;
    console.log('Editor content:', content);
  }

  // set caret at a specific position
  setCaret(pos: number) {
    const el = this.editor.nativeElement;
    const range = document.createRange();
    const sel = window.getSelection();

    range.setStart(el.firstChild || el, pos);
    range.collapse(true);

    sel?.removeAllRanges();
    sel?.addRange(range);
  }
}
