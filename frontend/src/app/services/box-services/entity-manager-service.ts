import { ComponentRef, inject, Injectable, Type } from '@angular/core';
import { BlockObject, BoxDimensions } from '../../models/box-models/BlockObject';
import { TextBox } from '../../models/box-models/TextBox';
import { Constants } from '../../models/constants/constants';
import { Page } from '../../models/Page';
import { TextEditService } from './text-edit-service';
import { ImgBox } from '../../models/box-models/ImgBox';
import { fromEvent, Subscription } from 'rxjs';
import { ImgBoxService } from './img-box-service';
import { CommonBoxObject } from '../../components/box-components/common-box-object/common-box-object';
import { CustomTextEditBox } from '../../components/box-components/custom-text-edit-box/custom-text-edit-box';
import { TextStyleBlock } from '../../components/shared/text-style-block/text-style-block';
import { PDFViewerService } from '../pdf-services/pdfviewer-service';
import { EventBusService } from '../communication/event-bus-service';
import { DynamicContainerRegistry } from '../shared/dynamic-container-registry';

/**
 * TODO Split this service into mulitple specific services for creating, moving, deleting boxes.
 */

@Injectable({
    providedIn: 'root'
})
export class EntityManagerService {

    private dynamicContainerRegistry: DynamicContainerRegistry = inject(DynamicContainerRegistry)
    private eventBusService: EventBusService = inject(EventBusService)
    public pdfViewerService: PDFViewerService = inject(PDFViewerService)

    constructor() {
        this.keydownSubscription = fromEvent<KeyboardEvent>(window, 'keydown')
            .subscribe(event => {
                this.removeFocusBox(event)
                this.currentFocusBoxId = -1;
            });
    }

    /**
     * private variables
     */
    private keydownSubscription?: Subscription;

    /**
     * Public variables
     */
    public blockObjects: BlockObject[] = [];
    public commonBoxCompMap = new Map<number, ComponentRef<CommonBoxObject>>();
    public currentFocusBoxId: number = -1

    /**
     * NG
     */
    ngOnDestroy() {
        this.keydownSubscription?.unsubscribe();
    }


    /**
     * Methods
     */


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
        //obj.BoxDims.top = this.checkYBounds(obj, pageContainerRect)

