import { Injectable } from '@angular/core';
import { Environment } from '../../models/constants/environment';
import { GlobalEdit } from '../../models/globalEdit';
import { HttpClient } from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class DownloadService {

    constructor(private httpClient: HttpClient) { }

    downloadPDF() {
        window.open(Environment.API_BASE_URL + Environment.BACKEND_DOWNLOAD_ENDPOINT, '_blank');
    }

    completePDF(edits: GlobalEdit) {
        return this.httpClient.post<any>(Environment.API_BASE_URL + Environment.BACKEND_COMPLETE_PDF_ENDPOINT, edits)
    }
}
