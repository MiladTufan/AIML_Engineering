import { ComponentRef, inject, Injectable } from '@angular/core';
import { PageOverlay } from '../../components/pdf-components/page-overlay/page-overlay';
import { PDFViewerService } from './pdfviewer-service';

@Injectable({
  providedIn: 'root',
})
export class OrganizeService {
  public organizerActive: Boolean = false;
  public deletedPages: number[] = [];
  public checkedPages: number[] = [];
  public allrenderedPreviewPages: any[] = [];

  public pageOverlayCompMap = new Map<number, ComponentRef<PageOverlay>>();

  /**
   * Checks whether the provided Page is inside checkedPages.
   * @param pageNumber
   * @returns
   */
  public isPageChecked(pageNumber: number) {
    if (this.checkedPages.find((p) => p === pageNumber)) return true;
    return false;
  }

  /**
   * Check whether the provided Page is inside deleted Pages.
   * @param pageNumber
   * @returns
   */
  public isPageDeleted(pageNumber: number) {
    if (this.deletedPages.find((p) => p === pageNumber)) return true;
    return false;
  }

  /**
   * saves the ComponentRef of a PageOverlay for later use.
   * @param id => id of the box component (TextBox id or ImgBox id)
   * @param commonBoxComp => The componentRef to save
   */
  public setComprefSafely(
    id: number,
    pageOverlayComp: ComponentRef<PageOverlay>,
  ) {
    if (this.pageOverlayCompMap.has(id)) {
      const oldRef = this.pageOverlayCompMap.get(id);
      oldRef?.destroy();
    }
    this.pageOverlayCompMap.set(id, pageOverlayComp);
  }

  public swapComprefs(key1: number, key2: number) {
    const val1 = this.pageOverlayCompMap.get(key1)!;
    const val2 = this.pageOverlayCompMap.get(key2)!;

    // remove old keys
    this.pageOverlayCompMap.delete(key1);
    this.pageOverlayCompMap.delete(key2);

    // insert them swapped
    val1.instance.pageNumber = key2;
    val2.instance.pageNumber = key1;

    this.pageOverlayCompMap.set(key1, val2);
    this.pageOverlayCompMap.set(key2, val1);
  }

  /**
   * Shifts keys in the range of lowerbound and upperbound
   * @param lowerBound
   * @param upperBound
   * @param insertIndex => the key that was inserted and caused shifting
   * @param invert => key was inserted from right to left => true
   */
  shiftKeysByBound(
    lowerBound: number,
    upperBound: number,
    insertIndex: number,
    invert: Boolean = false,
  ) {
    const entries = Array.from(this.pageOverlayCompMap.entries());

    const keysToDelete: number[] = [];
    const valuesToEnter: any[] = [];

    for (let [key, value] of entries) {
      if (
        value.instance.pageNumber - 1 > lowerBound &&
        value.instance.pageNumber - 1 <= upperBound &&
        !invert
      ) {
        keysToDelete.push(value.instance.pageNumber);
        value.instance.pageNumber--;
        valuesToEnter.push({ key: value.instance.pageNumber, value: value });
      } else if (
        value.instance.pageNumber - 1 >= lowerBound &&
        value.instance.pageNumber - 1 < upperBound &&
        invert
      ) {
        keysToDelete.push(value.instance.pageNumber);
        value.instance.pageNumber++;
        valuesToEnter.push({ key: value.instance.pageNumber, value: value });
      } else if (
        value.instance.pageNumber - 1 === lowerBound ||
        value.instance.pageNumber - 1 === upperBound
      ) {
        keysToDelete.push(value.instance.pageNumber);
        value.instance.pageNumber = insertIndex + 1;
        valuesToEnter.push({ key: value.instance.pageNumber, value: value });
      }
    }

    keysToDelete.forEach((key) => {
      this.pageOverlayCompMap.delete(key);
    });
    valuesToEnter.forEach((item) => {
      this.pageOverlayCompMap.set(item.key, item.value);
    });
  }

  /**
   * get the ComponentRef of a PageOverlay for later use.
   * @param id => id of the box component (TextBox id or ImgBox id)
   */
  public getCompref(id: number) {
    return this.pageOverlayCompMap.get(id);
  }

  /**
   * Destroy Component Ref stored in pageOverlayCompMap
   * @param pageNumber
   */
  public destroy(pageNumber: number) {
    if (this.pageOverlayCompMap.has(pageNumber)) {
      const oldRef = this.pageOverlayCompMap.get(pageNumber);
      oldRef?.destroy();
      this.removeCompref(pageNumber);
    }
  }

  /**
   * Before inserting a new Page all comprefs have to be shifted by 1 to make place for the new compref
   * @param pageNumber
   */
  public shiftComprefs(pageNumber: number) {
    const entries = Array.from(this.pageOverlayCompMap.entries()).sort(
      (a, b) => b[0] - a[0],
    );
    for (let [key, value] of entries) {
      const valPageNumber = value.instance.pageNumber;
      if (valPageNumber >= pageNumber) {
        this.pageOverlayCompMap.set(valPageNumber + 1, value);
        const compref = this.getCompref(valPageNumber);
        if (compref) compref.instance.pageNumber = valPageNumber + 1;
        this.pageOverlayCompMap.delete(valPageNumber);
      }
    }
    return this.pageOverlayCompMap;
  }

  /**
   * Before inserting a new Page all comprefs have to be shifted by 1 to make place for the new compref
   * @param pageNumber
   */
  public shiftComprefsRemove(pageNumber: number) {
    const entries = Array.from(this.pageOverlayCompMap.entries()).sort(
      (a, b) => b[0] - a[0],
    );
    for (let [key, value] of entries) {
      // insert Page
      if (key <= pageNumber) {
        this.pageOverlayCompMap.set(key - 1, value);
        const compref = this.getCompref(key);
        if (compref) compref.instance.pageNumber = key - 1;
        this.pageOverlayCompMap.delete(key);
      }
    }
    return this.pageOverlayCompMap;
  }

  /**
   * removes a ComponentRef
   * @param id
   */
  public removeCompref(id: number) {
    if (this.pageOverlayCompMap.has(id)) {
      this.pageOverlayCompMap.delete(id);
    }
  }
}
