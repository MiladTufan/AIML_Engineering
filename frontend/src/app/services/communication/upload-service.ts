import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Environment } from '../../models/constants/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UploadService {

  constructor(private httpClient: HttpClient) {}


  uploadPDF(file: File): Observable<any>
  {
    const formData = new FormData()
    formData.append("pdf", file)
    return this.httpClient.post<File>(Environment.API_BASE_URL + Environment.BACKEND_UPLOAD_ENDPOINT, formData)
  }
}
