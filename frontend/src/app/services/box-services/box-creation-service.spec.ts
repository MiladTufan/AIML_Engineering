import { TestBed } from '@angular/core/testing';

import { BoxCreationService } from './box-creation-service';
import { ImgBoxService } from './img-box-service';
import { EntityManagerService } from './entity-manager-service';
import { ComponentRef, createComponent, EventEmitter, Type, ViewContainerRef } from '@angular/core';
import { DynamicContainerRegistry } from '../shared/dynamic-container-registry';
import { CommonBoxObject } from '../../components/box-components/common-box-object/common-box-object';
import { CustomImgBox } from '../../components/box-components/custom-img-box/custom-img-box';
import { TestUtils } from '../../models/TestUtils';
import { Page } from '../../models/Page';
import { PDFViewerService } from '../pdf-services/pdfviewer-service';
import { BlockObject } from '../../models/box-models/BlockObject';
import { Constants } from '../../models/constants/constants';
import { CustomTextEditBox } from '../../components/box-components/custom-text-edit-box/custom-text-edit-box';
import { TextStyleBlock } from '../../components/shared/text-style-block/text-style-block';


const PageMock: Partial<Page> = {
  htmlContainer: document.createElement("div"),
  blockObjects: [],
  pageNum: 1
}


describe('BoxCreationService', () => {
  let creationService: BoxCreationService;
  let imgBoxService: ImgBoxService;
  let entityManagerService: EntityManagerService;
  let pdfViewerService: PDFViewerService;

  let dynamicContainerRegistryMock: any;
  let commonBoxRefMock: Partial<ComponentRef<any>>;

  beforeEach(() => {
  });


  describe('BlockObject', () => {

    beforeEach(() => {
      const ret = TestUtils.dynamicContainerRegistryMock()
      dynamicContainerRegistryMock = ret.dynamicContainerRegistryMock
      commonBoxRefMock = ret.commonBoxRefMock

      TestBed.configureTestingModule({
        providers: [{ provide: DynamicContainerRegistry, useValue: dynamicContainerRegistryMock }]
      });

      creationService = TestBed.inject(BoxCreationService);
      imgBoxService = TestBed.inject(ImgBoxService);
      entityManagerService = TestBed.inject(EntityManagerService);
      pdfViewerService = TestBed.inject(PDFViewerService);
    })

    it('[SIMPLE] should be created', () => {
      expect(creationService).toBeTruthy();
      expect(imgBoxService).toBeTruthy();
      expect(entityManagerService).toBeTruthy();
      expect(pdfViewerService).toBeTruthy();
    });

    it("[SIMPLE] BlockObject should be created", () => {
      const dims = TestUtils.testBoxDims()
      const obj = creationService.createBlockObject(1, dims);
      TestUtils.compareBoxDims(obj.BoxDims, dims)
    })
  })

  describe('ImgBox', () => {
    beforeEach(() => {
      const ret = TestUtils.dynamicContainerRegistryMock()
      dynamicContainerRegistryMock = ret.dynamicContainerRegistryMock
      commonBoxRefMock = ret.commonBoxRefMock

      TestBed.configureTestingModule({
        providers: [{ provide: DynamicContainerRegistry, useValue: dynamicContainerRegistryMock }]
      });

      creationService = TestBed.inject(BoxCreationService);
      imgBoxService = TestBed.inject(ImgBoxService);
      entityManagerService = TestBed.inject(EntityManagerService);
      pdfViewerService = TestBed.inject(PDFViewerService);
    })

    it('[SIMPLE] should be created', () => {
      expect(creationService).toBeTruthy();
      expect(imgBoxService).toBeTruthy();
      expect(entityManagerService).toBeTruthy();
      expect(pdfViewerService).toBeTruthy();
    });

    it('[SIMPLE] should create ImgBox and add it onto canvas', () => {
      const dims = TestUtils.testBoxDims()
      const obj = creationService.createBlockObject(1, dims);
      const src = "Test Img Src"

      let { canvas, textBoxLayer, textLayer, pageContainer, canvasContainer, imgBoxLayer } =
        pdfViewerService.createPageContainers(1, false, 1.0)

      PageMock.htmlContainer = pageContainer
      pdfViewerService.allRenderedPages.push(PageMock as any)

      const ret = creationService.createImgBox(obj, obj.id, 1, src);

      // check if Components have been created
      expect(dynamicContainerRegistryMock.dynamicBoxContainer.createComponent).toHaveBeenCalled();
      expect(commonBoxRefMock.instance.childContainer.createComponent).toHaveBeenCalled();

      expect(dynamicContainerRegistryMock.dynamicBoxContainer.createComponent).toHaveBeenCalledWith(CommonBoxObject);
      expect(commonBoxRefMock.instance.childContainer.createComponent).toHaveBeenCalledWith(CustomImgBox);

      // Check if Box has been added to Image layer
      expect(imgBoxLayer).toBeTruthy()
      expect(imgBoxLayer.children.length === 1).toBeTruthy()

      // check BoxDims
      TestUtils.compareBoxDims(ret.box.BoxDims, dims)
      expect(ret.box.src === src).toBeTrue()
      expect(ret.box.pageId === 1).toBeTrue()
      expect(ret.box.id === 1).toBeTrue()

      // check parent Boxdims
      TestUtils.compareBoxDims(ret.parent.instance.boxBase.BoxDims, dims)
      expect(ret.parent.instance.boxBase.pageId === 1).toBeTrue()
      expect(ret.parent.instance.boxBase.id === 1).toBeTrue()

      // check entityManager Lists
      expect(entityManagerService.blockObjects.length === 1).toBeTrue()
      expect(entityManagerService.getCompref(ret.box.id) === ret.parent).toBeTrue()
    })
  })

  describe('TextBox', () => {
    beforeEach(() => {
      const ret = TestUtils.dynamicContainerRegistryMock(false)
      dynamicContainerRegistryMock = ret.dynamicContainerRegistryMock
      commonBoxRefMock = ret.commonBoxRefMock

      TestBed.configureTestingModule({
        providers: [{ provide: DynamicContainerRegistry, useValue: dynamicContainerRegistryMock }]
      });

      creationService = TestBed.inject(BoxCreationService);
      imgBoxService = TestBed.inject(ImgBoxService);
      entityManagerService = TestBed.inject(EntityManagerService);
      pdfViewerService = TestBed.inject(PDFViewerService);
    })

    it('[SIMPLE] should be created', () => {
      expect(creationService).toBeTruthy();
      expect(imgBoxService).toBeTruthy();
      expect(entityManagerService).toBeTruthy();
      expect(pdfViewerService).toBeTruthy();
    });


    it("[SIMPLE] should create TextBox and add it on canvas", () => {
      const dims = TestUtils.testBoxDims()
      const obj = creationService.createBlockObject(1, dims);
      const src = "Test Img Src"

      let { canvas, textBoxLayer, textLayer, pageContainer, canvasContainer, imgBoxLayer } =
        pdfViewerService.createPageContainers(1, false, 1.0)

      PageMock.htmlContainer = pageContainer
      pdfViewerService.allRenderedPages.push(PageMock as any)

      const ret = creationService.createTextBox(obj, obj.id, 1)

      // check if Components have been created
      expect(dynamicContainerRegistryMock.dynamicBoxContainer.createComponent).toHaveBeenCalled();
      expect(commonBoxRefMock.instance.childContainer.createComponent).toHaveBeenCalled();
      expect(commonBoxRefMock.instance.childContainerAddOn.createComponent).toHaveBeenCalled();

      expect(dynamicContainerRegistryMock.dynamicBoxContainer.createComponent).toHaveBeenCalledWith(CommonBoxObject);
      expect(commonBoxRefMock.instance.childContainer.createComponent).toHaveBeenCalledWith(CustomTextEditBox);
      expect(commonBoxRefMock.instance.childContainerAddOn.createComponent).toHaveBeenCalledWith(TextStyleBlock);

      // Check if Box has been added to Image layer
      expect(textBoxLayer).toBeTruthy()
      expect(textBoxLayer.children.length === 1).toBeTruthy()

      // check BoxDims
      TestUtils.compareBoxDims(ret.box.BoxDims, dims)
      expect(ret.box.pageId === 1).toBeTrue()
      expect(ret.box.id === 1).toBeTrue()

      // check parent Boxdims
      TestUtils.compareBoxDims(ret.parent.instance.boxBase.BoxDims, dims)
      expect(ret.parent.instance.boxBase.pageId === 1).toBeTrue()
      expect(ret.parent.instance.boxBase.id === 1).toBeTrue()

      // check entityManager Lists
      expect(entityManagerService.blockObjects.length === 1).toBeTrue()
      expect(entityManagerService.getCompref(ret.box.id) === ret.parent).toBeTrue()
    })
  })
});
