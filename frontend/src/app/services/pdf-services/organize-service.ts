import { ComponentRef, Injectable } from '@angular/core';
import { PageOverlay } from '../../components/pdf-components/page-overlay/page-overlay';

@Injectable({
  providedIn: 'root',
})
export class OrganizeService {
  public organizerActive: Boolean = false;
  public deletedPages: number[] = [];
  public checkedPages: number[] = [];

  public pageOverlayCompMap = new Map<number, ComponentRef<PageOverlay>>();

  /**
   * saves the ComponentRef of a CommonBoxObject for later use.
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

  /**
   * get the ComponentRef of a CommonBoxObject for later use.
   * @param id => id of the box component (TextBox id or ImgBox id)
   */
  public getCompref(id: number) {
    return this.pageOverlayCompMap.get(id);
  }
}
