import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KibanaFilterBarComponent } from './kibana-filter-bar.component';

describe('KibanaFilterBarComponent', () => {
  let component: KibanaFilterBarComponent;
  let fixture: ComponentFixture<KibanaFilterBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KibanaFilterBarComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KibanaFilterBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
