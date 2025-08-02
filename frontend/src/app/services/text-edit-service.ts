import { ComponentRef, ElementRef, Injectable, ViewContainerRef, inject } from '@angular/core';
import { TextBox } from '../models/TextBox';
import { TextStyleEditor } from '../models/TextStyleEditor';
import { CustomTextEditBox } from '../components/custom-text-edit-box/custom-text-edit-box';
import { PDFViewerService } from './pdfviewer-service';
import { Constants } from '../models/constants';

@Injectable({
    providedIn: 'root'
})
export class TextEditService {
    public textboxes: TextBox[] = [];
    public currentFocusTextBoxId: number = 0;
    public pdfViewerContainer: ElementRef | null = null;
    public dynamicContainer: ViewContainerRef | null = null;
    public pdfViewerService = inject(PDFViewerService)

    constructor() { }

    public getIndexOfCurrentFocusBox(id: number = -99) {
        const idSearch = id >= 0 ? id : this.currentFocusTextBoxId;
        const textBox = this.textboxes.find(b => b.id == idSearch)
        let ret = 0;
        if (textBox !== undefined)
            ret = this.textboxes.indexOf(textBox!)
        return ret;
    }

    public getCurrentTextBox() {
        return this.textboxes[this.getIndexOfCurrentFocusBox()]
    }

    public getCurrentTextStyleEditor() {
        if (this.textboxes.length > 0)
            return this.textboxes[this.getIndexOfCurrentFocusBox()].textStyleEditorState;

        return new TextStyleEditor();
    }

    public getCurrentTextStyleEditorById(id: number) {
        return this.textboxes[this.getIndexOfCurrentFocusBox(id)].textStyleEditorState;
    }

    onTextBoxEditClick(id: number, editState: Boolean) {
        if (editState) {

            this.currentFocusTextBoxId = id;
            // this.toolbar.enableTextStyleEditor(editState);
        }
        else {
            if (id === this.currentFocusTextBoxId) { }
            // this.toolbar.enableTextStyleEditor(editState);
        }
    }


    public updateTextBoxPos(id: number, pos: { top: number, left: number }, pageNum: number, scale: number, scrollTop: number) {
        const savedBox = this.textboxes.find(b => b.id === id);
        const rect = (this.pdfViewerContainer!.nativeElement as HTMLElement).getBoundingClientRect();

        if (savedBox) {
            savedBox.top = (pos.top - rect.top) * scale + scrollTop;
            savedBox.left = pos.left * scale;
            savedBox.pageId = pageNum;
        }
    }

    public createTextBoxContainer(editTextBoxComp: ComponentRef<CustomTextEditBox>, textBox: TextBox, pageNum: number, scale: number, scrollTop: number) {
        editTextBoxComp.instance.box = textBox;
        editTextBoxComp.instance.textBoxEditClicked.subscribe((event: any) => this.onTextBoxEditClick(textBox.id, event))
        editTextBoxComp.instance.positionChanged.subscribe((event: any) => this.updateTextBoxPos(textBox.id, event, pageNum, scale, scrollTop))
        // editTextBoxComp.instance.textBoxEditClicked.subscribe((event: any) => this.removeTextBox(newTextBox.id, event))

        return editTextBoxComp
    }

    // Box dims = top, left, width, height
    //
    public createTextBox(box_dims: any, styleState: TextStyleEditor, pageNum: number, scale: number, 
                         scrollTop: number, rerender: Boolean = false) {
        // this.mouseY += (pageHeight * (this.pageNum - 1))
        
        const newTextBox = new TextBox(this.textboxes.length + 1, pageNum,
            box_dims.top, box_dims.left, box_dims.width, box_dims.height, "Text", styleState)

        const page = this.pdfViewerService.getPageWithNumber(pageNum)

        if (!rerender) {
            this.textboxes.push(newTextBox);
            page?.appendTextBox(newTextBox)
        }

        let editTextBoxComp = this.pdfViewerService.dynamicContainer!.createComponent(CustomTextEditBox)
        editTextBoxComp = this.createTextBoxContainer(editTextBoxComp, newTextBox, pageNum, scale, scrollTop);

        if (!rerender) {
            const text_layer = page?.htmlContainer?.querySelector(Constants.OVERLAY_TEXT)
            text_layer?.appendChild(editTextBoxComp.location.nativeElement)
        }


        return editTextBoxComp
    }


}
