import {
  ComponentRef,
  ElementRef,
  Injectable,
  OnDestroy,
  ViewContainerRef,
  inject,
} from '@angular/core';
import { fromEvent, Subscription } from 'rxjs';
import { BoxDimensions, TextBox } from '../../models/box-models/TextBox';
import { TextStyle } from '../../models/box-models/TextStyle';
import { BlockObject } from '../../models/box-models/BlockObject';
import { PDFViewerService } from '../pdf-services/pdfviewer-service';

//=======================================================================================================================
// Injectible Service that helps with editing textboxes. Implements a lot of helper functions with regards to
// creating and maintaining textboxes.
//=======================================================================================================================
@Injectable({
  providedIn: 'root',
})
export class TextEditService {
  public textboxes: TextBox[] = [];
  public currentFocusTextBoxId: number = 0;
  public pdfViewerService = inject(PDFViewerService);

  //=======================================================================================================================
  // Helper function to get the index of the current focus textbox. The focus textbox is the textbox that has been
  // clicked inside the most recently.
  //=======================================================================================================================
  public getIndexOfCurrentFocusBox(id: number = -99) {
    const idSearch = id >= 0 ? id : this.currentFocusTextBoxId;
    const textBox = this.textboxes.find((b) => b.id == idSearch);
    let ret = -1;
    if (textBox !== undefined) ret = this.textboxes.indexOf(textBox!);
    return ret;
  }

  //=======================================================================================================================
  // helper Function to get the current textbox. The current textbox is the textbox which is in focus
  // e.g. which has been clicked inside.
  //=======================================================================================================================
  public getCurrentTextBox() {
    return this.textboxes[this.getIndexOfCurrentFocusBox()];
  }

  //=======================================================================================================================
  // helper Function to get the current textbox style. The current textbox is the textbox which is in focus
  // e.g. which has been clicked inside. Each textbox has a different style editor.
  //=======================================================================================================================
  public getCurrentTextStyle() {
    if (this.textboxes.length > 0) {
      const focusBoxIdx = this.getIndexOfCurrentFocusBox();
      if (focusBoxIdx != -1)
        return this.textboxes[this.getIndexOfCurrentFocusBox()].StyleState;
    }

    return new TextStyle();
  }

  //=======================================================================================================================
  // Helper Function to get the Current Textstyle editor by id of textbox.
  //=======================================================================================================================
  public getCurrentTextStyleById(id: number) {
    const focusBoxIdx = this.getIndexOfCurrentFocusBox(id);
    if (focusBoxIdx != -1) return this.textboxes[focusBoxIdx].StyleState;

    return undefined;
  }

  /**
   * Converts a BlockObject to an ImgBox
   * @param obj => the BlockObject to convert.
   * @returns
   */
  public toTextBox(obj: BlockObject): TextBox {
    // dummy dims
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
    };
    const textBox = new TextBox(0, 0, dims, 'Text', new TextStyle());
    Object.assign(textBox, obj);

    if (
      textBox.BoxDims.resizedHeight !== 0 &&
      textBox.BoxDims.resizedWidth !== 0
    ) {
      textBox.BoxDims.width = textBox.BoxDims.resizedWidth;
      textBox.BoxDims.height = textBox.BoxDims.resizedHeight;
    }

    return textBox;
  }
}
