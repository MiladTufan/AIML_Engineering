import { Component } from '@angular/core';
import { PDFFileService } from '../../services/pdffile-service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Constants } from '../../models/constants';

@Component({
	selector: 'app-upload-pdfview',
	imports: [CommonModule],
	templateUrl: './upload-pdfview.html',
	styleUrl: './upload-pdfview.css'
})
export class UploadPDFView {
	public showGlassySvg = false;
	constructor(private router: Router, private fileService: PDFFileService) { }


	//========================================== Clicks =====================================================
	public onUploadBtnClicked(event: Event) {
		const input = event.target as HTMLInputElement
		if (input.files && input.files.length > 0) {
			const file = input.files[0];

			this.fileService.setFile(file)
			this.router.navigate([Constants.EDIT_PDF_VIEW]);
		}
	}

	//========================================== Drags =====================================================
	public onDragOver(event: DragEvent) {
		event.preventDefault();
		this.showGlassySvg = true;
	}

	//--------------------------------------------------------------------------------//
	public onDragLeave(event: DragEvent) {
		const target = event.currentTarget as HTMLElement;
		const realtedElement = event.relatedTarget as HTMLElement | null;

		if (realtedElement && target.contains(realtedElement))
			return;

		this.showGlassySvg = false;
	}

	//--------------------------------------------------------------------------------//
	public onDragEnd(event: DragEvent) {
		event.preventDefault();
		this.showGlassySvg = false;
	}

	//--------------------------------------------------------------------------------//
	public onDrop(event: DragEvent) {
		event.preventDefault();
		const file = event.dataTransfer?.files[0] as File;
		this.fileService.setFile(file)
		this.router.navigate(["/edit-pdf"]);
		this.showGlassySvg = false;
	}
}
