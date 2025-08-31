import { Component, ContentChild, ElementRef, EventEmitter, forwardRef, Input, Output, ViewChild, ViewContainerRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EntityManagerService } from '../../../services/box-services/entity-manager-service';
import { Constants } from '../../../models/constants/constants';
import { PDFViewerService } from '../../../services/pdf-services/pdfviewer-service';

@Component({
  selector: 'app-common-box-object',
  imports: [CommonModule],
  templateUrl: './common-box-object.html',
  styleUrl: './common-box-object.css'
})
export class CommonBoxObject {


  isDragging = false;
  dragOffsetX = 0;
  dragOffsetY = 0;
  mouseX: number = 0;
  mouseY: number = 0;
  private resizeObserver!: ResizeObserver;

  @ViewChild('childContainer', { read: ViewContainerRef, static: true }) childContainer!: ViewContainerRef;
  @ViewChild('childContainerAddOn', { read: ViewContainerRef, static: true }) childContainerAddOn!: ViewContainerRef;
  @ViewChild('movableDiv') movableDiv!: ElementRef;

  @Input() boxBase: any
  @Output() positionChanged = new EventEmitter<{ top: number; left: number, clickedPageNum: number }>();

  constructor(private pdfViewerService: PDFViewerService, private entityManagerService: EntityManagerService) {
  }

  ngOnInit() {
    console.log("init CommonBoxComponent")
    
    this.resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (this.pdfViewerService.ignoreResizeTimeout) return;

        const { width, height } = entry.target.getBoundingClientRect();
        const box = this.entityManagerService.blockObjects.find(b => b.id === this.boxBase!.id);

        if (box) {
          const page = this.pdfViewerService.getPageWithNumber(box.pageId)
          const rect2 = (page!.htmlContainer! as HTMLElement).getBoundingClientRect();
          box.BoxDims.resizedWidth = width
          box.BoxDims.resizedHeight = height
          const diff = Math.abs(box.BoxDims.left - rect2.width)

          if (width > diff) {
            box.BoxDims.resizedWidth = diff
            box.BoxDims.width = diff
          }
          box.BoxDims.sizeCreationScale = this.pdfViewerService.currentScale;
        }
      }
    });
  }

	ngAfterViewInit() {
		this.resizeObserver.observe(this.movableDiv.nativeElement);
	}

  onDragEnd(event: DragEvent) {
    if (!event.clientX || !event.clientY) return;
    this.mouseX = event.clientX - this.dragOffsetX
    this.mouseY = event.clientY - this.dragOffsetY
    this.isDragging = false;

    const dropTarget = document.elementFromPoint(event.clientX, event.clientY);
    if (dropTarget) {
      const pageNumber = parseInt(dropTarget.id?.split('-')[1]);
      this.positionChanged.emit({ top: this.mouseY, left: this.mouseX, clickedPageNum: pageNumber })
    }
    else
      console.error(Constants.ERROR_DROPTARGET_UNKNOWN)

  }

  onDragStart(event: MouseEvent) {
    const rect = (event.target as HTMLElement).getBoundingClientRect();

    // Store the offset between mouse and top-left of box
    this.dragOffsetX = event.clientX - rect.left;
    this.dragOffsetY = event.clientY - rect.top;
    this.isDragging = true;
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }
}
