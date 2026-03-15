import { Component, inject } from '@angular/core';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { ChatServices } from '../../services/chat-services';
import { ChatElement } from '../../models/chatElement';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat-history',
  standalone: true,
  imports: [ScrollingModule, CommonModule],
  templateUrl: './chat-history.html',
  styleUrl: './chat-history.css',
})
export class ChatHistory {
  public chatService: ChatServices = inject(ChatServices)

  trackByIndex(index: number, item: any) {
    return index; // or item.id if you have unique ids
  }

  async ngOnInit()
  {
    let dbChatHist = await this.chatService.getChatHistory()
    this.chatService.chatHistory = [...dbChatHist];
  }


}
