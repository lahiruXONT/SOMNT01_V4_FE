import { ComponentFixture, TestBed } from '@angular/core/testing';

import { XontVenturaGridloaderComponent } from './xont-ventura-gridloader.component';

describe('XontVenturaGridloaderComponent', () => {
  let component: XontVenturaGridloaderComponent;
  let fixture: ComponentFixture<XontVenturaGridloaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [XontVenturaGridloaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(XontVenturaGridloaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
