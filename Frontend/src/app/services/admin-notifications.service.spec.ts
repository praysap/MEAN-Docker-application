import { TestBed } from '@angular/core/testing';

import { AdminNotificationsService } from './admin-notifications.service';

describe('AdminNotificationsService', () => {
  let service: AdminNotificationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminNotificationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
