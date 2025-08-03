import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Constants } from '../../models/constants';
import { PDFFileService } from '../../services/pdffile-service';
import { AlertService } from '../../services/alert-service';
import { AlertComponent } from '../../shared/alert/alert';

@Component({
	selector: 'app-upload-pdfview',
	imports: [CommonModule],
	templateUrl: './upload-pdfview_remade_translucent.html',
	styleUrl: './upload-pdfview.css'
})
export class UploadPDFView {
	public showGlassySvg = false;
	constructor(private router: Router, private fileService: PDFFileService,
		private alertService: AlertService) { }


	//========================================== Clicks =====================================================
	public onUploadBtnClicked(event: Event) {
		const input = event.target as HTMLInputElement

		if (input.files && input.files.length > 0) {
			const file = input.files[0];
			if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
				this.fileService.setFile(file)
				this.router.navigate([Constants.EDIT_PDF_VIEW]);
			} else {
				// Not a PDF
				this.alertService.createAlert("error", Constants.ERROR_INVALID_FILETYPE_TITLE,
					Constants.ERROR_INVALID_FILETYPE, 5000)
				input.value = ""; // Optionally reset the input
			}

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
		const input = event.target as HTMLInputElement
		event.preventDefault();
		const file = event.dataTransfer?.files[0] as File;
		if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
			this.fileService.setFile(file);
			this.router.navigate([Constants.EDIT_PDF_VIEW]);
		}
		else {
			console.warn("Only PDF files are allowed.");
			this.alertService.createAlert("error", Constants.ERROR_INVALID_FILETYPE_TITLE,
				Constants.ERROR_INVALID_FILETYPE, 5000)
		}

		this.showGlassySvg = false;
	}
}
