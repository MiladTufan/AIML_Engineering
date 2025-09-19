import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { ThemeService } from '../../../services/shared/theme-service';
import { PDFViewerService } from '../../../services/pdf-services/pdfviewer-service';
import { PdfViewerHelperService } from '../../../services/pdf-services/pdf-viewer-helper-service';
import { Router } from '@angular/router';
import { Constants } from '../../../models/constants/constants';
import { DynamicContainerRegistry } from '../../../services/shared/dynamic-container-registry';
import { OrganizeView } from '../../../views/organize-view/organize-view';
import { Checkbox } from '../../shared/checkbox/checkbox';
import { OrganizeService } from '../../../services/pdf-services/organize-service';

@Component({
  selector: 'app-page-info-component',
  imports: [Checkbox],
  templateUrl: './page-info-component.html',
  styleUrl: './page-info-component.css',
})
export class PageInfoComponent {
  @Input() pageNumber: number = 1;
  @Input() width: number = 60;
  @Input() fontSize: number = 32;
  @Input() borderRadius: number = 9;
  @Input() IsChecked: Boolean = false;
  @Input() IsOrganizePreview: Boolean = false;

  @Output() IsCheckedChange: EventEmitter<Boolean> = new EventEmitter();

  @Input() IsPageDeleted: Boolean = false;
  @Output() IsPageDeletedChange: EventEmitter<{
    pageNumber: number;
    deleted: Boolean;
  }> = new EventEmitter();

  public themeService: ThemeService = inject(ThemeService);
  public pdfViewerService: PDFViewerService = inject(PDFViewerService);
  public dynamicContaienrRegistry: DynamicContainerRegistry = inject(
    DynamicContainerRegistry,
  );
  private organizeService: OrganizeService = inject(OrganizeService);
  public router: Router = inject(Router);

  ShowInfo(event: Event) {}

  DeletePage(event: Event) {
    if (!this.organizeService.organizerActive) {
      this.organizeService.organizerActive = true;
      const compref =
        this.dynamicContaienrRegistry.dynamicAppContainer?.createComponent(
          OrganizeView,
        );
      if (compref) compref.instance.organizeComponentRef = compref;
    } else {
      this.IsPageDeleted = !this.IsPageDeleted;
      this.IsPageDeletedChange.emit({
        pageNumber: this.pageNumber,
        deleted: this.IsPageDeleted,
      });
    }

    //this.router.navigate([Constants.ORGANIZE_VIEW]);
    //this.pdfViewerService.deletePage(this.pageNumber);
  }

  checkChanged(checkChanged: Boolean) {
    this.IsChecked = this.IsChecked;
    this.IsCheckedChange.emit(checkChanged);
  }

  MovePage(event: Event) {}
}
