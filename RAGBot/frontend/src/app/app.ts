import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChatComponent } from "./components/chat-component/chat-component";
import { ChatHistory } from "./components/chat-history/chat-history";
import { KnowledgeBaseComponent } from './components/knowledge-base-component/knowledge-base-component';

@Component({
  selector: 'app-root',
  imports: [ChatComponent, ChatHistory, KnowledgeBaseComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
}
