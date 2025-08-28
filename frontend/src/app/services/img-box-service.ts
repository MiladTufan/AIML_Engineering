import { ComponentRef, inject, Injectable } from '@angular/core';
import { ImgBox } from '../models/ImgBox';
import { CustomImgBox } from '../components/custom-img-box/custom-img-box';
import { PDFViewerService } from './pdfviewer-service';
import { Constants } from '../models/constants/constants';

@Injectable({
  providedIn: 'root'
})
export class ImgBoxService {
  public imgboxes: ImgBox[] = [];
  public pdfViewerService = inject(PDFViewerService)



  public createImgBox(pageNumber: number) {
    let editTextBoxComp = this.pdfViewerService.dynamicContainer!.createComponent(CustomImgBox)

    const box_dims = {
      top: 0,
      left: 0,
      width: 500 * this.pdfViewerService.currentScale,
      height: 500 * this.pdfViewerService.currentScale,
      resizedHeight: 0,
      resizedWidth: 0,
      currentScale: this.pdfViewerService.currentScale,
      posCreationScale: this.pdfViewerService.currentScale,
      sizeCreationScale: this.pdfViewerService.currentScale
    }

    const imgBox = new ImgBox(0, 0, box_dims, "/assets/test_images/020_The_lion_king_Snyggve_in_the_Serengeti_National_Park_Photo_by_Giles_Laurent.jpg")
    editTextBoxComp = this.createTextBoxContainer(editTextBoxComp, imgBox);

    const page = this.pdfViewerService.getPageWithNumber(pageNumber)
    const text_layer = page?.htmlContainer?.querySelector(Constants.OVERLAY_IMG)
    text_layer?.appendChild(editTextBoxComp.location.nativeElement)
  }

  //=======================================================================================================================
  // Helper function to create the container where the textbox is being placed. This also registers all
  // events for the textbox like editing, and moving.
  //=======================================================================================================================
  public createTextBoxContainer(editTextBoxComp: ComponentRef<CustomImgBox>, imgbox: ImgBox) {

    editTextBoxComp.instance.imgBox = imgbox;
    // editTextBoxComp.instance.textBoxEditClicked.subscribe((event: any) => this.onTextBoxEditClick(textBox.id, event))


    // TODO find a way to add this function
    // editTextBoxComp.instance.textBoxEditClicked.subscribe((event: any) => this.removeTextBox(textBox.id, event))

    return editTextBoxComp
  }

}
