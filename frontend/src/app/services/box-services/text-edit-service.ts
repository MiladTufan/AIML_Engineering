import {
  ComponentRef,
  ElementRef,
  Injectable,
  OnDestroy,
  ViewContainerRef,
  inject,
} from '@angular/core';
import { fromEvent, Subscription } from 'rxjs';
import {
  BoxDimensions,
  TextBlock,
  TextBox,
} from '../../models/box-models/TextBox';
import { TextFormat, TextStyle } from '../../models/box-models/TextStyle';
import { BlockObject } from '../../models/box-models/BlockObject';
import { EntityManagerService } from './entity-manager-service';

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
  public entityManagerService = inject(EntityManagerService);

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

  public mergeOverlappingTextBlocks(textbox: TextBox, textBlock: TextBlock) {
    let mergedStart = -1;
    let mergeEnd = -1;

    let blockKey = '';

    const box = this.entityManagerService.blockObjects.find(
      (b) => b.id === textbox.id,
    ) as TextBox;

    const keys = Array.from(box.textBlocks.keys());
    const idxOfBlock = keys.indexOf(textBlock.text);

    if (box) {
      box.textBlocks.forEach((block, key) => {
        if (
          key !== textBlock.text &&
          block.startOffset <= textBlock.endOffset &&
          textBlock.startOffset <= block.endOffset &&
          this.compareTextStyle(block.StyleState, textBlock.StyleState)
        ) {
          mergedStart = Math.min(block.startOffset, textBlock.startOffset);
          mergeEnd = Math.max(block.endOffset, textBlock.endOffset);
          blockKey = key;
        }
      });
    }

    let mergedtext = '';

    if (blockKey != '') {
      const idxOfOverlappingBlock = keys.indexOf(blockKey);

      if (idxOfBlock < idxOfOverlappingBlock) {
        mergedtext =
          box.textBlocks.get(keys[idxOfBlock])!.text +
          box.textBlocks.get(keys[idxOfOverlappingBlock])!.text;
      } else {
        mergedtext =
          box.textBlocks.get(keys[idxOfOverlappingBlock])!.text +
          box.textBlocks.get(keys[idxOfBlock])!.text;
      }

      if (mergedtext != '') {
        const mergedTextBlock = new TextBlock(
          mergedtext,
          mergedStart,
          mergeEnd,
          textBlock.StyleState,
        );

        box.textBlocks.set(mergedtext, mergedTextBlock);

        box.textBlocks.delete(keys[idxOfBlock]);
        box.textBlocks.delete(keys[idxOfOverlappingBlock]);
      }
    }
  }

  private compareTextStyle(style1: TextStyle, style2: TextStyle) {
    if (
      style1.isCollapsed === style2.isCollapsed &&
      this.compareTextFormat(style1.textFormat, style2.textFormat) &&
      style1.textFormat === style2.textFormat &&
      style1.textStyle === style2.textStyle &&
      style1.textFontFamily === style2.textFontFamily &&
      style1.textFontName === style2.textFontName &&
      style1.textFontSize === style2.textFontSize &&
      style1.textBaseFontSize === style2.textBaseFontSize &&
      style1.textColor === style2.textColor &&
      style1.textBG === style2.textBG
    ) {
      return true;
    }
    return false;
  }

  private compareTextFormat(format1: TextFormat, format2: TextFormat) {
    if (
      format1.isBold === format2.isBold &&
      format1.isItalic === format2.isItalic &&
      format1.isUnderline === format2.isUnderline &&
      format1.isSuperscript === format2.isSuperscript &&
      format1.isSubscript === format2.isSubscript &&
      format1.isLeftAlign === format2.isLeftAlign &&
      format1.isRightAlign === format2.isRightAlign &&
      format1.isCenterAlign === format2.isCenterAlign
    ) {
      return true;
    }

    return false;
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
    const textBox = new TextBox(
      0,
      0,
      dims,
      'Text',
      new Map<string, TextBlock>(),
      new TextStyle(),
    );
    Object.assign(textBox, obj);

    if (
      textBox.BoxDims.resizedHeight !== 0 &&
      textBox.BoxDims.resizedWidth !== 0
    ) {
      textBox.BoxDims.width = textBox.BoxDims.resizedWidth;
      textBox.BoxDims.height = textBox.BoxDims.resizedHeight;
    }

    textBox.text += ' ' + textBox.id;

    return textBox;
  }
}
