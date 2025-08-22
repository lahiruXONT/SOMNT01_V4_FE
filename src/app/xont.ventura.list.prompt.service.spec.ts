import { TestBed } from '@angular/core/testing';

import { XontVenturaListPromptService } from './xont.ventura.list.prompt.service';

describe('XontVenturaListPromptService', () => {
  let service: XontVenturaListPromptService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(XontVenturaListPromptService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
