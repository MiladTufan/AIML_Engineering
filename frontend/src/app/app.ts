import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AlertComponent } from './shared/alert/alert';
import { AlertService } from './services/alert-service';
import { PageInfoComponent } from './components/page-info-component/page-info-component';
import { SessionService } from './services/communication/session-service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AlertComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
  constructor(private sessionService: SessionService) {}

  ngOnInit()
  {
  //   this.sessionService.getAllSignedSids().subscribe((signeds_sids: Array<string>) => {
  //     const signed_sid = this.sessionService.getSessionIdFromBrowser("session_id")
  //     const cookies = document.cookie ? document.cookie.split(";") : []
  //     for (let cookie of cookies)
  //     {
  //       const [key, value] = cookie.trim().split("=")
  //       try{
  //          const val = decodeURIComponent(value)
  //          if (!signeds_sids.includes(val))
  //             this.sessionService.deleteCookie(val)
  //       }
  //       catch {
  //         this.sessionService.deleteCookie(value)
  //       }
  //     }
  //   })
  }
}
