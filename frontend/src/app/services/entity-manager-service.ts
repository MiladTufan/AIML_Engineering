import { Injectable, Type } from '@angular/core';
import { BlockObject, BoxDimensions } from '../models/BlockObject';
import { PDFViewerService } from './pdfviewer-service';
import { TextBox } from '../models/TextBox';
import { Constants } from '../models/constants/constants';
import { Page } from '../models/Page';
import { TextEditService } from './text-edit-service';
import { ImgBox } from '../models/ImgBox';

@Injectable({
    providedIn: 'root'
})
export class EntityManagerService {

    constructor(private pdfViewerService: PDFViewerService, private textEditService: TextEditService) { }

    public blockObjects: BlockObject[] = [];

    /**
     * Finds and returns the parent container of the current object.
     * Useful for checking boundaries or removing the object from its context.
     */
    private getParentContainer(obj: BlockObject, page: Page): HTMLElement | null {
        if (obj instanceof TextBox)
            return page?.htmlContainer?.querySelector(Constants.OVERLAY_TEXT)
        if (obj instanceof ImgBox)
            return page?.htmlContainer?.querySelector(Constants.OVERLAY_IMG)
        return null
    }

    /**
     * Checks whether the object’s X position is within allowed bounds.
     * Prevents moving outside of horizontal limits.
     */
    private checkXBounds(box: BlockObject, container: DOMRect) {
        const width = (box.BoxDims.resizedWidth != 0) ? box.BoxDims.resizedWidth : box.BoxDims.width

        if (box.BoxDims.left < 0) box.BoxDims.left = 0;
        
        if ((box.BoxDims.left + width) > container.width) 
            box.BoxDims.left = (container.width - width);

        return box.BoxDims.left
    }

    /**
     * Checks whether the object’s Y position is within allowed bounds.
     * Prevents moving outside of vertical limits.
     */
    private checkYBounds(box: BlockObject, container: DOMRect) {
        const height = (box.BoxDims.resizedHeight != 0) ? box.BoxDims.resizedHeight : box.BoxDims.height
        if (box.BoxDims.top < 0) box.BoxDims.top = 0;

        if ((box.BoxDims.top + height) > container.height) 
            box.BoxDims.top = (container.height - height);

        return box.BoxDims.top
    }

    /**
     * Moves the object by setting new top, left coords. Also resets the posCreationScale
     */
    private moveObject(obj: BlockObject, pos: { top: number, left: number }, entityParentRect: DOMRect, pageContainerRect: DOMRect) {
        obj.BoxDims.top = (pos.top - entityParentRect.top);
        obj.BoxDims.left = pos.left - entityParentRect.left;
        obj.BoxDims.left = this.checkXBounds(obj, pageContainerRect)
        obj.BoxDims.top = this.checkYBounds(obj, pageContainerRect)

        obj.baseLeft = obj.BoxDims.left;
        obj.baseTop = obj.BoxDims.top;
        obj.BoxDims.posCreationScale = this.pdfViewerService.currentScale;
    }

