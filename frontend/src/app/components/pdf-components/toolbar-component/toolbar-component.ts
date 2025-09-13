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

  // use download Service for this
  public OnDownloadBtnClicked(event: Event) {
    const edits = new GlobalEdit([], [1, 2, 3]);
    for (let i = 1; i <= this.pdfViewerService.allRenderedPages.length; i++) {
      const pageOld = this.pdfViewerService.getPageWithNumber(i);
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

  public onPageChange(pageNum: number) {
    this.pdfViewerService.setCurrentPage(this.currentPage);
    if (this.currentPage != 0 && this.currentPage != null)
      this.pdfViewerService.scrollToPage(pageNum);
  }
}
