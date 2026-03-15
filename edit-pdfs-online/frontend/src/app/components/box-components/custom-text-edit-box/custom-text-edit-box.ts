import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  HostListener,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TextStyleBlock } from '../../shared/text-style-block/text-style-block';
import { TextEditService } from '../../../services/box-services/text-edit-service';
import { EntityManagerService } from '../../../services/box-services/entity-manager-service';
import { TextBlock, TextBox } from '../../../models/box-models/TextBox';
import { BlockObject } from '../../../models/box-models/BlockObject';
import { EventBusService } from '../../../services/communication/event-bus-service';
import { Constants } from '../../../models/constants/constants';

@Component({
  selector: 'app-custom-text-edit-box',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './custom-text-edit-box.html',
  styleUrl: './custom-text-edit-box.css',
})
export class CustomTextEditBox {
  //=================================================== Private variables =================================================
  id: number = 0;
  posX: number = 0;
  posY: number = 0;
  text: string = 'Text';
  dragOffsetX = 0;
  dragOffsetY = 0;
  currentlyEditing = false;
  textColor: string = 'black';
  mouseX: number = 0;
  mouseY: number = 0;
  cntr = 0;
  currentAlignment: string = 'left';
  currentEventTarget: EventTarget | null = null;
  private currentBoxStyle: string = '';

  public boxText = 'Text';
  public isEditable: Boolean = true;
  private resizeObserver!: ResizeObserver;

  //=================================================== Inputs =================================================
  @Input() box: any;

  //=================================================== Outputs =================================================
  @Output() textBoxEditClicked = new EventEmitter<Boolean>();
  @Output() positionChanged = new EventEmitter<{ top: number; left: number }>();

  //=================================================== Children =================================================
  @ViewChild('editableDiv') editableDiv!: ElementRef;
  @ViewChild(TextStyleBlock) textStyleBlockComponent!: TextStyleBlock;

  constructor(
    public textEditService: TextEditService,
    private entityManagerService: EntityManagerService,
    private cdr: ChangeDetectorRef,
    private eventBusService: EventBusService,
  ) {}

  ngAfterViewInit() {
    if (this.editableDiv) this.updateTextStyle();
  }

  roundedWidth(w: number) {
    return Math.round(w);
  }

  onInput(event: Event) {
    const text = (event.target as HTMLElement).innerText;
    const savedBox = this.entityManagerService.blockObjects.find(
      (b) => b.id == this.box.id,
    );
    if (savedBox && savedBox instanceof TextBox) {
      this.box.text = text;
      this.cdr.detectChanges();
    }
  }

  expandColorPallet() {
    const currentTextStyle = this.textEditService.getCurrentTextStyle();
    // this.currentFontSize = currentTextStyle.textBaseFontSize.toString()
    // this.currentFont = currentTextStyle.textFontFamily
    // this.currentFontName = currentTextStyle.textFontName
    this.textEditService.getCurrentTextStyle().isCollapsed = false;
  }

  collapseColorPallet() {
    this.textEditService.getCurrentTextStyle().isCollapsed = true;
  }

  getTextAlignment() {
    if (this.box.StyleState.textFormat.isCenterAlign) return 'center';
    else if (this.box.StyleState.textFormat.isRightAlign) return 'right';
    else return 'left';
  }

  styleText(elem: HTMLElement) {
    elem.style.textAlign = this.getTextAlignment();
    elem.style.color = this.box.StyleState.textColor;
    elem.style.fontSize = this.box.StyleState.textFontSize + 'px';
    elem.style.fontWeight = this.box.StyleState.textFormat.isBold
      ? 'bold'
      : 'normal';
    elem.style.fontStyle = this.box.StyleState.textFormat.isItalic
      ? 'italic'
      : 'normal';
    elem.style.textDecoration = this.box.StyleState.textFormat.isUnderline
      ? 'underline'
      : '';

    elem.style.fontFamily = this.box.StyleState.textFontFamily;

    if (this.box.StyleState.textStyle !== this.currentBoxStyle) {
      this.currentBoxStyle = this.box.StyleState.textStyle;
      this.boxText = this.box.text;
      this.cdr.detectChanges();
    }

    return elem;
  }

