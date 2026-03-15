import { TestBed } from '@angular/core/testing';
import { EntityManagerService } from './entity-manager-service';
import { BoxCreationService } from './box-creation-service';
import { ComponentRef } from '@angular/core';
import { TestUtils } from '../../models/TestUtils';
import { TextEditService } from './text-edit-service';
import { BlockObject } from '../../models/box-models/BlockObject';
import { Page } from '../../models/Page';
import { PDFViewerService } from '../pdf-services/pdfviewer-service';
import { DynamicContainerRegistry } from '../shared/dynamic-container-registry';
import { Constants } from '../../models/constants/constants';
import { EventBusService } from '../communication/event-bus-service';

const PageMock: Partial<Page> = {
  htmlContainer: document.createElement("div"),
  blockObjects: [],
  pageNum: 1
}


describe('EntityManagerService', () => {
  let service: EntityManagerService;
  let creationService: BoxCreationService;
  let textEditService: TextEditService;
  let pdfViewerService: PDFViewerService;
  let eventBusService: EventBusService;

  let dynamicContainerRegistryMock: any;
  let commonBoxRefMock: Partial<ComponentRef<any>>;


  beforeEach(() => {
    const ret = TestUtils.dynamicContainerRegistryMock()
    dynamicContainerRegistryMock = ret.dynamicContainerRegistryMock
    commonBoxRefMock = ret.commonBoxRefMock

    TestBed.configureTestingModule({
      providers: [{ provide: DynamicContainerRegistry, useValue: dynamicContainerRegistryMock }]
    });
    service = TestBed.inject(EntityManagerService);
    creationService = TestBed.inject(BoxCreationService);
    textEditService = TestBed.inject(TextEditService);
    pdfViewerService = TestBed.inject(PDFViewerService);
    eventBusService = TestBed.inject(EventBusService);
  });

  fit("[SIMPLE] Should be created", () => {
    expect(service).toBeTruthy()
    expect(creationService).toBeTruthy()
  })

  it("[SIMPLE] Should say texbox edit clicked and set focusbox", () => {
    const dims = TestUtils.testBoxDims()
    const obj = creationService.createBlockObject(1, dims)
    const textBox = textEditService.toTextBox(obj)

    service.onTextBoxEditClick(textBox, true)
    expect(textBox.StyleState.isCollapsed === false).toBeTrue()
    expect(service.currentFocusBoxId === 1).toBeTrue()

    service.currentFocusBoxId = 0

    service.onTextBoxEditClick(textBox, false)
    expect(textBox.StyleState.isCollapsed === true).toBeTrue()
    expect(service.currentFocusBoxId === 0).toBeTrue()
  })
  it("[SIMPLE] Should get unique ID", () => {
    const dims = TestUtils.testBoxDims()

    service.blockObjects.push(creationService.createBlockObject(1, dims))
    service.blockObjects.push(creationService.createBlockObject(1, dims))
    service.blockObjects.push(creationService.createBlockObject(1, dims))
    service.blockObjects.push(creationService.createBlockObject(1, dims))

    expect(service.blockObjects.length === 4).toBeTrue()
    const unique_id = service.getUniqueId(service.blockObjects)

    service.blockObjects.forEach((obj: BlockObject) => {
      expect(obj.id !== unique_id).toBeTrue()
    })
  })

  it("[SIMPLE] should rescale Obj on render", () => {
    const scale = 2.5
    const dims = {
            top: 10, left: 20, width: 30, height: 40,
            resizedHeight: 0, resizedWidth: 0, currentScale: 1,
            posCreationScale: 1, sizeCreationScale: 1}

    const obj = creationService.createBlockObject(1, dims)
    service.blockObjects.push(obj)

    const ret = service.rescaleObjOnRender(obj, scale)

    expect(ret.baseHeight === obj.baseHeight).toBeTrue()
    expect(ret.baseWidth === obj.baseWidth).toBeTrue()
    
    expect(25 === ret.dims.top).toBeTrue()
    expect(50 === ret.dims.left).toBeTrue()
    expect(75 === ret.dims.width).toBeTrue()
    expect(75 === ret.dims.width).toBeTrue()
    expect(100 === ret.dims.height).toBeTrue()
    expect(0 === ret.dims.resizedHeight).toBeTrue()
    expect(0 === ret.dims.resizedHeight).toBeTrue()
  })

  fit("[SIMPLE] should execute move on the same page", () => {
    const dims = TestUtils.testBoxDims()
    const obj = creationService.createBlockObject(1, dims)
    const textBox = textEditService.toTextBox(obj)
    service.blockObjects.push(textBox)

    let { canvas, textBoxLayer, textLayer, pageContainer, canvasContainer, imgBoxLayer } =
    pdfViewerService.createPageContainers(1, false, 1.0)

    // A4 w and h
    pageContainer.style.width = `${595}px`;
    pageContainer.style.height = `${842}px`;

    PageMock.htmlContainer = pageContainer
    document.body.appendChild(PageMock.htmlContainer )

    pdfViewerService.allRenderedPages.push(PageMock as any)

    const pos =  {
    top: 200,
    left: 200,
    clickedPageNum: 1
    }
    const ret = service.executeMove(textBox, pos, 1)
    expect(ret.error === "").toBeTrue()
    expect(ret.success === true).toBeTrue()

    const entityParentRect = (ret.parentContainer as HTMLElement).getBoundingClientRect();
    const pageContainerRect = ( PageMock.htmlContainer  as HTMLElement).getBoundingClientRect();

    const top = (pos.top - entityParentRect.top);
    const left = pos.left - entityParentRect.left;

    expect(ret.obj.BoxDims.top === top).toBeTrue()
    expect(ret.obj.BoxDims.left === left).toBeTrue()
    expect(ret.obj.baseLeft === left).toBeTrue()
    expect(ret.obj.baseTop === top).toBeTrue()
    expect(ret.obj.BoxDims.posCreationScale === pdfViewerService.currentScale).toBeTrue()

    expect(Constants.EVENT_ENTITY_MANAGER_EMIT in eventBusService.getEventSubjets()).toBeFalse()
    expect(Constants.EVENT_ASSIGN_AND_CREATE_NEW_OBJ in eventBusService.getEventSubjets()).toBeFalse()
  })
})




    // /**
    //  * Executes the full move sequence. This function should be called to move a `BlockObject`. 
    //  * - Calls `getParentContainer()` to get the current parentContainer of the obj e.g. Text_Layer for TextBoxes.
    //  * - Calls `checkXBounds()` and `checkYBounds()`  to check whether to object has moved out of PDF bounds.
    //  * - Calls `moveObject()` then moves the object by setting the new coords.
    //  * 
    //  * If the object has moved from one page to another the following sequence is executed.
    //  * - Calls `deleteOldObj()` to first all the removal logic of each `BlockObject`.
    //  * - Calls `assignAndCreateNewObj()` creates and assigns a new object to the new page.
    //  * @param obj => the object to move.
    //  * @param pos => the new position to move to.
    //  * @param pageNum => the page number to place the object in.
    //  * @returns => {error: string, success: Boolean}
    //  */
    // public executeMove(obj: BlockObject, pos: { top: number, left: number, clickedPageNum: number }, pageNum: number) {
    //     console.log("Calling execute move!")
    //     const page = this.pdfViewerService.getPageWithNumber(pos.clickedPageNum)
    //     const parentContainer = this.getParentContainer(obj, page!)
    //     if (parentContainer == null)
    //         return { error: Constants.ERROR_NO_PARENT_CONTAINER, success: true }

    //     const entityParentRect = (parentContainer as HTMLElement).getBoundingClientRect();
    //     const pageContainerRect = (page!.htmlContainer! as HTMLElement).getBoundingClientRect();
    //     this.moveObject(obj, pos, entityParentRect, pageContainerRect)

    //     // handle obj move from one page to another.
    //     // We have to delete the object on one page and recreate on the other page.
    //     if (pos.clickedPageNum != pageNum) {
    //         this.deleteOldObj(obj, pageNum)
    //         const creationPayLoad = {
    //             obj: obj,
    //             parentContainer: parentContainer,
    //             pageNumber: pos.clickedPageNum,
    //             page: page!
    //         }
    //         this.eventBusService.emit(Constants.EVENT_ENTITY_MANAGER_EMIT, creationPayLoad)
    //         this.eventBusService.emit(Constants.EVENT_ASSIGN_AND_CREATE_NEW_OBJ, creationPayLoad, obj.id.toString(),)
    //         //this.assignAndCreateNewObj(obj, parentContainer, pos.clickedPageNum, page!)
    //     }

    //     return { error: "", success: true }
    // }