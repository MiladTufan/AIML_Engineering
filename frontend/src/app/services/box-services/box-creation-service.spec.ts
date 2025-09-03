import { TestBed } from '@angular/core/testing';

import { BoxCreationService } from './box-creation-service';
import { ImgBoxService } from './img-box-service';
import { EntityManagerService } from './entity-manager-service';
import { ComponentRef, EventEmitter, Type, ViewContainerRef } from '@angular/core';
import { DynamicContainerRegistry } from '../shared/dynamic-container-registry';
import { CommonBoxObject } from '../../components/box-components/common-box-object/common-box-object';
import { CustomImgBox } from '../../components/box-components/custom-img-box/custom-img-box';



const customImgBoxInstanceMock = { imgBox: 'imgBox', boxBase: "boxBase" }; // add properties/methods your service uses
const customImgBoxRefMock: Partial<ComponentRef<any>> = {
  instance: customImgBoxInstanceMock
} as ComponentRef<any>;

const commonBoxChildContainerMock: Partial<ViewContainerRef> = {
  createComponent: jasmine.createSpy('createComponentChild').and.callFake((component: Type<any>) => {
    return customImgBoxRefMock; // returns ComponentRef for CustomImgBox
  })
} as unknown as ViewContainerRef;

const commonBoxInstanceMock = {
  childContainer: commonBoxChildContainerMock,
  positionChanged: new EventEmitter<any>()
};

const commonBoxRefMock: Partial<ComponentRef<any>> = {
  instance: commonBoxInstanceMock
} as ComponentRef<any>;

const dynamicBoxContainerMock: Partial<ViewContainerRef> = {
  createComponent: jasmine.createSpy('createComponentTop').and.callFake((component: Type<any>) => {
    return commonBoxRefMock; // returns ComponentRef for CommonBoxObject
  })
} as unknown as ViewContainerRef;

const dynamicContainerRegistryMock = {
  dynamicBoxContainer: dynamicBoxContainerMock
};

describe('BoxCreationService', () => {
  let creationService: BoxCreationService;
  let imgBoxService: ImgBoxService;
  let entityManagerService: EntityManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: DynamicContainerRegistry, useValue: dynamicContainerRegistryMock }]
    });

    creationService = TestBed.inject(BoxCreationService);
    imgBoxService = TestBed.inject(ImgBoxService);
    entityManagerService = TestBed.inject(EntityManagerService);
  });

  it('[SIMPLE] should be created', () => {
    expect(creationService).toBeTruthy();
  });


  it('[SIMPLE] should create ImgBox and add it onto canvas', () => {
    const dims = {
      top: 10, left: 20, width: 30, height: 40, resizedHeight: 50, resizedWidth: 60,
      currentScale: 1, posCreationScale: 1, sizeCreationScale: 1
    }
    const obj = creationService.createBlockObject(1, dims);
    const src = "Test Img Src"

    const ret = creationService.createImgBox(obj, obj.id, 1, src);

    // check if Components have been created
    expect(dynamicContainerRegistryMock.dynamicBoxContainer.createComponent).toHaveBeenCalled();
    expect(commonBoxRefMock.instance.childContainer.createComponent).toHaveBeenCalled();

    expect(dynamicContainerRegistryMock.dynamicBoxContainer.createComponent).toHaveBeenCalledWith(CommonBoxObject);
    expect(commonBoxRefMock.instance.childContainer.createComponent).toHaveBeenCalledWith(CustomImgBox);

    // check BoxDims
    expect(ret.box.BoxDims.left === dims.left).toBeTrue()
    expect(ret.box.BoxDims.top === dims.top).toBeTrue()
    expect(ret.box.BoxDims.width === dims.width).toBeTrue()
    expect(ret.box.BoxDims.height === dims.height).toBeTrue()
    expect(ret.box.BoxDims.resizedWidth === dims.resizedWidth).toBeTrue()
    expect(ret.box.BoxDims.resizedHeight === dims.resizedHeight).toBeTrue()
    expect(ret.box.BoxDims.currentScale === dims.currentScale).toBeTrue()
    expect(ret.box.BoxDims.posCreationScale === dims.posCreationScale).toBeTrue()
    expect(ret.box.BoxDims.sizeCreationScale === dims.sizeCreationScale).toBeTrue()
    expect(ret.box.src === src).toBeTrue()
    expect(ret.box.pageId === 1).toBeTrue()
    expect(ret.box.id === 1).toBeTrue()

    // check parent Boxdims
    expect(ret.parent.instance.boxBase.BoxDims.left === dims.left).toBeTrue()
    expect(ret.parent.instance.boxBase.BoxDims.top === dims.top).toBeTrue()
    expect(ret.parent.instance.boxBase.BoxDims.width === dims.width).toBeTrue()
    expect(ret.parent.instance.boxBase.BoxDims.height === dims.height).toBeTrue()
    expect(ret.parent.instance.boxBase.BoxDims.resizedWidth === dims.resizedWidth).toBeTrue()
    expect(ret.parent.instance.boxBase.BoxDims.resizedHeight === dims.resizedHeight).toBeTrue()
    expect(ret.parent.instance.boxBase.BoxDims.currentScale === dims.currentScale).toBeTrue()
    expect(ret.parent.instance.boxBase.BoxDims.posCreationScale === dims.posCreationScale).toBeTrue()
    expect(ret.parent.instance.boxBase.BoxDims.sizeCreationScale === dims.sizeCreationScale).toBeTrue()
    expect(ret.parent.instance.boxBase.pageId === 1).toBeTrue()
    expect(ret.parent.instance.boxBase.id === 1).toBeTrue()

    // check entityManager Lists
    expect(entityManagerService.blockObjects.length === 1).toBeTrue()
    expect(entityManagerService.getCompref(ret.box.id) === ret.parent).toBeTrue()
  })



  // /**
  //  * creates a TextBox and places it onto the canvas.
  //  * @param blockObj => the blockObject to create the TextBox out of.
  //  * @param pageNumber => the page where the TextBox should be created in.
  //  * @returns  child: textBoxContainer, parent: commonBoxContainer, box: textBox
  //  */
  // public createImgBox(blockObj: BlockObject, oldBoxId: number, pageNumber: number, src: string) {
  //   const imgBox = this.imgBoxService.toImgBox(blockObj)
  //   imgBox.src = src

  //   this.entityManagerService.addOrReplaceBlockObject(imgBox, oldBoxId, false)

  //   const ret = this.imgBoxService.placeImgBoxOntoCanvas(pageNumber, imgBox)
  //   ret.parent.instance.positionChanged.subscribe((event: any) => this.entityManagerService.executeMove(imgBox, event, pageNumber))

  //   this.entityManagerService.setComprefSafely(ret.box.id, ret.parent)
  //   return ret
  // }
});
