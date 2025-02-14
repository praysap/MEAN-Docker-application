import { TestBed } from '@angular/core/testing';

import { NodeManagementService } from './node-management.service';

describe('NodeManagementService', () => {
  let service: NodeManagementService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NodeManagementService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
