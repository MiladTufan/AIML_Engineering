import {
  Component,
  ComponentRef,
  ElementRef,
  HostListener,
  inject,
  Renderer2,
  signal,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { TextEditService } from '../../services/box-services/text-edit-service';
import { Subscription } from 'rxjs';
import { Constants } from '../../models/constants/constants';
import { EntityManagerService } from '../../services/box-services/entity-manager-service';
import { ImgBoxService } from '../../services/box-services/img-box-service';
import { AbortException } from 'pdfjs-dist';
import { ToolbarComponent } from '../../components/pdf-components/toolbar-component/toolbar-component';
import { PdfViewerComponent } from '../../components/pdf-components/pdf-viewer-component/pdf-viewer-component';
import { PDFViewerService } from '../../services/pdf-services/pdfviewer-service';
import { PDFFileService } from '../../services/pdf-services/pdffile-service';
import { BoxCreationService } from '../../services/box-services/box-creation-service';
import { NavigatorComponent } from '../../components/pdf-components/navigator-component/navigator-component';
import { PdfViewerHelperService } from '../../services/pdf-services/pdf-viewer-helper-service';
import { ZoomController } from '../../components/pdf-components/zoom-controller/zoom-controller';
import { EventBusService } from '../../services/communication/event-bus-service';
import { LoggerService } from '../../services/shared/logger-service';

@Component({
  selector: 'app-edit-pdfview',
  standalone: true,
  imports: [
    PdfViewerComponent,
    ToolbarComponent,
    NavigatorComponent,
    ZoomController,
  ],
  templateUrl: './edit-pdfview.html',
  styleUrl: './edit-pdfview.css',
})
export class EditPDFView {
  //=================================================== Private variables =================================================
  private mouseX: number = 0;
  private mouseY: number = 0;
  private canCreateTextbox: Boolean = false;
  private canCreateImgBox: Boolean = false;

  //=================================================== Public variables ==================================================
  public pdfSrc = signal(new Uint8Array());
  public currentPageNumber: number = 1;
  public scrollMode: number = 0;
  public currentZoom: number = 1.0;
  private pageNumberSub!: Subscription;

  //==================================================== Children =========================================================
  @ViewChild(ToolbarComponent) toolbar!: ToolbarComponent;

  private pdfViewService: PDFViewerService = inject(PDFViewerService);
  private pdfViewerHelperService: PdfViewerHelperService = inject(
    PdfViewerHelperService,
  );
  private pdfFileService: PDFFileService = inject(PDFFileService);
  private imgBoxService: ImgBoxService = inject(ImgBoxService);
  private boxCreationService: BoxCreationService = inject(BoxCreationService);
  private eventBusService: EventBusService = inject(EventBusService);
  private logger: LoggerService = inject(LoggerService);

  //=================================================== Constructor =======================================================
  constructor(private viewContainerRef: ViewContainerRef) {}

  // ================================================== Listener functions ================================================

  //=======================================================================================================================
  // Listen on Mouseclick over the entire Window. Used for determining the coordinates of any object placed inside
  // the document.
  //=======================================================================================================================
  @HostListener('document:mousemove', ['$event'])
  trackmouse(event: MouseEvent) {
    this.mouseX = event.clientX;
    this.mouseY = event.clientY;
  }

  //=======================================================================================================================
  // Is run when the View is initialized. Initializes the dynamic Container used to add dynamic elements likes textboxes.
  //=======================================================================================================================
  async ngOnInit() {
    this.pageNumberSub = this.pdfViewService.currentPage$.subscribe((val) => {
      this.currentPageNumber = val;
    });
  }

  //=======================================================================================================================
  // When the user clicks on the textbox create button on the toolbar this function is fired.
  //=======================================================================================================================
  canCreateTextBox() {
    this.canCreateTextbox = true;
  }

  //=======================================================================================================================
  // When the user clicks on the Image Insert button on the toolbar this function is fired.
  //=======================================================================================================================
  canCreateImg() {
    this.canCreateImgBox = true;
  }

  /**
   * Select an Image file on ImageInsert click
   * @param event
   */
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.pdfFileService.imgFile = file;
      this.logger.info(`Selected file: ${file.name}`, this.constructor.name);
    }
  }

  //=======================================================================================================================
  // This function is responsible for placing the Image inside the PDF canvas.
  //=======================================================================================================================
  public createImageBox(event: Event) {
    if (this.canCreateImgBox) {
      this.canCreateImgBox = false;
      const containerElement = event.target as HTMLElement;
      const imgFile = this.pdfFileService.imgFile;

      if (imgFile) {
        const pageNumber = parseInt(containerElement.id?.split('-')[1]);
        const page = this.pdfViewerHelperService.getPageWithNumber(pageNumber);
        const entityParentContainer = page?.htmlContainer?.querySelector(
          Constants.OVERLAY_TEXT,
        );
        const entityParentRect = (
          entityParentContainer as HTMLElement
        ).getBoundingClientRect();
        this.imgBoxService.getImageDimensions(imgFile).then((dim) => {
          const blockObj = this.boxCreationService.createBlockObjectAndInitDims(
            pageNumber,
            this.mouseX,
            this.mouseY,
            this.pdfViewerHelperService.currentScale,
            entityParentRect,
            dim.width,
            dim.height,
            false,
          );

          const ret = this.boxCreationService.createImgBox(
            blockObj,
            blockObj,
            pageNumber,
            URL.createObjectURL(imgFile),
          );

          this.logger.info(
            `ImgBox was created on page: ${pageNumber}`,
            this.constructor.name,
          );
        });
        return;
      }
      this.logger.error('Invalid Image file', this.constructor.name);
    }
  }
  //=======================================================================================================================
  // This function is responsible for placing the Textbox inside the PDF canvas.
  //=======================================================================================================================
  public createTextBox(event: Event) {
    if (this.canCreateTextbox) {
      this.canCreateTextbox = false;
      const containerElement = event.target as HTMLElement;
      const pageNumber = parseInt(containerElement.id?.split('-')[1]);
      const page = this.pdfViewerHelperService.getPageWithNumber(pageNumber);
      const entityParentContainer = page?.htmlContainer?.querySelector(
        Constants.OVERLAY_TEXT,
      );
      const entityParentRect = (
        entityParentContainer as HTMLElement
      ).getBoundingClientRect();

      const blockObj = this.boxCreationService.createBlockObjectAndInitDims(
        pageNumber,
        this.mouseX,
        this.mouseY,
        this.pdfViewerHelperService.currentScale,
        entityParentRect,
      );

      this.boxCreationService.createTextBox(blockObj, blockObj, pageNumber);
      this.eventBusService.emit(Constants.EVENT_PAGE_RENDERED, {
        pageNumber: blockObj.pageId,
        updated: true,
      });

      this.logger.info(
        `TextBox was created on page: ${pageNumber}`,
        this.constructor.name,
      );
    }
  }
}
