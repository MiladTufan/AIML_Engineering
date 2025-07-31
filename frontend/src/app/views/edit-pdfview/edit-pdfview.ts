import { PdfViewerComponent } from '../../components/pdf-viewer-component/pdf-viewer-component';
import { Component, ComponentRef, ElementRef, HostListener, Renderer2, signal, ViewChild, ViewContainerRef } from '@angular/core';
import { PDFFileService } from '../../services/pdffile-service';
import { ToolbarComponent } from '../../components/toolbar-component/toolbar-component';



@Component({
	selector: 'app-edit-pdfview',
	imports: [PdfViewerComponent, ToolbarComponent],
	templateUrl: './edit-pdfview.html',
	styleUrl: './edit-pdfview.css'
})
export class EditPDFView {
	//=================================================== Private variables =================================================
	private mouseX: number = 0;
	private mouseY: number = 0;
	private isDragging: Boolean = false;
	private allTextBoxCompRef: any[] = []

	//=================================================== Public variables ==================================================
	public pdfSrc = signal(new Uint8Array)
	public pageNum: number = 1;
	public scrollMode: number = 0;
	public currentZoom: number = 1.0;

	//==================================================== Children =========================================================
	@ViewChild('pdfViewer', { read: ElementRef }) pdfViewerRef!: ElementRef;
	@ViewChild('ScrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;
	@ViewChild('dynamicContainer', { read: ViewContainerRef }) dynamicContainer!: ViewContainerRef;
	// @ViewChild(ToolbarComponent) toolbar!: ToolbarComponent;

	//=================================================== Constructor =======================================================
	// constructor(private fileService: PDFFileService, private textEditService: TextEditService, private renderer: Renderer2,
	// 	private pdfService: NgxExtendedPdfViewerService
	// ) { }

	constructor(private fileService: PDFFileService, private renderer: Renderer2) { }

	// ================================================== Listener functions ================================================
	@HostListener("document:mousemove", ["$event"])
	trackmouse(event: MouseEvent) {
		const rect = (this.pdfViewerRef.nativeElement as HTMLElement).getBoundingClientRect();
		this.mouseX = event.clientX;
		this.mouseY = event.clientY - rect.top;
	}

	async ngOnInit() {
	
	}


}	
