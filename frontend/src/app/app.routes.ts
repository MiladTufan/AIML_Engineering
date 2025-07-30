import { Routes } from '@angular/router';
import { UploadPDFView } from './views/upload-pdfview/upload-pdfview';
import { EditPDFView } from './views/edit-pdfview/edit-pdfview';

export const routes: Routes = [
    {path: "", component: UploadPDFView},
    {path: "edit-pdf-view", component: EditPDFView},
];
