import { Component } from '@angular/core';

@Component({
  selector: 'app-test',
  imports: [],
  templateUrl: './test.html',
  styleUrl: './test.css'
})
export class Test {
  boxText: string = "<h2>Hello World</h2><p>This is a paragraph.</p>";
}
