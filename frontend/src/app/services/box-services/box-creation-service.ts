import { inject, Injectable } from '@angular/core';
import { BlockObject, BoxDimensions } from '../../models/box-models/BlockObject';
import { Page } from '../../models/Page';
import { TextBox } from '../../models/box-models/TextBox';
import { CommonBoxObject } from '../../components/box-components/common-box-object/common-box-object';
import { CustomTextEditBox } from '../../components/box-components/custom-text-edit-box/custom-text-edit-box';
import { TextStyleBlock } from '../../components/shared/text-style-block/text-style-block';
import { Constants } from '../../models/constants/constants';
import { PDFViewerService } from '../pdf-services/pdfviewer-service';
import { TextEditService } from './text-edit-service';
import { ImgBoxService } from './img-box-service';
import { EntityManagerService } from './entity-manager-service';
import { EventBusService } from '../communication/event-bus-service';

@Injectable({
  providedIn: 'root'
})
export class BoxCreationService {

  private pdfViewerService: PDFViewerService = inject(PDFViewerService)
  private textEditService: TextEditService = inject(TextEditService)
  private imgBoxService: ImgBoxService = inject(ImgBoxService)
  private entityManagerService: EntityManagerService = inject(EntityManagerService)
  private eventBusService: EventBusService = inject(EventBusService)



  constructor() {
    this.eventBusService.on(Constants.EVENT_ENTITY_MANAGER_EMIT).subscribe((data: any) => {
      this.eventBusService.on(Constants.EVENT_ASSIGN_AND_CREATE_NEW_OBJ, data.obj.id.toString()).subscribe((data: any) => {
        this.assignAndCreateNewObj(data.obj, data.parentContainer, data.pageNumber, data.page)
      })
    })

  }
  /**
   * Creates a new object in the target container and assigns it.
   * This function calls the creation logic of each object.
   * This is mainly used when object is moved from one page to another.
   * In that case the object is first deleted from the first page by calling `deleteOldObj()` and
   * then added to the new page. 
   * 
   * This function does NOT move an object it only reassigns it from one
   * page to another.
   */
  private assignAndCreateNewObj(obj: BlockObject, parentContainer: HTMLElement,
    adjustedPageNum: number, page: Page) {
    if (obj instanceof TextBox) {
      const textbox = obj as TextBox
      const blockObj = this.createBlockObject(adjustedPageNum, textbox.BoxDims, false)
      const ret = this.createTextBox(blockObj, blockObj.id, adjustedPageNum)

      page?.addBlockObject(textbox)
      parentContainer.appendChild(ret.parent.location.nativeElement)
    }
  }

      /**
     * sets the BlockObjects baseBoxDims at the time of creation.
     * @param obj => BlockObject where baseBoxDims are set
     * @param boxDims => new BoxDims
     */
    public setObjCoords(obj: BlockObject, boxDims: BoxDimensions) {
        obj.baseTop = boxDims.top;
        obj.baseLeft = boxDims.left;
        obj.baseHeight = boxDims.height;
        obj.baseWidth = boxDims.width;
    }

    /**
     * Calculates the initial Box Dimensions based on the parameters given.
     * @param mouseX => current X coordinate of the mouse.
     * @param mouseY => current Y coordinate of the mouse.
     * @param scale => current scale of the PDF
     * @param entityParentRect => the entity Parent rect => e.g. TextBoxLayer or ImgBoxLayer
     * @returns 
     */
    public calculateInitialBoxDims(mouseX: number, mouseY: number, scale: number, entityParentRect: DOMRect,
        width: number = 110, height: number = 30,): BoxDimensions {
        const top = (mouseY) - entityParentRect.top
        const left = (mouseX) - entityParentRect.left

        const boxDims = {
            top: top,
            left: left,
            width: width * scale,
            height: height * scale,
            resizedHeight: 0,
            resizedWidth: 0,
            currentScale: scale,
            posCreationScale: scale,
            sizeCreationScale: scale
        }
        return boxDims
    }


  /**
   * Creates a BlockObject, adds it to this.blockObjects and also sets it baseCoords.
   * @param id => new ID of the BlockObject
   * @param pageNumber => pageId of the BlockObject
   * @param boxDims => new Dimensions
   * @param rerender => currently rerendering?
   * @returns 
   */
  public createBlockObjectAndInitDims(pageNumber: number, mouseX: number, mouseY: number, scale: number,
    entityParentRect: DOMRect, width: number = 110, height: number = 30, rerender: Boolean = false) {
    const uniqueId = this.entityManagerService.getUniqueId(this.entityManagerService.blockObjects)
    const boxDims = this.calculateInitialBoxDims(mouseX, mouseY, scale, entityParentRect, width, height)

    const blockObj = new BlockObject(uniqueId, pageNumber, boxDims)


    if (!rerender)
      this.setObjCoords(blockObj, boxDims)

    return blockObj
  }


