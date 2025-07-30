import { Routes } from '@angular/router';
import { UploadPDFView } from './views/upload-pdfview/upload-pdfview';
import { EditPDFView } from './views/edit-pdfview/edit-pdfview';
import { Constants } from './models/constants';

export const routes: Routes = [
    {path: "", component: UploadPDFView},
    {path: Constants.EDIT_PDF_VIEW, component: EditPDFView},
];
