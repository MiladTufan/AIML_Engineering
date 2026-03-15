import { Component, inject, input } from '@angular/core';
import { PDFViewerService } from '../../../services/pdf-services/pdfviewer-service';
import { PdfViewerHelperService } from '../../../services/pdf-services/pdf-viewer-helper-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-zoom-controller',
  imports: [CommonModule, FormsModule],
  templateUrl: './zoom-controller.html',
  styleUrl: './zoom-controller.css',
})
export class ZoomController {
  public inputValue: string = '100 %';

  public pdfViewerService: PDFViewerService = inject(PDFViewerService);
  public pdfViewerHelperService: PdfViewerHelperService = inject(
    PdfViewerHelperService,
  );

  scalePDF(scale: number) {
    this.pdfViewerHelperService.currentScale = scale;
    for (const p of this.pdfViewerService.visiblePages.getValue()) {
      this.pdfViewerService.renderQueue.add(p);
    }
    this.pdfViewerService.renderTrigger.next(Number(scale));
  }

  updateInputValue(scale: number) {
    return Math.round(scale * 100) + ' %';
  }

  //prettier-ignore
  isPlusDisabled()
  {
    if (this.pdfViewerHelperService.checkScaleUpPossible(this.pdfViewerHelperService.currentScale))
      return false
    return true
  }

  //prettier-ignore
  isMinusDisabled()
  {
    if (this.pdfViewerHelperService.checkScaleDownPossible(this.pdfViewerHelperService.currentScale))
      return false
    return true
  }
  onZoomChange(scale: string) {}

  OnEnter(scale: string) {
    try {
      let numScale = Number(scale.replace('%', '')) / 100;
      const ret = this.pdfViewerHelperService.checkScaleValid(numScale);
      if (ret.valid) this.scalePDF(numScale);

      this.inputValue = this.updateInputValue(ret.scale);
    } catch {
      console.warn(`Invalid scale value entered: ${scale}`);
    }
  }

  OnMinusClicked(event: Event) {
    let numScale = Number(this.inputValue.replace('%', '')) / 100;
    numScale -= this.pdfViewerHelperService.scaleStep;
    const ret = this.pdfViewerHelperService.checkScaleValid(numScale);

    if (ret.valid) this.scalePDF(numScale);
    this.inputValue = this.updateInputValue(ret.scale);
  }

  onPlusClicked(event: Event) {
    let numScale = Number(this.inputValue.replace('%', '')) / 100;
    numScale += this.pdfViewerHelperService.scaleStep;

    const ret = this.pdfViewerHelperService.checkScaleValid(numScale);

    if (ret.valid) this.scalePDF(numScale);
    this.inputValue = this.updateInputValue(ret.scale);
  }
}
