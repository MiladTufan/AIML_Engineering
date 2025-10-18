// theme.service.ts
import { inject, Injectable } from '@angular/core';
import { AssetConstants } from '../../models/constants/assetConstants';
import { LoggerService } from './logger-service';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private darkMode = false;
  public assetConstants: AssetConstants = new AssetConstants();
  private logger: LoggerService = inject(LoggerService);

  constructor() {
    this.darkMode = localStorage.getItem('theme') === 'dark';
    this.updateTheme();
  }

  toggleTheme(): void {
    this.darkMode = !this.darkMode;
    localStorage.setItem('theme', this.darkMode ? 'dark' : 'light');
    this.updateTheme();
    this.logger.info('Theme was changed to DarkMode: ', this.darkMode);
  }

  private updateTheme(): void {
    const html = document.documentElement;
    if (this.darkMode) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }

  isDarkMode(): boolean {
    return this.darkMode;
  }
}
