import { Component } from '@angular/core';
import { AppIcon, ICONS_USED } from '../../models/IconRegistry';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-credits',
  imports: [CommonModule],
  templateUrl: './credits.html',
  styleUrl: './credits.css'
})
export class Credits {
   icons: AppIcon[] = ICONS_USED;

}
