// event-bus.service.ts
import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventBusService {
  private subjects: Map<string, Subject<any>> = new Map();

  
  public constructKey(eventName: string, scope: string) {
    return `${eventName}:${scope}`
  }

  // Exposed this only for jasmine testing purposes
  public getEventSubjets() {
    return this.subjects;
  }

  public removeKey(eventName: string, scope: string)
  {
    const key = this.constructKey(eventName, scope)
    if(this.subjects.has(key))
      this.subjects.delete(key)
  }

  // Emit an event into a channel
  emit<T>(eventName: string, payload: T, scope: string = "",): void {
    let key;
    if (scope != "")
      key = this.constructKey(eventName, scope)
    else
      key = eventName

    if (!this.subjects.has(key)) {
      this.subjects.set(key, new Subject<T>());
    }
    this.subjects.get(key)!.next(payload);
  }

  // Subscribe to a channel
  on<T>(eventName: string, scope: string = ""): Observable<T> {
    let key;
    if (scope != "")
      key = this.constructKey(eventName, scope)
    else
      key = eventName

    if (!this.subjects.has(key)) {
      this.subjects.set(key, new Subject<T>());
      
    }
    return this.subjects.get(key)!.asObservable();
  }
}