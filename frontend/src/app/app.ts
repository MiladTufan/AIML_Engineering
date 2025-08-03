import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AlertComponent } from './shared/alert/alert';
import { AlertService } from './services/alert-service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AlertComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
}
