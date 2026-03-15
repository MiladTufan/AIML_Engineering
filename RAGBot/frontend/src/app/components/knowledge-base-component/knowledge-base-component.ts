import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { ChatServices } from '../../services/chat-services';
import { ThemeService } from '../../services/theme-service';
import { Subscription } from 'rxjs';
import { ChatKnowledgeService } from '../../services/chat-knowledge-service';

@Component({
  selector: 'app-knowledge-base-component',
  imports: [ScrollingModule],
  templateUrl: './knowledge-base-component.html',
  styleUrl: './knowledge-base-component.css',
})
export class KnowledgeBaseComponent implements OnInit, OnDestroy {

  public knowledgeBase: string[] = [];
  private subscription!: Subscription;

  private chatService: ChatServices = inject(ChatServices);
  public themeService: ThemeService = inject(ThemeService);
  
  private knowledgeService: ChatKnowledgeService = inject(ChatKnowledgeService);

  async ngOnInit() {
    this.subscription = this.knowledgeService.knowledge$.subscribe(
      (knowledge: string[]) => {
        this.knowledgeBase = [...knowledge];
        console.log("adding knowledge")
      }
    );

    let dbKnowledgeBase = await this.chatService.getKnowledgeBase();
    this.knowledgeService.setKnowledge(dbKnowledgeBase || []);
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  public DeleteKnowledge(knowledgeToDelete: string) {
    this.chatService.deletePDF(knowledgeToDelete).subscribe({
        next: (response) => {
          console.log("deletion successful", response);
          this.knowledgeService.removeKnowledge(knowledgeToDelete);
        },
        error: (err) => {
          console.error("deletion failed", err);
        }
      });
  }

  public AddKnowledge(event: Event) {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        this.chatService.uploadPDF(file).subscribe({
          next: (response) => {
            console.log("Upload successful", response);
            this.knowledgeService.addKnowledge(file.name);
          },
          error: (err) => {
            console.error("Upload failed", err);
          }
        });
      } else {
        console.error("not a pdf!");
        input.value = ""; 
      }
    }
  }
}