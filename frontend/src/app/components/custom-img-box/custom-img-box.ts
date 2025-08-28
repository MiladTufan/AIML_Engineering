import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ImgBox } from '../../models/ImgBox';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-custom-img-box',
  imports: [CommonModule],
  templateUrl: './custom-img-box.html',
  styleUrl: './custom-img-box.css'
})
export class CustomImgBox {

  isDragging = false;
  dragOffsetX = 0;
  dragOffsetY = 0;
  mouseX: number = 0;
  mouseY: number = 0;
  private resizeObserver!: ResizeObserver;

  @Output() positionChanged = new EventEmitter<{ top: number; left: number }>();
  @Input() imgBox: any;



  onDragEnd(event: DragEvent) {
    if (!event.clientX || !event.clientY) return;
    this.mouseX = event.clientX - this.dragOffsetX
    this.mouseY = event.clientY - this.dragOffsetY
    this.isDragging = false;
    this.positionChanged.emit({ top: this.mouseY, left: this.mouseX })
  }

  onDragStart(event: MouseEvent) {
    const rect = (event.target as HTMLElement).getBoundingClientRect();

    // Store the offset between mouse and top-left of box
    this.dragOffsetX = event.clientX - rect.left;
    this.dragOffsetY = event.clientY - rect.top;
    this.isDragging = true;
  }
}
