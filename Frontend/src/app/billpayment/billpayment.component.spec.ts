import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillpaymentComponent } from './billpayment.component';

describe('BillpaymentComponent', () => {
  let component: BillpaymentComponent;
  let fixture: ComponentFixture<BillpaymentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BillpaymentComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BillpaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
