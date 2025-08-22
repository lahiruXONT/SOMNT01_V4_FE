import { ComponentFixture, TestBed } from '@angular/core/testing';

import { XontVenturaMessagePromptComponent } from './xont-ventura-message-prompt.component';

describe('XontVenturaMessagePromptComponent', () => {
  let component: XontVenturaMessagePromptComponent;
  let fixture: ComponentFixture<XontVenturaMessagePromptComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [XontVenturaMessagePromptComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(XontVenturaMessagePromptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
