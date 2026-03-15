import { Injectable } from '@angular/core';
import { ChatElement } from '../models/chatElement';
import { Observable } from 'rxjs';
import { Environment } from '../models/environment';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ChatServices {

  constructor(private httpClient: HttpClient) {}

  public chatHistory: ChatElement[] = [];
  private chatKnowledgeSubject = new BehaviorSubject<ChatElement[]>([]);
  public chatKnowledge$ = this.chatKnowledgeSubject.asObservable();

  sendMessage(message: ChatElement): Observable<any> {
    return this.httpClient.post(
      Environment.API_BASE_URL + Environment.CHAT_ENDPOINT,
      message,
    { headers: { "Content-Type": "application/json" } }
    );
  }

  async getChatHistory(): Promise<ChatElement[]> {
    const response = await fetch(Environment.API_BASE_URL+Environment.CHAT_ENDPOINT);
    return response.json();
  }


  async getKnowledgeBase(): Promise<string[]> {
    const response = await fetch(Environment.API_BASE_URL+Environment.KNOWLEDGE_BASE_ENDPOINT);
    return response.json();
  }


  async getAllAvailableModels(): Promise<string[]> {
    const response = await fetch(Environment.API_BASE_URL+Environment.MODELS_ENDPOINT);
    return response.json();
  }

  uploadPDF(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('pdf', file);
    return this.httpClient.post(
      Environment.API_BASE_URL + Environment.BACKEND_UPLOAD_ENDPOINT,
      formData,
    );
  }

  addNewModel(modelName: string): Observable<any> {
    return this.httpClient.post(
      Environment.API_BASE_URL + Environment.ADD_MODEL_ENDPOINT,
      { modelName: modelName }
    );
  }

  setModel(modelName: string): Observable<any> {
    return this.httpClient.post(
      Environment.API_BASE_URL + Environment.SET_MODEL_ENDPOINT,
      { modelName: modelName }
    );
  }

  deletePDF(name: string): Observable<any> {
    return this.httpClient.post(
      Environment.API_BASE_URL + Environment.BACKEND_DELETE_ENDPOINT,
      { fileName: name }
    );
  }

}