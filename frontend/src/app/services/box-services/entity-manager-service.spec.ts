import { TestBed } from '@angular/core/testing';
import { EntityManagerService } from './entity-manager-service';
import { BoxCreationService } from './box-creation-service';
import { ComponentRef } from '@angular/core';

describe('EntityManagerService', () => {
  let service: EntityManagerService;
  let creationService: BoxCreationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EntityManagerService);
    creationService = TestBed.inject(BoxCreationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe("addOrReplaceBlockObject", () => {
    it("Replace a blockObject", () => {
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
      const obj = creationService.createBlockObject(1, dims)

      const obj1 = creationService.createBlockObject(2, structuredClone(dims))
      service.blockObjects.push(obj1)
      obj1.baseHeight = 100;
      obj1.baseLeft = 100;
      obj1.baseTop = 100;
      obj1.baseWidth = 400;
      obj1.BoxDims.left = 1000
      obj1.BoxDims.top = 500


      const obj2 = creationService.createBlockObject(3, structuredClone(dims))
      service.blockObjects.push(obj2)
      const obj3 = creationService.createBlockObject(4, structuredClone(dims))
      service.blockObjects.push(obj3)

      expect(service.blockObjects.at(0)!.BoxDims.left === 1000).toBeTruthy()
      expect(service.blockObjects.at(0)!.BoxDims.top === 500).toBeTruthy()
      expect(service.blockObjects.at(0)!.baseLeft === 100).toBeTruthy()
      service.addOrReplaceBlockObject(obj, obj1.id, false)

      expect(service.blockObjects.length === 3).toBeTruthy()
      expect(service.blockObjects.at(0)!.BoxDims.left === 0).toBeTruthy()
      expect(service.blockObjects.at(0)!.BoxDims.top === 0).toBeTruthy()
    })
  })


  describe('EntityManagerService', () => {
    let service: EntityManagerService;
    let creationService: BoxCreationService;
    let mockPdfViewerService: any;
    let mockEventBusService: any;

    beforeEach(() => {
      mockPdfViewerService = {
        currentScale: 1,
        getPageWithNumber: jasmine.createSpy('getPageWithNumber').and.callFake((pageId: number) => ({
          htmlContainer: {
            querySelector: (selector: string) => {
              const el = document.createElement('div');
              el.getBoundingClientRect = () => ({
                top: 0, left: 0, width: 100, height: 100, right: 100, bottom: 100
              } as DOMRect);
              return el;
            },
            getBoundingClientRect: () => ({
              top: 0, left: 0, width: 100, height: 100, right: 100, bottom: 100
            } as DOMRect)
          },
          blockObjects: [],
          replaceBlockObject: jasmine.createSpy('replaceBlockObject'),
          removeBlockObject: jasmine.createSpy('removeBlockObject')
        })),
        dynamicContainer: {
          indexOf: jasmine.createSpy('indexOf').and.returnValue(0),
          remove: jasmine.createSpy('remove')
        }
      };
      mockEventBusService = {
        emit: jasmine.createSpy('emit')
      };

      TestBed.configureTestingModule({
        providers: [
          { provide: 'PDFViewerService', useValue: mockPdfViewerService },
          { provide: 'EventBusService', useValue: mockEventBusService },
          EntityManagerService,
          BoxCreationService
        ]
      });
      service = TestBed.inject(EntityManagerService);
      creationService = TestBed.inject(BoxCreationService);
      // Patch the injected services
      (service as any).pdfViewerService = mockPdfViewerService;
      (service as any).eventBusService = mockEventBusService;
    });

    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    describe('addOrReplaceBlockObject', () => {
      it('Replace a blockObject', () => {
        const dims = {
          top: 0, left: 0, width: 0, height: 0,
          resizedHeight: 0, resizedWidth: 0,
          currentScale: 0, posCreationScale: 0, sizeCreationScale: 0,
        };
        const obj = creationService.createBlockObject(1, dims);
        const obj1 = creationService.createBlockObject(2, structuredClone(dims));
        service.blockObjects.push(obj1);
        obj1.baseHeight = 100;
        obj1.baseLeft = 100;
        obj1.baseTop = 100;
        obj1.baseWidth = 400;
        obj1.BoxDims.left = 1000;
        obj1.BoxDims.top = 500;
        const obj2 = creationService.createBlockObject(3, structuredClone(dims));
        service.blockObjects.push(obj2);
        const obj3 = creationService.createBlockObject(4, structuredClone(dims));
        service.blockObjects.push(obj3);

        expect(service.blockObjects.at(0)!.BoxDims.left === 1000).toBeTruthy();
        expect(service.blockObjects.at(0)!.BoxDims.top === 500).toBeTruthy();
        expect(service.blockObjects.at(0)!.baseLeft === 100).toBeTruthy();
        service.addOrReplaceBlockObject(obj, obj1.id, false);

        expect(service.blockObjects.length === 3).toBeTruthy();
        expect(service.blockObjects.at(0)!.BoxDims.left === 0).toBeTruthy();
        expect(service.blockObjects.at(0)!.BoxDims.top === 0).toBeTruthy();
      });

      it('Add a blockObject', () => {
        const dims = {
          top: 0, left: 0, width: 0, height: 0,
          resizedHeight: 0, resizedWidth: 0,
          currentScale: 0, posCreationScale: 0, sizeCreationScale: 0,
        };
        const obj = creationService.createBlockObject(1, dims);
        service.addOrReplaceBlockObject(obj, obj.id, false);
        expect(service.blockObjects.length === 1).toBeTruthy();
      });
    });

    // describe('getParentContainer', () => {
    //   it('returns correct container for TextBox', () => {
    //     const page = {
    //       htmlContainer: document.createElement('div')
    //     } as any;
    //     spyOn(page.htmlContainer, 'querySelector').and.returnValue(Constants.OVERLAY_TEXT);
    //     const dims = {
    //       top: 0,
    //       left: 0,
    //       width: 0,
    //       height: 0,
    //       resizedHeight: 0,
    //       resizedWidth: 0,
    //       currentScale: 0,
    //       posCreationScale: 0,
    //       sizeCreationScale: 0,
    //     }


    //     const textBox = new TextBox(1, 1, dims, "Test", new TextStyle());
    //     expect(service.getParentContainer(textBox, page)).toBe(Constants.OVERLAY_TEXT);
    //   });

    //   it('returns correct container for ImgBox', () => {
    //     const page = {
    //       htmlContainer: document.createElement('div')
    //     } as any;
    //     spyOn(page.htmlContainer, 'querySelector').and.returnValue('img-container');
    //     const imgBox = new ImgBox();
    //     expect(service.getParentContainer(imgBox, page)).toBe('img-container');
    //   });

    //   it('returns null for unknown type', () => {
    //     const page = {
    //       htmlContainer: document.createElement('div')
    //     } as any;
    //     const block = new BlockObject();
    //     expect(service.getParentContainer(block, page)).toBeNull();
    //   });
    // });

    describe('checkXBounds', () => {
      it('clamps left to 0 if negative', () => {
        const box = creationService.createBlockObject(1, { top: 0, left: -10, width: 10, height: 10, resizedHeight: 0, resizedWidth: 0, currentScale: 1, posCreationScale: 1, sizeCreationScale: 1 });
        box.BoxDims.left = -10;
        const container = { width: 100 } as DOMRect;
        const result = (service as any).checkXBounds(box, container);
        expect(result).toBe(0);
      });

      it('clamps right to container width', () => {
        const box = creationService.createBlockObject(1, { top: 0, left: 95, width: 10, height: 10, resizedHeight: 0, resizedWidth: 0, currentScale: 1, posCreationScale: 1, sizeCreationScale: 1 });
        box.BoxDims.left = 95;
        const container = { width: 100 } as DOMRect;
        const result = (service as any).checkXBounds(box, container);
        expect(result).toBe(90);
      });

      it('returns left if within bounds', () => {
        const box = creationService.createBlockObject(1, { top: 0, left: 10, width: 10, height: 10, resizedHeight: 0, resizedWidth: 0, currentScale: 1, posCreationScale: 1, sizeCreationScale: 1 });
        box.BoxDims.left = 10;
        const container = { width: 100 } as DOMRect;
        const result = (service as any).checkXBounds(box, container);
        expect(result).toBe(10);
      });
    });

    describe('checkYBounds', () => {
      it('clamps top to 0 if negative', () => {
        const box = creationService.createBlockObject(1, { top: -10, left: 0, width: 10, height: 10, resizedHeight: 0, resizedWidth: 0, currentScale: 1, posCreationScale: 1, sizeCreationScale: 1 });
        box.BoxDims.top = -10;
        const container = { height: 100 } as DOMRect;
        const result = (service as any).checkYBounds(box, container);
        expect(result).toBe(0);
      });

      it('clamps bottom to container height', () => {
        const box = creationService.createBlockObject(1, { top: 95, left: 0, width: 10, height: 10, resizedHeight: 0, resizedWidth: 0, currentScale: 1, posCreationScale: 1, sizeCreationScale: 1 });
        box.BoxDims.top = 95;
        const container = { height: 100 } as DOMRect;
        const result = (service as any).checkYBounds(box, container);
        expect(result).toBe(90);
      });

      it('returns top if within bounds', () => {
        const box = creationService.createBlockObject(1, { top: 10, left: 0, width: 10, height: 10, resizedHeight: 0, resizedWidth: 0, currentScale: 1, posCreationScale: 1, sizeCreationScale: 1 });
        box.BoxDims.top = 10;
        const container = { height: 100 } as DOMRect;
        const result = (service as any).checkYBounds(box, container);
        expect(result).toBe(10);
      });
    });

    describe('getUniqueId', () => {
      it('returns 1 for empty list', () => {
        expect(service.getUniqueId([])).toBe(1);
      });

      it('returns max id + 1 for non-empty list', () => {
        const list = [{ id: 1 }, { id: 2 }, { id: 5 }];
        expect(service.getUniqueId(list)).toBe(6);
      });
    });

    describe('rescaleObjOnRender', () => {
      it('rescales with baseWidth/baseHeight if no resized', () => {
        const obj = creationService.createBlockObject(1, {
          top: 10, left: 20, width: 30, height: 40, resizedHeight: 0, resizedWidth: 0,
          currentScale: 1, posCreationScale: 1, sizeCreationScale: 1
        });
        obj.baseWidth = 30;
        obj.baseHeight = 40;
        obj.baseLeft = 20;
        obj.baseTop = 10;
        obj.BoxDims.sizeCreationScale = 1;
        obj.BoxDims.posCreationScale = 1;
        const result = service.rescaleObjOnRender(obj, 2);
        expect(result.dims.width).toBe(60);
        expect(result.dims.height).toBe(80);
        expect(result.dims.left).toBe(40);
        expect(result.dims.top).toBe(20);
      });

      it('rescales with resizedWidth/resizedHeight if present', () => {
        const obj = creationService.createBlockObject(1, {
          top: 10, left: 20, width: 30, height: 40, resizedHeight: 50, resizedWidth: 60,
          currentScale: 1, posCreationScale: 1, sizeCreationScale: 1
        });
        obj.baseWidth = 30;
        obj.baseHeight = 40;
        obj.baseLeft = 20;
        obj.baseTop = 10;
        obj.BoxDims.sizeCreationScale = 1;
        obj.BoxDims.posCreationScale = 1;
        obj.BoxDims.resizedWidth = 60;
        obj.BoxDims.resizedHeight = 50;
        const result = service.rescaleObjOnRender(obj, 2);
        expect(result.dims.width).toBe(120);
        expect(result.dims.height).toBe(100);
        expect(result.baseWidth).toBe(60);
        expect(result.baseHeight).toBe(50);
      });
    });

    // describe('onTextBoxEditClick', () => {
    //   it('sets isCollapsed and currentFocusBoxId', () => {
    //     const box = new TextBox();
    //     box.id = 123;
    //     box.StyleState = { isCollapsed: false } as any;
    //     service.onTextBoxEditClick(box, true);
    //     expect(box.StyleState.isCollapsed).toBe(false);
    //     expect(service.currentFocusBoxId).toBe(123);
    //     service.onTextBoxEditClick(box, false);
    //     expect(box.StyleState.isCollapsed).toBe(true);
    //   });
    // });

    describe('setComprefSafely and getCompref', () => {
      it('sets and gets component ref', () => {
        const fakeRef = { destroy: jasmine.createSpy('destroy') } as any as ComponentRef<any>;
        service.setComprefSafely(1, fakeRef);
        expect(service.getCompref(1)).toBe(fakeRef);
      });

      it('destroys old ref if exists', () => {
        const fakeRef1 = { destroy: jasmine.createSpy('destroy') } as any as ComponentRef<any>;
        const fakeRef2 = { destroy: jasmine.createSpy('destroy') } as any as ComponentRef<any>;
        service.setComprefSafely(1, fakeRef1);
        service.setComprefSafely(1, fakeRef2);
        expect(fakeRef1.destroy).toHaveBeenCalled();
        expect(service.getCompref(1)).toBe(fakeRef2);
      });
    });

    describe('executeMove', () => {
      it('returns error if parent container is null', () => {
        spyOn(service, 'getParentContainer').and.returnValue(null);
        const obj = creationService.createBlockObject(1, {
          top: 0, left: 0, width: 10, height: 10, resizedHeight: 0, resizedWidth: 0,
          currentScale: 1, posCreationScale: 1, sizeCreationScale: 1
        });
        const result = service.executeMove(obj, { top: 0, left: 0, clickedPageNum: 1 }, 1);
        expect(result.error).toBeDefined();
        expect(result.success).toBeTrue();
      });

      it('calls moveObject and emits events if page changes', () => {
        spyOn(service as any, 'getParentContainer').and.callThrough();
        spyOn(service as any, 'moveObject');
        spyOn(service as any, 'deleteOldObj');
        const obj = creationService.createBlockObject(1, {
          top: 0, left: 0, width: 10, height: 10, resizedHeight: 0, resizedWidth: 0,
          currentScale: 1, posCreationScale: 1, sizeCreationScale: 1
        });
        obj.pageId = 1;
        const result = service.executeMove(obj, { top: 0, left: 0, clickedPageNum: 2 }, 1);
        expect((service as any).moveObject).toHaveBeenCalled();
        expect((service as any).deleteOldObj).toHaveBeenCalled();
        expect(mockEventBusService.emit).toHaveBeenCalled();
        expect(result.success).toBeTrue();
      });

      it('calls moveObject and does not emit if page does not change', () => {
        spyOn(service as any, 'getParentContainer').and.callThrough();
        spyOn(service as any, 'moveObject');
        spyOn(service as any, 'deleteOldObj');
        const obj = creationService.createBlockObject(1, {
          top: 0, left: 0, width: 10, height: 10, resizedHeight: 0, resizedWidth: 0,
          currentScale: 1, posCreationScale: 1, sizeCreationScale: 1
        });
        obj.pageId = 1;
        const result = service.executeMove(obj, { top: 0, left: 0, clickedPageNum: 1 }, 1);
        expect((service as any).moveObject).toHaveBeenCalled();
        expect((service as any).deleteOldObj).not.toHaveBeenCalled();
        expect(result.success).toBeTrue();
      });
    });
  });
})
