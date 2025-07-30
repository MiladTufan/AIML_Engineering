import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter, ViewChild } from '@angular/core';
import { Constants } from '../../models/constants';
import { TextEditService } from '../../services/text-edit-service';
import { TextStyleEditorComponent } from '../custom-text-edit-box/text-style-editor-component/text-style-editor-component';

@Component({
	selector: 'app-toolbar',
	standalone: true,
	imports: [CommonModule, TextStyleEditorComponent],
	templateUrl: './toolbar.html',
	styleUrl: './toolbar.css'
})
export class ToolbarComponent {

	//=============================================== Outputs =============================================
	@Output() textBoxClicked = new EventEmitter<Boolean>();

	//=============================================== Children ============================================
	// @ViewChild("TextButtonContainer") textContainer!: ElementRef<HTMLDivElement>;
	@ViewChild(TextStyleEditorComponent) textStyleEditorComponent!: TextStyleEditorComponent

	//=============================================== Constructor =========================================
	constructor(public textEditService: TextEditService) {}

	//=============================================== Click ===============================================
	public OnTextBtnClicked(event: Event) {
		this.textBoxClicked.emit(true);
	}

	public OnInsertImageBtnClicked(event: Event) {
		console.log("image paste clicked!")
	}

	public OnDownloadBtnClicked(event: Event) {
		window.open(Constants.BACKEND_DOWNLOAD_URL, '_blank');
	}
	//=============================================== Methods ==============================================


	  public enableTextStyleEditor(editState: Boolean)
	  {
	    if (editState)
	      this.textStyleEditorComponent.expandColorPallet();
	    else
	      this.textStyleEditorComponent.collapseColorPallet();
	  }
}
