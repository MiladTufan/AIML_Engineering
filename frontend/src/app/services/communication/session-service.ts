import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Environment } from '../../models/constants/environment';
import { Observable } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  constructor(private httpClient: HttpClient) {}


  // ============================================== ROUTE Calls ==============================================
  uploadPDF(file: File, signed_sid: string): Observable<any>
  {
    const formData = new FormData()
    formData.append("signed_sid", signed_sid)
    formData.append("pdf", file)
    return this.httpClient.post(Environment.API_BASE_URL + 
                           Environment.BACKEND_UPLOAD_ENDPOINT, formData)
  }

  createSession(): Observable<any>
  {
     return this.httpClient.post<{ signed_sid: string }>(Environment.API_BASE_URL + 
                            Environment.BACKEND_CREATE_SESSION_ENDPOINT, {});
  }

  deleteSession(): Observable<any>
  {
     return this.httpClient.post(Environment.API_BASE_URL + 
                            Environment.BACKEND_CREATE_SESSION_ENDPOINT, {});
  }


    // ============================================== Methods ==============================================
  deleteCookie(session_id: string)
  {
    document.cookie = `session_id=${session_id}; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }

  setSessionIdInBrowser(signed_sid: string)
  {
    document.cookie = `session_id=${encodeURIComponent(signed_sid)}; path=/; secure; samesite=lax`;
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
