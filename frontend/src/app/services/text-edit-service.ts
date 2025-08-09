import { ComponentRef, ElementRef, Injectable, ViewContainerRef, inject } from '@angular/core';
import { BoxDimensions, TextBox } from '../models/TextBox';
import { TextStyleEditor } from '../models/TextStyleEditor';
import { CustomTextEditBox } from '../components/custom-text-edit-box/custom-text-edit-box';
import { PDFViewerService } from './pdfviewer-service';
import { Constants } from '../models/constants';
import { ToolbarComponent } from '../components/toolbar-component/toolbar-component';


//=======================================================================================================================
// Injectible Service that helps with editing textboxes. Implements a lot of helper functions with regards to
// creating and maintaining textboxes.
//=======================================================================================================================
@Injectable({
    providedIn: 'root'
})
export class TextEditService {
    public textboxes: TextBox[] = [];
    public currentFocusTextBoxId: number = 0;
    public pdfViewerContainer: ElementRef | null = null;
    public dynamicContainer: ViewContainerRef | null = null;
    public pdfViewerService = inject(PDFViewerService)
    private toolbarComponent?: ToolbarComponent;

    constructor() { }

    //=======================================================================================================================
    // Helper function to get the index of the current focus textbox. The focus textbox is the textbox that has been
    // clicked inside the most recently.
    //=======================================================================================================================
    public getIndexOfCurrentFocusBox(id: number = -99) {
        const idSearch = id >= 0 ? id : this.currentFocusTextBoxId;
        const textBox = this.textboxes.find(b => b.id == idSearch)
        let ret = 0;
        if (textBox !== undefined)
            ret = this.textboxes.indexOf(textBox!)
        return ret;
    }

    //=======================================================================================================================
    // Setter for the ToolbarComponent
    //=======================================================================================================================
    setToolbar(toolbar: ToolbarComponent) {
        this.toolbarComponent = toolbar;
    }

    //=======================================================================================================================
    // helper Function to get the current textbox. The current textbox is the textbox which is in focus 
    // e.g. which has been clicked inside.
    //=======================================================================================================================
    public getCurrentTextBox() {
        return this.textboxes[this.getIndexOfCurrentFocusBox()]
    }

    //=======================================================================================================================
    // helper Function to get the current textbox style. The current textbox is the textbox which is in focus 
    // e.g. which has been clicked inside. Each textbox has a different style editor.
    //=======================================================================================================================
    public getCurrentTextStyleEditor() {
        if (this.textboxes.length > 0)
            return this.textboxes[this.getIndexOfCurrentFocusBox()].textStyleEditorState;

        return new TextStyleEditor();
    }


    //=======================================================================================================================
    // Helper Function to get the Current Textstyle editor by id of textbox.
    //=======================================================================================================================
    public getCurrentTextStyleEditorById(id: number) {
        return this.textboxes[this.getIndexOfCurrentFocusBox(id)].textStyleEditorState;
    }

    //=======================================================================================================================
    // Click function that is called when someone clicks inside a textbox. This functions is called when the
    // textBoxClicked event is emitted from the CustomTextEditBox. 
    //=======================================================================================================================
    onTextBoxEditClick(id: number, editState: Boolean) {
        console.log("Edit called for box with id: ", id)
        if (editState) {
            this.currentFocusTextBoxId = id;
            this.toolbarComponent!.enableTextStyleEditor(editState);
        }
        else {
            if (id === this.currentFocusTextBoxId)
                this.toolbarComponent!.enableTextStyleEditor(editState);
        }
    }


    checkXBounds(box: TextBox, container: DOMRect)
    {
        if (box.BoxDims.left < 0) box.BoxDims.left = 0;
        if ((box.BoxDims.left+box.BoxDims.width) > container.width) box.BoxDims.left = (container.width - box.BoxDims.width);
        
        return box.BoxDims.left
    }

    checkYBounds(box: TextBox, container: DOMRect)
    {
        if (box.BoxDims.top < 0) box.BoxDims.top = 0;
        if ((box.BoxDims.top+box.BoxDims.height) > container.height) box.BoxDims.top = (container.height - box.BoxDims.height);
        
        return box.BoxDims.top
    }


