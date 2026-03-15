import { TestBed } from '@angular/core/testing';

import { ChatKnowledgeService } from './chat-knowledge-service';

describe('ChatKnowledgeService', () => {
  let service: ChatKnowledgeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChatKnowledgeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
