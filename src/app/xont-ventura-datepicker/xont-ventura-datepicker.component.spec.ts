import { ComponentFixture, TestBed } from '@angular/core/testing';

import { XontVenturaDatepickerComponent } from './xont-ventura-datepicker.component';

describe('XontVenturaDatepickerComponent', () => {
  let component: XontVenturaDatepickerComponent;
  let fixture: ComponentFixture<XontVenturaDatepickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [XontVenturaDatepickerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(XontVenturaDatepickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
