import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KibanaDataTableComponent } from './kibana-data-table.component';

describe('KibanaDataTableComponent', () => {
  let component: KibanaDataTableComponent;
  let fixture: ComponentFixture<KibanaDataTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KibanaDataTableComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KibanaDataTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
