import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardFilterWrapperComponent } from './dashboard-filter-wrapper.component';

describe('DashboardFilterWrapperComponent', () => {
  let component: DashboardFilterWrapperComponent;
  let fixture: ComponentFixture<DashboardFilterWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DashboardFilterWrapperComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardFilterWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
