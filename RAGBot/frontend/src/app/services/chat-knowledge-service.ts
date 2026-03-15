import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatKnowledgeService {
  
  private knowledgeSubject = new BehaviorSubject<string[]>([]);

  public knowledge$ = this.knowledgeSubject.asObservable();

  constructor() {}

  get currentKnowledge(): string[] {
    return this.knowledgeSubject.getValue();
  }

  addKnowledge(item: string) {
    const currentArray = this.currentKnowledge;
    this.knowledgeSubject.next([...currentArray, item]);
  }

  removeKnowledge(itemToRemove: string) {
    const currentArray = this.currentKnowledge;
    const updatedArray = currentArray.filter(item => item !== itemToRemove);
    this.knowledgeSubject.next(updatedArray);
  }

  setKnowledge(items: string[]) {
    this.knowledgeSubject.next(items);
  }
}