  /**
   * Creates a BlockObject, adds it to this.blockObjects and also sets it baseCoords.
   * @param id => new ID of the BlockObject
   * @param pageNumber => pageId of the BlockObject
   * @param boxDims => new Dimensions
   * @param rerender => currently rerendering?
   * @returns 
   */
  public createBlockObject(pageNumber: number, boxDims: BoxDimensions, rerender: Boolean = false) {
    const uniqueId = this.entityManagerService.getUniqueId(this.entityManagerService.blockObjects)
    const blockObj = new BlockObject(uniqueId, pageNumber, boxDims)
    //this.addOrReplaceBlockObject(blockObj, oldId, rerender)

    if (!rerender)
      this.setObjCoords(blockObj, boxDims)

    return blockObj
  }



  /**
   * creates a TextBox and places it onto the canvas.
   * @param blockObj => the blockObject to create the TextBox out of.
   * @param pageNumber => the page where the TextBox should be created in.
   * @returns  child: textBoxContainer, parent: commonBoxContainer, box: textBox
   */
  public createTextBox(blockObj: BlockObject, oldBoxId: number, pageNumber: number) {
    const textBox = this.textEditService.toTextBox(blockObj)
    textBox.StyleState.textFontSize = textBox.StyleState.textBaseFontSize * this.pdfViewerService.currentScale

    this.entityManagerService.addOrReplaceBlockObject(textBox, oldBoxId, false)

    const ret = this.placeTextBoxOntoCanvas(pageNumber, textBox)
    this.entityManagerService.setComprefSafely(ret.box.id, ret.parent)
    return ret
  }


  /**
   * creates a TextBox and places it onto the canvas.
   * @param blockObj => the blockObject to create the TextBox out of.
   * @param pageNumber => the page where the TextBox should be created in.
   * @returns  child: textBoxContainer, parent: commonBoxContainer, box: textBox
   */
  public createImgBox(blockObj: BlockObject, oldBoxId: number, pageNumber: number, src: string) {
    const imgBox = this.imgBoxService.toImgBox(blockObj)
    imgBox.src = src

    this.entityManagerService.addOrReplaceBlockObject(imgBox, oldBoxId, false)

    const ret = this.imgBoxService.placeImgBoxOntoCanvas(pageNumber, imgBox)
    ret.parent.instance.positionChanged.subscribe((event: any) => this.entityManagerService.executeMove(imgBox, event, pageNumber))

    this.entityManagerService.setComprefSafely(ret.box.id, ret.parent)
    return ret
  }

  /**
 * Please create an BlockObject with this.entityManagerService.createBlockObject adn then cast it to ImgBox and pass it here.
 * This function will create the Text HTML container and place it on the pageNumber specified by @pageNumber .
 * @param pageNumber => the page where the img should be placed in.
 * @param img => the img
 */
  public placeTextBoxOntoCanvas(pageNumber: number, textBox: TextBox, rerender: Boolean = false) {
    let commonBoxContainer = this.pdfViewerService.dynamicContainer!.createComponent(CommonBoxObject)
    let textBoxContainer = commonBoxContainer.instance.childContainer.createComponent(CustomTextEditBox)
    let textStyleBlock = commonBoxContainer.instance.childContainerAddOn.createComponent(TextStyleBlock)

    textStyleBlock.instance.translateX = textBox.BoxDims.left + textBox.BoxDims.width + 10;
    textStyleBlock.instance.translateY = textBox.BoxDims.left + textBox.BoxDims.width + 10;
    textStyleBlock.instance.box = textBox;

    textStyleBlock.instance.styleChanged.subscribe((event: any) => textBoxContainer.instance.updateTextStyle())
    textBoxContainer.instance.textBoxEditClicked.subscribe((event: any) => this.entityManagerService.onTextBoxEditClick(textBox, event))
    commonBoxContainer.instance.positionChanged.subscribe((event: any) => this.entityManagerService.executeMove(textBox, event, pageNumber))

    textBoxContainer.instance.box = textBox;
    commonBoxContainer.instance.boxBase = (textBox as BlockObject);

    // on rerender the Page has still old overlay img layer [ONLY after render the correct overlay img layer is set!!]
    if (!rerender) {
      const page = this.pdfViewerService.getPageWithNumber(pageNumber)
      const textLayer = page?.htmlContainer?.querySelector(Constants.OVERLAY_TEXT)
      textLayer?.appendChild(commonBoxContainer.location.nativeElement)
    }

    return { child: textBoxContainer, parent: commonBoxContainer, box: textBox }
  }
}
