import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AlertComponent } from './shared/alert/alert';
import { AlertService } from './services/alert-service';
import { PageInfoComponent } from './components/page-info-component/page-info-component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AlertComponent, PageInfoComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
}