    //=======================================================================================================================
    // This function is responsible for updating the textbox position, when the textbox is being dragged around.
    //=======================================================================================================================
    public updateTextBoxPos(textBox: TextBox, pos: { top: number, left: number }, pageNum: number) {
        const savedBox = this.textboxes.find(b => b.id === textBox.id);
        if (savedBox) {
            const page = this.pdfViewerService.getPageWithNumber(pageNum)
            const text_layer = page?.htmlContainer?.querySelector(Constants.OVERLAY_TEXT)
            // const canvas_layer = page?.htmlContainer?.querySelector(`page-${pageNum}`)

            const rect = (text_layer as HTMLElement).getBoundingClientRect();
            const rect2 = (page!.htmlContainer! as HTMLElement).getBoundingClientRect();


            savedBox.BoxDims.top = (pos.top - rect.top);
            savedBox.BoxDims.left = pos.left - rect.left;
            savedBox.BoxDims.left = this.checkXBounds(savedBox, rect2)
            savedBox.BoxDims.top = this.checkYBounds(savedBox, rect2)

            savedBox.baseLeft = savedBox.BoxDims.left;
            savedBox.baseTop = savedBox.BoxDims.top ;
            savedBox.BoxDims.posCreationScale = this.pdfViewerService.currentScale;
            savedBox.pageId = pageNum;
        }
    }


    //=======================================================================================================================
    // Helper function to create the container where the textbox is being placed. This also registers all
    // events for the textbox like editing, and moving.
    //=======================================================================================================================
    public createTextBoxContainer(editTextBoxComp: ComponentRef<CustomTextEditBox>, textBox: TextBox,
        pageNum: number, scale: number, scrollTop: number) {

        editTextBoxComp.instance.box = textBox;
        editTextBoxComp.instance.textBoxEditClicked.subscribe((event: any) => this.onTextBoxEditClick(textBox.id, event))
        editTextBoxComp.instance.positionChanged.subscribe((event: any) =>
            this.updateTextBoxPos(textBox, event, pageNum))
        // editTextBoxComp.instance.textBoxEditClicked.subscribe((event: any) => this.removeTextBox(newTextBox.id, event))

        return editTextBoxComp
    }

    //=======================================================================================================================
    // Helper function to create the actual textbox.
    // @param => Box dims = top, left, width, height
    //=======================================================================================================================
    public createTextBox(box_dims: BoxDimensions, styleState: TextStyleEditor, pageNum: number, scale: number,
        scrollTop: number, rerender: Boolean = false, id: number = this.textboxes.length + 1) {
        // this.mouseY += (pageHeight * (this.pageNum - 1))

        const newTextBox = new TextBox(id, pageNum, box_dims, "Text", styleState)

        const page = this.pdfViewerService.getPageWithNumber(pageNum)
        const oldBox: any = this.textboxes.find(b => b.id === newTextBox.id)
        if (oldBox) {
            const idx = this.textboxes.indexOf(oldBox);
            newTextBox.baseTop = oldBox.baseTop;
            newTextBox.baseLeft = oldBox.baseLeft;
            newTextBox.baseHeight = oldBox.baseHeight;
            newTextBox.baseWidth = oldBox.baseWidth;
            this.textboxes.splice(idx, 1, newTextBox);
            page?.replaceTextBox(newTextBox, idx)
        }

        if (!rerender) {
            this.textboxes.push(newTextBox);
            newTextBox.baseTop = box_dims.top;
            newTextBox.baseLeft = box_dims.left;
            newTextBox.baseHeight = box_dims.height;
            newTextBox.baseWidth = box_dims.width;

            page?.appendTextBox(newTextBox)
        }

        let editTextBoxComp = this.pdfViewerService.dynamicContainer!.createComponent(CustomTextEditBox)
        editTextBoxComp = this.createTextBoxContainer(editTextBoxComp, newTextBox, pageNum, scale, scrollTop);

        if (!rerender) {
            const text_layer = page?.htmlContainer?.querySelector(Constants.OVERLAY_TEXT)
            text_layer?.appendChild(editTextBoxComp.location.nativeElement)
        }


        return { comp: editTextBoxComp, box: newTextBox }
    }


}