    /**
     * Removes the object from its old container.
     * Calls the remove logic for each Object type, e.g. TextBox
     */
    private deleteOldObj(obj: BlockObject, pageNum: number,) {
        if (obj instanceof TextBox) {
            this.textEditService.removeBoxFromPage(obj.id)
            const oldBox: any = this.textEditService.textboxes.find(b => b.id === obj.id)
            const idx = this.textEditService.textboxes.indexOf(oldBox);
            this.textEditService.textboxes.splice(idx, 1);

            const pageOld = this.pdfViewerService.getPageWithNumber(pageNum)
            pageOld?.removeTextBox(obj as TextBox)
        }
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
            const ret = this.textEditService.createTextBox(textbox.BoxDims, textbox.StyleState,
                adjustedPageNum, textbox.BoxDims.currentScale,
                this.pdfViewerService.currentScrollTop)

            page?.appendTextBox(textbox)
            parentContainer.appendChild(ret.comp.location.nativeElement)
            ret.comp.instance.positionChanged.subscribe((event: any) => this.executeMove(ret.box, event, page.pageNum))
        }
    }

    /**
     * This function adds a BlockObject to this.blockObjects. If it already exists then it replaces it.
     * On Replace it also sets the baseBoxDims.
     * @param obj => obj to add
     * @param rerender => currently rerendering?
     */
    public addOrReplaceBlockObject(newObj: BlockObject, oldObjId: number, rerender: Boolean) {
        const page = this.pdfViewerService.getPageWithNumber(newObj.pageId)
        const oldBox: any = this.blockObjects.find(b => b.id === oldObjId)
        if (oldBox) {
            const idx = this.blockObjects.indexOf(oldBox);
            newObj.baseTop = oldBox.baseTop;
            newObj.baseLeft = oldBox.baseLeft;
            newObj.baseHeight = oldBox.baseHeight;
            newObj.baseWidth = oldBox.baseWidth;
            this.blockObjects.splice(idx, 1, newObj);
            page?.replaceBlockObject(newObj, idx)
        }
        else if (!rerender) {
            this.blockObjects.push(newObj)
            page?.blockObjects.push(newObj)
        }
    }

    /**
     * sets the BlockObjects baseBoxDims at the time of creation.
     * @param obj => BlockObject where baseBoxDims are set
     * @param boxDims => new BoxDims
     */
    private setObjCoords(obj: BlockObject, boxDims: BoxDimensions) {
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
    private calculateInitialBoxDims(mouseX: number, mouseY: number, scale: number, entityParentRect: DOMRect,
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
     * Executes the full move sequence. This function should be called to move a `BlockObject`. 
     * - Calls `getParentContainer()` to get the current parentContainer of the obj e.g. Text_Layer for TextBoxes.
     * - Calls `checkXBounds()` and `checkYBounds()`  to check whether to object has moved out of PDF bounds.
     * - Calls `moveObject()` then moves the object by setting the new coords.
     * 
     * If the object has moved from one page to another the following sequence is executed.
     * - Calls `deleteOldObj()` to first all the removal logic of each `BlockObject`.
     * - Calls `assignAndCreateNewObj()` creates and assigns a new object to the new page.
     * @param obj => the object to move.
     * @param pos => the new position to move to.
     * @param pageNum => the page number to place the object in.
     * @returns => {error: string, success: Boolean}
     */
    public executeMove(obj: BlockObject, pos: { top: number, left: number, clickedPageNum: number }, pageNum: number) {
        console.log("Calling execute move!")
        const page = this.pdfViewerService.getPageWithNumber(pos.clickedPageNum)
        const parentContainer = this.getParentContainer(obj, page!)
        if (parentContainer == null)
            return { error: Constants.ERROR_NO_PARENT_CONTAINER, success: true }

        const entityParentRect = (parentContainer as HTMLElement).getBoundingClientRect();
        const pageContainerRect = (page!.htmlContainer! as HTMLElement).getBoundingClientRect();
        this.moveObject(obj, pos, entityParentRect, pageContainerRect)

        // handle obj move from one page to another.
        // We have to delete the object on one page and recreate on the other page.
        if (pos.clickedPageNum != pageNum) {
            this.deleteOldObj(obj, pageNum)
            this.assignAndCreateNewObj(obj, parentContainer, pos.clickedPageNum, page!)
        }

        return { error: "", success: true }
    }

    /**
     * Calculate new dimensions for BlockObject based on the new scale.
     * This function is mainly called when the PDF page is rerendered.
     * @param obj => the object to recalculate the dimensions for.
     * @param scale => the scale to use for calculation.
     * @returns 
     */
    public rescaleObjOnRender(obj: BlockObject, scale: number) {
        let newBaseWidth = obj.baseWidth;
        let newBaseHeight = obj.baseHeight;

        const condition = (obj.BoxDims.resizedHeight != 0 || obj.BoxDims.resizedWidth != 0)
        if (condition) {
            newBaseWidth = obj.BoxDims.resizedWidth;
            newBaseHeight = obj.BoxDims.resizedHeight;
        }


        const finalWidth = newBaseWidth * (scale / obj.BoxDims.sizeCreationScale)
        const finalHeight = newBaseHeight * (scale / obj.BoxDims.sizeCreationScale)

        const box_dims = {
            top: obj.baseTop * (scale / obj.BoxDims.posCreationScale),
            left: obj.baseLeft * (scale / obj.BoxDims.posCreationScale),
            width: finalWidth,
            height: finalHeight,
            resizedHeight: 0,
            resizedWidth: 0,
            currentScale: scale,
            posCreationScale: obj.BoxDims.posCreationScale,
            sizeCreationScale: obj.BoxDims.sizeCreationScale
        }
        return { dims: box_dims, baseWidth: newBaseWidth, baseHeight: newBaseHeight }
    }

    /**
     * Gets a unique id to add to a specific list. **Note**: ID is only unique in @param list!!
     * @param list => list where the Id should be unique.
     * @returns 
     */
    public getUniqueId<T extends { id: number }>(list: T[]): number {
        {
            if (list.length === 0) {
                return 1;
            }
            return Math.max(...list.map(item => item.id)) + 1;
        }
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
        const uniqueId = this.getUniqueId(this.blockObjects)
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
    public createBlockObject(oldId: number, pageNumber: number, boxDims: BoxDimensions, rerender: Boolean = false) {
        const uniqueId = this.getUniqueId(this.blockObjects)
        const blockObj = new BlockObject(uniqueId, pageNumber, boxDims)
        //this.addOrReplaceBlockObject(blockObj, oldId, rerender)

        if (!rerender)
            this.setObjCoords(blockObj, boxDims)

        return blockObj
    }
}
