import { ComponentFixture, TestBed } from '@angular/core/testing';

import { XontVenturaListPromptComponent } from './xont.ventura.list.prompt.component';

describe('XontVenturaListPromptComponent', () => {
  let component: XontVenturaListPromptComponent;
  let fixture: ComponentFixture<XontVenturaListPromptComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [XontVenturaListPromptComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(XontVenturaListPromptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