  updateTextStyle() {
    const div = this.editableDiv.nativeElement;

    const selection = window.getSelection();
    if (!selection) return;

    if (selection.isCollapsed) {
      this.styleText(div);
      return;
    }

    const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

    if (
      range &&
      this.editableDiv.nativeElement.contains(range.commonAncestorContainer)
    ) {
      const startOffset = range?.startOffset;
      const endtOffset = range?.endOffset;
      const content = range.extractContents();

      const nodes: ChildNode[] = Array.from(content.childNodes);
      let selectedText: HTMLElement | null = null;

      nodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
          console.log(node.parentElement);
          console.log('Selected text:', selection.toString());
          selectedText = document.createElement('span');
          selectedText.textContent = node.textContent;
          range.insertNode(selectedText);
          this.mergeAdjacent(selectedText as HTMLElement);
          this.styleText(selectedText);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          selectedText = node as HTMLElement;
          range.insertNode(selectedText);
          this.mergeAdjacent(selectedText as HTMLElement);
          this.styleText(selectedText);
        }
      });

      // TODO fix correct assignment to textblocks
      if (selectedText) {
        const ret = this.removeRange(this.box.text, startOffset, endtOffset);
        this.box.text = ret.result;
        const textBlock = new TextBlock(
          ret.removed,
          startOffset,
          endtOffset,
          structuredClone(this.box.StyleState),
        );
        this.box.textBlocks.set(ret.removed, textBlock);
        this.textEditService.mergeOverlappingTextBlocks(this.box, textBlock);
        console.log('DEBUG');
      }

      selection.removeAllRanges();
    } else {
      console.log('No selection inside editor');
    }

    div.focus();
  }

  private removeRange(str: string, start: number, end: number) {
    const removed = str.slice(start, end + 1);
    const result = str.slice(0, start) + str.slice(end + 1);
    return { removed: removed, result: result };
  }

  mergeAdjacent(element: HTMLSpanElement) {
    // Merge next sibling
    const next = element.nextSibling;
    if (
      next &&
      next.nodeType === 1 &&
      (next as HTMLElement).style.cssText === element.style.cssText
    ) {
      element!.textContent = next!.textContent! + element!.textContent!;
      next.remove();
    }

    // Merge previous sibling
    const prev = element.previousSibling;
    if (
      prev &&
      element != null &&
      prev.nodeType === Node.ELEMENT_NODE &&
      (prev as HTMLElement).style.cssText === element.style.cssText
    ) {
      element!.textContent = element!.textContent! + prev.textContent;
      prev.remove();
    }

    this.removeEmptySpans(element.parentElement!);
  }

  removeEmptySpans(parent: HTMLElement) {
    const spans = Array.from(parent.querySelectorAll('span'));

    spans.forEach((span) => {
      // Remove if no text content and no child elements
      if (!span.textContent || span.textContent.trim() === '') {
        span.remove();
      }
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    try {
      if (this.editableDiv == null) return;
      event.stopPropagation();

      const clickedInsideTextBox = this.editableDiv.nativeElement.contains(
        event.target,
      );
      const eventTarget = event.target as HTMLElement;

      let clickInsideTextStyle = false;
      let node = eventTarget;
      while (node.parentElement) {
        clickInsideTextStyle = node?.id === 'TextStyleContainer' ? true : false;
        if (clickInsideTextStyle) break;
        node = node.parentElement;
      }

      if (!clickInsideTextStyle) {
        this.currentlyEditing = clickedInsideTextBox;
        this.textBoxEditClicked.emit(this.currentlyEditing);
      }
    } catch (error) {
      console.log(error);
    }
  }
}
