import { Injectable } from '@angular/core';
import { TextBox } from '../models/TextBox';
import { TextStyleEditor } from '../models/TextStyleEditor';

@Injectable({
    providedIn: 'root'
})
export class TextEditService {
    public textboxes: TextBox[] = [];
    public currentFocusTextBoxId: number = 0;
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


}
