import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Environment } from '../../models/constants/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  constructor(private httpClient: HttpClient) {}


  uploadPDF(file: File): Observable<any>
  {
    const formData = new FormData()
    formData.append("pdf", file)
    return this.httpClient.post<File>(Environment.API_BASE_URL + 
                           Environment.BACKEND_UPLOAD_ENDPOINT, formData)
  }

  createSession()
  {
     return this.httpClient.post<{ session_id: string }>(Environment.API_BASE_URL + 
                            Environment.BACKEND_CREATE_SESSION_ENDPOINT, {});
  }

  setSessionIdInBrowser(data: {session_id: string})
  {
    document.cookie = `session_id=${encodeURIComponent(data.session_id)}; path=/; secure; samesite=lax`;
  }

  getSessionIdFromBrowser(name: string): string | null
  {
    const cookies = document.cookie ? document.cookie.split(";") : []

    for (let cookie of cookies)
    {
      const [key, value] = cookie.trim().split("=")
      if (key === name)
      {
        try {return decodeURIComponent(value)}
        catch {return value}
      }
    }
    return null
  }
}
