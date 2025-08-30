import { ComponentRef, inject, Injectable } from '@angular/core';
import { ImgBox } from '../models/ImgBox';
import { CustomImgBox } from '../components/custom-img-box/custom-img-box';
import { PDFViewerService } from './pdfviewer-service';
import { Constants } from '../models/constants/constants';
import { BlockObject } from '../models/BlockObject';
import { ImgStyle } from '../models/TextStyle';
import { CommonBoxObject } from '../components/common-box-object/common-box-object';

@Injectable({
  providedIn: 'root'
})
export class ImgBoxService {
  public imgboxes: ImgBox[] = [];
  public pdfViewerService = inject(PDFViewerService)

  /**
   * Please create an BlockObject with this.entityManagerService.createBlockObject adn then cast it to ImgBox and pass it here.
   * This function will create the ImgBox HTML container and place it on the pageNumber specified by @pageNumber .
   * @param pageNumber => the page where the img should be placed in.
   * @param img => the img
   */
  public placeImgBoxOntoCanvas(pageNumber: number, imgBox: ImgBox, rerender: Boolean = false) {
    let commonBoxContainer = this.pdfViewerService.dynamicContainer!.createComponent(CommonBoxObject)
    let imgBoxContainer = commonBoxContainer.instance.childContainer.createComponent(CustomImgBox)

    imgBoxContainer.instance.imgBox = imgBox;
    commonBoxContainer.instance.boxBase = (imgBox as BlockObject);

    // on rerender the Page has still old overlay img layer [ONLY after render the correct overlay img layer is set!!]
    if (!rerender) {
      const page = this.pdfViewerService.getPageWithNumber(pageNumber)
      const imgLayer = page?.htmlContainer?.querySelector(Constants.OVERLAY_IMG)
      imgLayer?.appendChild(commonBoxContainer.location.nativeElement)
    }

    return { child: imgBoxContainer, parent: commonBoxContainer, box: imgBox }
  }

  //=======================================================================================================================
  // Helper function to create the container where the textbox is being placed. This also registers all
  // events for the textbox like editing, and moving.
  //=======================================================================================================================
  private createImgBoxContainer(editTextBoxComp: ComponentRef<CustomImgBox>, imgbox: ImgBox) {


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
    const img = new ImgBox(0, 0, dims, "", new ImgStyle());

    Object.assign(img, obj);

    img.src = "Default Src";

    return img;
  }
}
