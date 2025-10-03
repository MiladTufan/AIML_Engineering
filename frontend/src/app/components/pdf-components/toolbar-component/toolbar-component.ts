import { CommonModule } from '@angular/common';
import {
  Component,
  Output,
  EventEmitter,
  ViewChild,
  Input,
} from '@angular/core';
import { FormsModule, MinLengthValidator } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TextEditService } from '../../../services/box-services/text-edit-service';
import { SessionService } from '../../../services/communication/session-service';
import { DownloadService } from '../../../services/communication/download-service';
import { TextStyleBlock } from '../../shared/text-style-block/text-style-block';
import { GlobalEdit, MiniPage } from '../../../models/globalEdit';
import { PDFViewerService } from '../../../services/pdf-services/pdfviewer-service';
import { ThemeService } from '../../../services/shared/theme-service';
import { PdfViewerHelperService } from '../../../services/pdf-services/pdf-viewer-helper-service';
import { OrganizeService } from '../../../services/pdf-services/organize-service';
import { OrganizeView } from '../../../views/organize-view/organize-view';
import { DynamicContainerRegistry } from '../../../services/shared/dynamic-container-registry';

@Component({
  selector: 'app-toolbar-component',
  imports: [CommonModule, FormsModule],
  templateUrl: './toolbar-component.html',
  styleUrl: './toolbar-component.css',
})
export class ToolbarComponent {
  //=============================================== Outputs =============================================
  @Output() textBoxClicked = new EventEmitter<Boolean>();
  @Output() imgInsertClicked = new EventEmitter<Boolean>();

  public currentPage: number = 1;
  private pageNumberSub!: Subscription;

  //=============================================== Children ============================================
  // @ViewChild("TextButtonContainer") textContainer!: ElementRef<HTMLDivElement>;
  @ViewChild(TextStyleBlock) textStyleBlockComponent!: TextStyleBlock;

  //=============================================== Constructor =========================================
  constructor(
    public textEditService: TextEditService,
    private sessionService: SessionService,
    public themeService: ThemeService,
    public pdfViewerService: PDFViewerService,
    private downloadService: DownloadService,
    private pdfViewerHelperService: PdfViewerHelperService,
    private organizeService: OrganizeService,
    private dynamicContaienrRegistry: DynamicContainerRegistry,
  ) {}

  ngOnInit() {
    this.pageNumberSub = this.pdfViewerService.currentPage$.subscribe((val) => {
      this.currentPage = val;
    });
  }

  ngOnDestroy() {
    this.pageNumberSub.unsubscribe();
  }

  //=============================================== Click ===============================================
  public OnTextBtnClicked(event: Event) {
    this.textBoxClicked.emit(true);
  }

  public OnInsertImageBtnClicked(event: Event) {
    this.imgInsertClicked.emit(true);
  }

  /**
   * Disable down button when the current page >= total pages
   * @param $event
   */
  public isDownDisabled() {
    if (this.currentPage >= this.pdfViewerService.totalPages) return true;
    return false;
  }

  /**
   * Disable up button when the current page <= 1
   * @param $event
   */
  public isUpDisabled() {
    if (this.currentPage <= 1) return true;
    return false;
  }

  /**
   * Scroll 1 page down when the down button is clicked
   * @param $event
   */
  public OnDownClicked($event: Event) {
    this.pdfViewerService.scrollToPage(this.currentPage + 1);
  }

  /**
   * Scroll 1 page up when the up button is clicked
   * @param $event
   */
  public onUpClicked($event: Event) {
    this.pdfViewerService.scrollToPage(this.currentPage - 1);
  }

  public OnOrganizeBtnClicked($event: Event) {
    if (!this.organizeService.organizerActive) {
      this.organizeService.organizerActive = true;
      const compref =
        this.dynamicContaienrRegistry.dynamicAppContainer?.createComponent(
          OrganizeView,
        );
      if (compref) compref.instance.organizeComponentRef = compref;
    }
  }

  // use download Service for this
  public OnDownloadBtnClicked(event: Event) {
    const edits = new GlobalEdit([], [1, 2, 3]);
    for (
      let i = 1;
      i <= this.pdfViewerHelperService.allRenderedPages.length;
      i++
    ) {
      const pageOld = this.pdfViewerHelperService.getPageWithNumber(i);
      const miniPage: MiniPage = new MiniPage(i, pageOld!.blockObjects);
      edits.pageEdits.push(miniPage);
    }

    const signed_sid =
      this.sessionService.getSessionIdFromBrowser('session_id');
    if (signed_sid) {
      this.downloadService.completePDF(edits, signed_sid).subscribe({
        next: (response) => {
          console.log('Response:', response);
          this.downloadService.downloadPDF(signed_sid);
        },
        error: (error) => {
          console.error('Error:', error);
        },
      });
    }
  }

  //=============================================== Methods ==============================================

  public enableTextStyle(editState: Boolean) {
    // if (editState)
    // 	this.textStyleBlockComponent.expandColorPallet();
    // else
    // 	this.textStyleBlockComponent.collapseColorPallet();
  }

  public onPageChange(pageNum: number) {}

  public OnEnter(pageNum: number) {
    if (
      this.currentPage != 0 &&
      this.currentPage != null &&
      pageNum <= this.pdfViewerService.totalPages
    ) {
      this.pdfViewerService.setCurrentPage(this.currentPage);
      this.pdfViewerService.scrollToPage(pageNum);
    }
  }
}
