import { Injectable } from '@angular/core';
import { Environment } from '../../models/constants/environment';
import { GlobalEdit, Payload } from '../../models/globalEdit';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class DownloadService {

    constructor(private httpClient: HttpClient) { }

    downloadPDF(signed_sid: string) {
        window.open(Environment.API_BASE_URL + Environment.BACKEND_DOWNLOAD_ENDPOINT+"/"+signed_sid, '_blank');
    }

    completePDF(edits: GlobalEdit, signed_sid: string) {
        const payload: Payload = {
            edits: edits,
            signed_id: signed_sid
        }
        return this.httpClient.post<any>(Environment.API_BASE_URL + 
            Environment.BACKEND_EMBED_PDF_ENDPOINT, payload)
    }
}
