import { Component, inject } from '@angular/core';
import { ChatServices } from '../../services/chat-services';
import { ChatElement } from '../../models/chatElement';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';  
import { ThemeService } from '../../services/theme-service';
import { ChatKnowledgeService } from '../../services/chat-knowledge-service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat-component',
  imports: [FormsModule, CommonModule],
  templateUrl: './chat-component.html',
  styleUrl: './chat-component.css',
})
export class ChatComponent {

  public chatService: ChatServices = inject(ChatServices)
  private knowledgeService: ChatKnowledgeService = inject(ChatKnowledgeService)
  public themeService: ThemeService = inject(ThemeService)

  public messageText: string = ""
  public selectedModel: string = '';
  public isDropdownOpen: boolean = false;
  isKnowledgeUploaded: boolean = false;

  private subscription!: Subscription;

  modelOptions: string[] = []

  async ngOnInit()
  {
    this.modelOptions = [...await this.chatService.getAllAvailableModels()];
    if (this.modelOptions.length > 0)
      this.selectedModel =this.modelOptions[0]

    this.subscription = this.knowledgeService.knowledge$.subscribe((knowledgeArray: string[]) => {
      this.isKnowledgeUploaded = knowledgeArray.length > 0; 
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  public async Enter(text: string)
  {
    this.messageText = ""
    let elem = new ChatElement('user', text)
    this.chatService.chatHistory = [...this.chatService.chatHistory, elem];

    await this.chatService.sendMessage(elem).subscribe((value: ChatElement) => {
      this.chatService.chatHistory = [...this.chatService.chatHistory, value];
    });
  }

  openDropdown() {
    this.isDropdownOpen = true;
  }

  handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.Enter(this.messageText);
    }
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  selectOption(option: string) {
    this.selectedModel = option;
    this.isDropdownOpen = false; 
    this.chatService.setModel(option).subscribe({
        next: (response) => {
          console.log("model set successfully", response);
        },
        error: (err) => {
          console.error("Setting model failed", err);
        }
    });
  }

  canAddNewOption(): boolean {
    const val = this.selectedModel.trim();
    return val.length > 0 && !this.modelOptions.includes(val);
  }

  addNewOption() {
    const val = this.selectedModel.trim();
    
    if (val && !this.modelOptions.includes(val)) {
      this.modelOptions.push(val); 
    }
    
    this.selectOption(val); 

    this.chatService.addNewModel(val).subscribe({
        next: (response) => {
          console.log("Adding model was successful", response);
        },
        error: (err) => {
          console.error("Adding model failed", err);
        }
    });
  }
}
