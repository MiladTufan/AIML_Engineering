import { ComponentRef, EventEmitter, ViewContainerRef } from "@angular/core";
import { BoxDimensions } from "./box-models/BlockObject";
import { CustomImgBox } from "../components/box-components/custom-img-box/custom-img-box";
import { CommonBoxObject } from "../components/box-components/common-box-object/common-box-object";

export class ElementRef<T = any> {
    nativeElement: T;
    constructor(nativeElement: T) { this.nativeElement = nativeElement; }
}

export class TestUtils {
    public static makeSpy<T>(name: string, returnValue: T) {
        return jasmine.createSpy(name).and.returnValue(returnValue);
    }

    public static customImgBoxMock() {
        return { imgBox: 'imgBox', boxBase: "boxBase" };
    }

    public static textStyleBlockMock() {
        return { translateX: 0, translateY: 0, box: "box", styleChanged: new EventEmitter<any> };
    }

    public static textBoxMock() {
        return { textBoxEditClicked: new EventEmitter<any>, updateTextStyle: jasmine.createSpy('updateTextStyle') };
    }

    private static createCompRef(instanceMock: any) {
        const compRefMock: Partial<ComponentRef<any>> = {
            instance: instanceMock,
            location: {
                nativeElement: document.createElement('div') // real DOM node
            } as ElementRef
        } as ComponentRef<any>;

        return compRefMock
    }

    private static createContainerMock(name: string, retVal: any) {
        const ContainerMock: Partial<ViewContainerRef> = {
            createComponent: TestUtils.makeSpy(name, retVal)
        } as unknown as ViewContainerRef;
        return ContainerMock
    }

    // TODO make this more generic
    public static dynamicContainerRegistryMock(imgBox: Boolean = true) {
        const customImgBoxInstanceMock = TestUtils.customImgBoxMock()
        const TextStyleBlockInstanceMock = TestUtils.textStyleBlockMock()
        const TextBoxInstanceMock = TestUtils.textBoxMock()

        const boxMock = (imgBox) ? customImgBoxInstanceMock : TextBoxInstanceMock

        const BoxRefMock = TestUtils.createCompRef(boxMock)
        const commonBoxChildContainerMock = TestUtils.createContainerMock("createComponentChild", BoxRefMock)

        const TextStyleBlockRefMock = TestUtils.createCompRef(TextStyleBlockInstanceMock)
        const TextStyleBlockContainerMock = TestUtils.createContainerMock("createComponentChildAddOn", TextStyleBlockRefMock)

        const commonBoxInstanceMock = {
            childContainer: commonBoxChildContainerMock,
            childContainerAddOn: TextStyleBlockContainerMock,
            positionChanged: new EventEmitter<any>()
        };

        const commonBoxRefMock = TestUtils.createCompRef(commonBoxInstanceMock)

        const dynamicBoxContainerMock = TestUtils.createContainerMock("createComponentTop", commonBoxRefMock)
        const dynamicContainerRegistryMock = {
            dynamicBoxContainer: dynamicBoxContainerMock
        };

        return { dynamicContainerRegistryMock: dynamicContainerRegistryMock, commonBoxRefMock: commonBoxRefMock }
    }

    public static testBoxDims() {
        return {
            top: 10, left: 20, width: 30, height: 40,
            resizedHeight: 0, resizedWidth: 0, currentScale: 1,
            posCreationScale: 1, sizeCreationScale: 1
        }
    }

    public static compareBoxDims(dim1: BoxDimensions, dim2: BoxDimensions) {
        expect(dim1.left === dim2.left).toBeTrue()
        expect(dim1.top === dim2.top).toBeTrue()
        expect(dim1.width === dim2.width).toBeTrue()
        expect(dim1.height === dim2.height).toBeTrue()
        expect(dim1.resizedWidth === dim2.resizedWidth).toBeTrue()
        expect(dim1.resizedHeight === dim2.resizedHeight).toBeTrue()
        expect(dim1.currentScale === dim2.currentScale).toBeTrue()
        expect(dim1.posCreationScale === dim2.posCreationScale).toBeTrue()
        expect(dim1.sizeCreationScale === dim2.sizeCreationScale).toBeTrue()
    }

    public static mockClass<T>(config: Partial<T>): T {
        const mock: any = {};
        Object.entries(config).forEach(([key, val]) => {
            if (val && typeof val === 'object') {
                // Check if it's a ComponentRef
                if (TestUtils.isComponentRef(val)) {
                    mock[key] = TestUtils.mockComponentRef(val);
                } else {
                    // Nested object → recurse
                    mock[key] = TestUtils.mockClass(val);
                }
            } else if (typeof val === 'function') {
                // auto spy for functions
                mock[key] = jasmine.createSpy(key);
            } else {
                mock[key] = val; // primitive or undefined
            }
        });

        return mock as T;
    }

    private static mockComponentRef<T>(val: Partial<ComponentRef<T>>): Partial<ComponentRef<T>> {
        return {
            location: new ElementRef(document.createElement('div')),
            instance: val.instance ? TestUtils.mockClass(val.instance) : {} as any,
            ...val // keep other properties if any
        };
    }

    private static isComponentRef(obj: any): obj is Partial<ComponentRef<any>> {
        // crude check: has 'instance' or 'location' properties
        return obj && (obj.instance !== undefined || obj.location !== undefined);
    }
}