        obj.baseLeft = obj.BoxDims.left;
        obj.baseTop = obj.BoxDims.top;
        obj.BoxDims.posCreationScale = this.pdfViewerService.currentScale;
    }

    /**
     * Removes the object from its old container.
     * Calls the remove logic for each Object type, e.g. TextBox
     */
    private deleteOldObj(obj: BlockObject, pageNum: number,) {
        this.removeBoxFromPage(obj.id)
        const oldBox: any = this.blockObjects.find(b => b.id === obj.id)
        const idx = this.blockObjects.indexOf(oldBox);
        this.blockObjects.splice(idx, 1);

        const pageOld = this.pdfViewerService.getPageWithNumber(pageNum)
        pageOld?.removeBlockObject(obj)
    }


    //=======================================================================================================================
    // This function removes a BOX from the PDF page by deleting it from the DOM tree.
    //=======================================================================================================================
    private removeBoxFromPage(id: number) {
        const compref = this.commonBoxCompMap.get(id)
        const box = this.blockObjects.find(b => b.id === id)

        const pageOld = this.pdfViewerService.getPageWithNumber(box!.pageId)
        if (box)
            pageOld?.removeBlockObject(box)
        else
            console.error(Constants.ERROR_CANNOT_REMOVE_BOX)

        const index = this.dynamicContainerRegistry.dynamicBoxContainer!.indexOf(compref!.hostView);
        if (index !== -1) {
            this.dynamicContainerRegistry.dynamicBoxContainer!.remove(index); // this also destroys the component
        }
    }

    /**
     * This function removes the current focus box on ENTF => so the box that was most recently clicked.
     * @param event => the Keyboard event to listen for.
     */
    private removeFocusBox(event: KeyboardEvent) {
        if (event.key === "Delete") {
            const box = this.blockObjects[this.getIndexOfCurrentFocusBox()];
            if (box) {
                this.removeBoxFromPage(box.id)
                this.blockObjects.splice(this.blockObjects.indexOf(box!), 1)
                this.currentFocusBoxId = -1;
            }
        }
    }

    /**
     * Helper function to get the index of the current focus Box. The focus box is the box that has been
     * clicked inside the most recently.
     * @param id => optional id
     * @returns 
     */
    private getIndexOfCurrentFocusBox(id: number = -99) {
        const idSearch = id >= 0 ? id : this.currentFocusBoxId;
        const box = this.blockObjects.find(b => b.id == idSearch)
        let ret = -1;
        if (box !== undefined)
            ret = this.blockObjects.indexOf(box!)
        return ret;
    }


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
     * This function adds a BlockObject to this.blockObjects. If it already exists then it replaces it.
     * On Replace it also sets the baseBoxDims.
     * NOTE: This function can cause a infinite loop of creation if used wrongly!!! 
     * TODO make this safer
     * @param obj => obj to add
     * @param rerender => currently rerendering?
     */
    public addOrReplaceBlockObject(newObj: BlockObject, rerender: Boolean, oldBox: BlockObject | undefined = undefined) {
        const page = this.pdfViewerService.getPageWithNumber(newObj.pageId)

        if (oldBox && oldBox.id !== newObj.id ) {
            const idx = this.blockObjects.indexOf(oldBox);
            newObj.deepCopyBlockObj(oldBox)

            this.blockObjects.splice(idx, 1, newObj);
            page?.replaceBlockObject(newObj, idx)
        }
        else if (!rerender) {
            this.blockObjects.push(newObj)
            page?.blockObjects.push(newObj)
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
    public executeMove(obj: BlockObject, pos: { top: number, left: number, clickedPageNum: number }, pageNum: number) {
        let moveToAnotherPage = false
        const pageNew = this.pdfViewerService.getPageWithNumber(pos.clickedPageNum)
        if (pos.clickedPageNum != pageNum)
        {
            const pageOld = this.pdfViewerService.getPageWithNumber(obj.pageId)
            const compref = this.getCompref(obj.id)
            if (pageOld)
                pageOld?.removeBlockObject(obj)
            
            
            if (pageNew)
            {   
                pageNew.addBlockObject(obj)
                obj.pageId = pos.clickedPageNum
                const containerName = (obj instanceof TextBox) ? Constants.OVERLAY_TEXT : Constants.OVERLAY_IMG
                const container = pageNew?.htmlContainer?.querySelector(containerName)
			    container?.appendChild(compref?.location.nativeElement)
            }
        }


        const parentContainer = this.getParentContainer(obj, pageNew!)
        if (parentContainer == null)
            return {
                error: Constants.ERROR_NO_PARENT_CONTAINER, success: false,
                obj: obj, moveToAnotherPage: moveToAnotherPage, parentContainer: parentContainer
            }

        const entityParentRect = (parentContainer as HTMLElement).getBoundingClientRect();
        const pageContainerRect = (pageNew!.htmlContainer! as HTMLElement).getBoundingClientRect();
        this.moveObject(obj, pos, entityParentRect, pageContainerRect)

        const commonBoxRef = this.getCompref(obj.id);
        if (commonBoxRef && obj instanceof TextBox)
        {
            const width = (obj.BoxDims.resizedWidth === 0) ? obj.BoxDims.width : obj.BoxDims.resizedWidth
            commonBoxRef.instance.childRefAddOn!.instance.translateX = obj.BoxDims.left + width + 10;
            commonBoxRef.instance.childRefAddOn!.instance.translateY = obj.BoxDims.top + 10;
        }

        // handle obj move from one page to another.
        // We have to delete the object on one page and recreate on the other page.
        if (pos.clickedPageNum != pageNum) {
            moveToAnotherPage = true


            // this.deleteOldObj(obj, pageNum)
            // console.log("moving to page: ", pos.clickedPageNum)

            // const creationPayLoad = {
            //     obj: obj,
            //     parentContainer: parentContainer,
            //     pageNumber: pos.clickedPageNum,
            //     page: page!
            // }
            // const key = this.eventBusService.constructKey(Constants.EVENT_ASSIGN_AND_CREATE_NEW_OBJ, obj.id.toString())
            // if (this.eventBusService.getEventSubjets().has(key))
            //     this.eventBusService.removeKey(Constants.EVENT_ASSIGN_AND_CREATE_NEW_OBJ, obj.id.toString())

            // this.eventBusService.emit(Constants.EVENT_ENTITY_MANAGER_EMIT, creationPayLoad)
            // this.eventBusService.emit(Constants.EVENT_ASSIGN_AND_CREATE_NEW_OBJ, creationPayLoad, obj.id.toString(),)
        }

        return {
            error: "", success: true,
            obj: obj, moveToAnotherPage: moveToAnotherPage, parentContainer: parentContainer
        }
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
     * Click function that is called when someone clicks inside a textbox. This functions is called when the
     * textBoxClicked event is emitted from the CustomTextEditBox. 
     * TODO: This function needs to be moved to TextEdtiService logic.
     * @param box => the box that was clicked
     * @param editState => the editState => e.g. editing or not
     */
    public onTextBoxEditClick(box: TextBox, editState: Boolean) {
        if (box)
            box.StyleState.isCollapsed = !editState;

        if (editState)
            this.currentFocusBoxId = box.id;
    }

    /**
     * saves the ComponentRef of a CommonBoxObject for later use.
     * @param id => id of the box component (TextBox id or ImgBox id)
     * @param commonBoxComp => The componentRef to save
     */
    public setComprefSafely(id: number, commonBoxComp: ComponentRef<CommonBoxObject>) {
        if (this.commonBoxCompMap.has(id)) {
            const oldRef = this.commonBoxCompMap.get(id);
            oldRef?.destroy();
        }
        this.commonBoxCompMap.set(id, commonBoxComp)
    }

    /**
    * get the ComponentRef of a CommonBoxObject for later use.
    * @param id => id of the box component (TextBox id or ImgBox id)
    */
    public getCompref(id: number) {
        return this.commonBoxCompMap.get(id)
    }
}
