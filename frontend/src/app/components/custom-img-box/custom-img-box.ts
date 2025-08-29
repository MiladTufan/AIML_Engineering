import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { ImgBox } from '../../models/ImgBox';
import { CommonModule } from '@angular/common';
import { Constants } from '../../models/constants/constants';
import { PDFViewerService } from '../../services/pdfviewer-service';
import { EntityManagerService } from '../../services/entity-manager-service';
import { CommonBoxObject } from '../common-box-object/common-box-object';
import { TextStyleBlock } from '../custom-text-edit-box/text-style-block/text-style-block';
import { BlockObject } from '../../models/BlockObject';

@Component({
  selector: 'app-custom-img-box',
  imports: [CommonModule, TextStyleBlock],
  templateUrl: './custom-img-box.html',
  styleUrl: './custom-img-box.css'
})
export class CustomImgBox extends CommonBoxObject {

  @Input() set imgBox(value: ImgBox) {
    this.setBaseBox(value as BlockObject)
  }

  constructor(pdfViewerService: PDFViewerService, entityManagerService: EntityManagerService) {
    super(pdfViewerService, entityManagerService)
  }

}
