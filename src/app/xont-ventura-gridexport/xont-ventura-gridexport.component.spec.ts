import { ComponentFixture, TestBed } from '@angular/core/testing';

import { XontVenturaGridexportComponent } from './xont-ventura-gridexport.component';

describe('XontVenturaGridexportComponent', () => {
  let component: XontVenturaGridexportComponent;
  let fixture: ComponentFixture<XontVenturaGridexportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [XontVenturaGridexportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(XontVenturaGridexportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
