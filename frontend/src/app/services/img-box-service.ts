import { ComponentRef, inject, Injectable } from '@angular/core';
import { ImgBox } from '../models/ImgBox';
import { CustomImgBox } from '../components/custom-img-box/custom-img-box';
import { PDFViewerService } from './pdfviewer-service';
import { Constants } from '../models/constants/constants';
import { EntityManagerService } from './entity-manager-service';
import { BlockObject } from '../models/BlockObject';

@Injectable({
  providedIn: 'root'
})
export class ImgBoxService {
  public imgboxes: ImgBox[] = [];
  public pdfViewerService = inject(PDFViewerService)

  /**
   * Please create an BlockObject with this.entityManagerService.createBlockObject adn then cast it so ImgBox and pass it here.
   * This function will create the ImgBox HTML container and place it on the pageNumber specified by @pageNumber .
   * @param pageNumber => the page where the img should be placed in.
   * @param img => the img
   */
  public placeImgBoxOntoCanvas(pageNumber: number, imgBox: ImgBox) {
    let editImgBoxComp = this.pdfViewerService.dynamicContainer!.createComponent(CustomImgBox)
    editImgBoxComp = this.createImgBoxContainer(editImgBoxComp, imgBox);

    const page = this.pdfViewerService.getPageWithNumber(pageNumber)
    const imgLayer = page?.htmlContainer?.querySelector(Constants.OVERLAY_IMG)
    imgLayer?.appendChild(editImgBoxComp.location.nativeElement)

    return { comp: editImgBoxComp, box: imgBox }
  }

  //=======================================================================================================================
  // Helper function to create the container where the textbox is being placed. This also registers all
  // events for the textbox like editing, and moving.
  //=======================================================================================================================
  private createImgBoxContainer(editTextBoxComp: ComponentRef<CustomImgBox>, imgbox: ImgBox) {

    editTextBoxComp.instance.imgBox = imgbox;
    // editTextBoxComp.instance.textBoxEditClicked.subscribe((event: any) => this.onTextBoxEditClick(textBox.id, event))


    // TODO find a way to add this function
    // editTextBoxComp.instance.textBoxEditClicked.subscribe((event: any) => this.removeTextBox(textBox.id, event))

    return editTextBoxComp
  }

  /**
   * gets the Dimensions of an image.
   * @param file => the image to get the dimensions for.
   * @returns Promise
   */
  public getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };

    img.onerror = (err) => reject(err);
  });
}

  /**
   * Converts a BlockObject to an ImgBox
   * @param obj => the BlockObject to convert.
   * @returns 
   */
  public toImgBox(obj: BlockObject): ImgBox {
    // dummy dims
    const dims = {
      top: 0,
      left: 0,
      width: 0,
      height: 0,
      resizedHeight: 0,
      resizedWidth: 0,
      currentScale: 0,
      posCreationScale: 0,
      sizeCreationScale: 0,
    }
    const img = new ImgBox(0, 0, dims, "");

    Object.assign(img, obj);

    img.src = "Default Src";

    return img;
  }
}
