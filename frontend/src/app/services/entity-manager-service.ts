import { Injectable, Type } from '@angular/core';
import { BlockObject, BoxDimensions } from '../models/BlockObject';
import { PDFViewerService } from './pdfviewer-service';
import { TextBox } from '../models/TextBox';
import { Constants } from '../models/constants/constants';
import { Page } from '../models/Page';
import { TextEditService } from './text-edit-service';

@Injectable({
    providedIn: 'root'
})
export class EntityManagerService {

    constructor(private pdfViewerService: PDFViewerService, private textEditService: TextEditService) { }

    /**
     * Finds and returns the parent container of the current object.
     * Useful for checking boundaries or removing the object from its context.
     */
    private getParentContainer(obj: BlockObject, page: Page): HTMLElement | null {
        if (obj instanceof TextBox)
            return page?.htmlContainer?.querySelector(Constants.OVERLAY_TEXT)
        return null
    }

    /**
     * Checks whether the object’s X position is within allowed bounds.
     * Prevents moving outside of horizontal limits.
     */
    private checkXBounds(box: BlockObject, container: DOMRect) {
        if (box.BoxDims.left < 0) box.BoxDims.left = 0;
        if ((box.BoxDims.left + box.BoxDims.width) > container.width) box.BoxDims.left = (container.width - box.BoxDims.width);

        return box.BoxDims.left
    }

    /**
     * Checks whether the object’s Y position is within allowed bounds.
     * Prevents moving outside of vertical limits.
     */
    private checkYBounds(box: BlockObject, container: DOMRect) {
        if (box.BoxDims.top < 0) box.BoxDims.top = 0;
        if ((box.BoxDims.top + box.BoxDims.height) > container.height) box.BoxDims.top = (container.height - box.BoxDims.height);

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
            const ret = this.textEditService.createTextBox(textbox.BoxDims, textbox.TextStyleState,
                adjustedPageNum, textbox.BoxDims.currentScale,
                this.pdfViewerService.currentScrollTop)
            
            page?.appendTextBox(textbox)
            parentContainer.appendChild(ret.comp.location.nativeElement)
            ret.comp.instance.positionChanged.subscribe((event: any) => this.executeMove(ret.box, event, page.pageNum))
        }
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
    public executeMove(obj: BlockObject, pos: { top: number, left: number }, pageNum: number) {
        let adjustedPageNum = pageNum
        console.log("Calling execute move!")

        // TODO find the correct current page from the pos.top 
        // this is not accurate enough.
        adjustedPageNum = this.pdfViewerService.getPageNumberFromScrolltop(pos.top + this.pdfViewerService.currentScrollTop -
            (this.pdfViewerService.standardMarginTop))

        const page = this.pdfViewerService.getPageWithNumber(adjustedPageNum)
        const parentContainer = this.getParentContainer(obj, page!)
        if (parentContainer == null)
            return { error: Constants.ERROR_NO_PARENT_CONTAINER, success: true }

        const entityParentRect = (parentContainer as HTMLElement).getBoundingClientRect();
        const pageContainerRect = (page!.htmlContainer! as HTMLElement).getBoundingClientRect();
        this.moveObject(obj, pos, entityParentRect, pageContainerRect)

        // handle obj move from one page to another.
        // We have to delete the object on one page and recreate on the other page.
        if (adjustedPageNum != pageNum) {
            this.deleteOldObj(obj, pageNum)
            this.assignAndCreateNewObj(obj, parentContainer, adjustedPageNum, page!)
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













}
