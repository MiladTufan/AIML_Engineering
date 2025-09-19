import { Component, signal, ViewChild, ViewContainerRef } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AlertComponent } from './shared/alert/alert';
import { SessionService } from './services/communication/session-service';
import { Constants } from './models/constants/constants';
import { ThemeService } from './services/shared/theme-service';
import { Header } from './components/layout/header/header';
import { DynamicContainerRegistry } from './services/shared/dynamic-container-registry';
import { OrganizeView } from './views/organize-view/organize-view';
import { Checkbox } from './components/shared/checkbox/checkbox';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AlertComponent, Header],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('frontend');

  @ViewChild('dynamicAppContainer', { read: ViewContainerRef })
  dynamicAppContainer!: ViewContainerRef;

  constructor(
    private sessionService: SessionService,
    private dynamicContainerRegistry: DynamicContainerRegistry,
    public themeService: ThemeService,
    private router: Router,
  ) {}

  goToCredits() {
    this.router.navigate([Constants.CREDITS_VIEW]);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  ngAfterViewInit() {
    if (this.dynamicAppContainer)
      this.dynamicContainerRegistry.dynamicAppContainer =
        this.dynamicAppContainer;
  }

  ngOnInit() {
    // this.sessionService
    //   .getAllSignedSids()
    //   .subscribe((signeds_sids: Array<string>) => {
    //     const signed_sid =
    //       this.sessionService.getSessionIdFromBrowser('session_id');
    //     const cookies = document.cookie ? document.cookie.split(';') : [];
    //     for (let cookie of cookies) {
    //       const [key, value] = cookie.trim().split('=');
    //       try {
    //         const val = decodeURIComponent(value);
    //         if (!signeds_sids.includes(val)) {
    //           this.sessionService.deleteCookie(val);
    //           console.log('deleting: ', val);
    //         }
    //       } catch {
    //         this.sessionService.deleteCookie(value);
    //       }
    //     }
    //   });
  }
}
