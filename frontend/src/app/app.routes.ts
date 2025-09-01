import { Routes } from '@angular/router';
import { UploadPDFView } from './views/upload-pdfview/upload-pdfview';
import { EditPDFView } from './views/edit-pdfview/edit-pdfview';
import { Constants } from './models/constants/constants';
import { Credits } from './views/credits/credits';
import { DeletionView } from './views/deletion-view/deletion-view';
import { OrganizeView } from './views/organize-view/organize-view';

export const routes: Routes = [
    {path: "", component: UploadPDFView},
    {path: Constants.EDIT_PDF_VIEW, component: EditPDFView},
    {path: Constants.CREDITS_VIEW, component: Credits},
    {path: Constants.DELETE_VIEW, component: DeletionView},
    {path: Constants.ORGANIZE_VIEW, component: OrganizeView},
];
