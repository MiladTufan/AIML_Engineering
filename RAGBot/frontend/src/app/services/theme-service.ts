// theme.service.ts
import { inject, Injectable } from '@angular/core';
import { AssetConstants } from '../models/assetConstants';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private darkMode = false;
  public assetConstants: AssetConstants = new AssetConstants();

  constructor() {
    this.darkMode = localStorage.getItem('theme') === 'dark';
    this.updateTheme();
  }

  toggleTheme(): void {
    this.darkMode = !this.darkMode;
    localStorage.setItem('theme', this.darkMode ? 'dark' : 'light');
    this.updateTheme();
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