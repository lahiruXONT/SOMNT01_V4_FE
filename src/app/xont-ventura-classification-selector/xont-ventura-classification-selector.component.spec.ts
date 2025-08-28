import { ComponentFixture, TestBed } from '@angular/core/testing';

import { XontVenturaClassificationSelectorComponent } from './xont-ventura-classification-selector.component';

describe('XontVenturaClassificationSelectorComponent', () => {
  let component: XontVenturaClassificationSelectorComponent;
  let fixture: ComponentFixture<XontVenturaClassificationSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [XontVenturaClassificationSelectorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(XontVenturaClassificationSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
