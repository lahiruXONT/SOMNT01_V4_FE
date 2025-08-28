import { ComponentFixture, TestBed } from '@angular/core/testing';

import { XontVenturaCollapsibleComponent } from './xont-ventura-collapsible.component';

describe('XontVenturaCollapsibleComponent', () => {
  let component: XontVenturaCollapsibleComponent;
  let fixture: ComponentFixture<XontVenturaCollapsibleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [XontVenturaCollapsibleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(XontVenturaCollapsibleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
