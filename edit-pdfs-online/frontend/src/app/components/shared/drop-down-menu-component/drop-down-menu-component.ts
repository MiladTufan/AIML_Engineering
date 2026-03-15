import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  inject,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../../services/shared/theme-service';

@Component({
  selector: 'app-drop-down-menu-component',
  imports: [FormsModule, CommonModule],
  templateUrl: './drop-down-menu-component.html',
  styleUrl: './drop-down-menu-component.css',
})
export class DropDownMenuComponent {
  //=================================================== Private variables =================================================
  fontOptions = [
    { name: 'Inter', value: 'Inter, sans-serif' },
    { name: 'Roboto', value: 'Roboto, sans-serif' },
    { name: 'Open-Sans', value: '"Open Sans", sans-serif' },
    { name: 'Lato', value: 'Lato, sans-serif' },
    { name: 'Poppins', value: 'Poppins, sans-serif' },
    { name: 'Montserrat', value: 'Montserrat, sans-serif' },
    { name: 'Nunito', value: 'Nunito, sans-serif' },
    { name: 'Ubuntu', value: 'Ubuntu, sans-serif' },
    { name: 'Georgia', value: 'Georgia, serif' },
    { name: 'Courier New', value: '"Courier New", monospace' },
    { name: 'Comic Sans', value: '"Comic Sans MS", cursive, sans-serif' },
    { name: 'Arial', value: 'Arial, sans-serif' },
    { name: 'Verdana', value: 'Verdana, sans-serif' },
    { name: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif' },
    { name: 'Tahoma', value: 'Tahoma, sans-serif' },
    { name: 'Times New Roman', value: '"Times New Roman", serif' },
    { name: 'Lucida Console', value: '"Lucida Console", monospace' },
  ];

  public themeService: ThemeService = inject(ThemeService);

  @ViewChild('headerObj', { static: true })
  headerObj!: ElementRef<HTMLInputElement>;
  //==================================================== Inputs =========================================================
  @Input() dropDownItems: string[] = [];
  @Input() isDropDownOpen: Boolean = false;
  @Input() currentItem: string = '';

  // width and height of each drop down item
  @Input() width: number = 0;
  @Input() height: number = 0;

  //==================================================== Output =========================================================
  @Output() selectedItem = new EventEmitter<string>();
  @Output() selectedItemInput = new EventEmitter<string>();

  toggleDropDown(item: string) {
    this.isDropDownOpen = !this.isDropDownOpen;
    if (this.headerObj) {
      this.headerObj.nativeElement.textContent = item;
      this.currentItem = item;
    }
  }
  ItemClicked(item: string) {
    this.selectedItem.emit(item);
    if (this.headerObj) {
      this.headerObj.nativeElement.textContent = item;
      this.currentItem = item;
    }
  }

  selectItemInput(item: string) {
    this.selectedItemInput.emit(item);
    if (this.headerObj) {
      this.headerObj.nativeElement.textContent = item;
      this.currentItem = item;
    }
  }

  fontClass(fontName: string) {
    const fontFamiliy = this.fontOptions.find((f) => f.name === fontName);
    return fontFamiliy ? fontFamiliy : '';
  }

  _checkClick(id: string, target: HTMLElement) {
    let clickInsideFontSelect = false;
    let node = target;
    clickInsideFontSelect = node?.id === id ? true : false;
    while (node.parentElement) {
      clickInsideFontSelect = node?.id === id ? true : false;
      if (clickInsideFontSelect) return true;
      node = node.parentElement;
    }
    return clickInsideFontSelect;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    try {
      const eventTarget = event.target as HTMLElement;
      let clickInsideFontSelect = false;
      let clickInsideFontSizeSelect = false;

      clickInsideFontSelect = this._checkClick('fontSelect', eventTarget);
      clickInsideFontSizeSelect = this._checkClick(
        'fontSizeSelect',
        eventTarget,
      );

      if (this.isDropDownOpen && !clickInsideFontSelect)
        this.isDropDownOpen = false;

      if (this.isDropDownOpen && !clickInsideFontSizeSelect)
        this.isDropDownOpen = false;
    } catch {}
  }
}
