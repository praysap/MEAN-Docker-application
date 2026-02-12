import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilterGroupManagerComponent } from './filter-group-manager.component';
import { GroupedFilter, FilterGroupDefinition } from '../filter.model';

describe('FilterGroupManagerComponent', () => {
  let component: FilterGroupManagerComponent;
  let fixture: ComponentFixture<FilterGroupManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FilterGroupManagerComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FilterGroupManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Group Management', () => {
    it('should create an OR group from selected filters', () => {
      component.filters = [
        { field: 'status', operator: 'is', value: 'active' },
        { field: 'status', operator: 'is', value: 'pending' },
        { field: 'status', operator: 'is', value: 'inactive' }
      ];
      component.selectedIndices = [0, 1];
      
      spyOn(component.groupsChanged, 'emit');
      component.createGroupFromSelection('OR');

      expect(component.groupsChanged.emit).toHaveBeenCalled();
      expect(component.groups.length).toBe(1);
      expect(component.groups[0].type).toBe('OR');
    });

    it('should not create group with non-contiguous filters', () => {
      component.filters = [
        { field: 'A', operator: 'is', value: '1' },
        { field: 'B', operator: 'is', value: '2' },
        { field: 'C', operator: 'is', value: '3' }
      ];
      component.selectedIndices = [0, 2]; // Non-contiguous
      
      spyOn(console, 'warn');
      component.createGroupFromSelection('OR');

      expect(console.warn).toHaveBeenCalledWith('Cannot create group with non-contiguous filters');
    });

    it('should remove group and clear filter metadata', () => {
      const groupId = 'test-group';
      component.groups = [{
        id: groupId,
        type: 'OR',
        filterIndices: [0, 1]
      }];
      component.filters = [
        { field: 'A', operator: 'is', value: '1', groupMeta: { groupId, groupType: 'OR', isGroupStart: true } },
        { field: 'B', operator: 'is', value: '2', groupMeta: { groupId, groupType: 'OR', isGroupEnd: true } }
      ];

      spyOn(component.groupsChanged, 'emit');
      component.removeGroup(groupId);

      expect(component.groupsChanged.emit).toHaveBeenCalledWith([]);
      expect(component.filters[0].groupMeta).toBeUndefined();
      expect(component.filters[1].groupMeta).toBeUndefined();
    });
  });

  describe('Separator Calculation', () => {
    it('should calculate AND separator for ungrouped filters', () => {
      component.filters = [
        { field: 'A', operator: 'is', value: '1' },
        { field: 'B', operator: 'is', value: '2', logic: 'AND' }
      ];
      component.calculateSeparators();

      expect(component.separators.length).toBe(1);
      expect(component.separators[0].type).toBe('AND');
      expect(component.separators[0].isGroupBoundary).toBe(false);
    });

    it('should calculate OR separator for grouped filters', () => {
      component.groups = [{
        id: 'group-1',
        type: 'OR',
        filterIndices: [0, 1]
      }];
      component.filters = [
        { field: 'A', operator: 'is', value: '1', groupMeta: { groupId: 'group-1', groupType: 'OR', isGroupStart: true } },
        { field: 'B', operator: 'is', value: '2', groupMeta: { groupId: 'group-1', groupType: 'OR', isGroupEnd: true } }
      ];
      component.calculateSeparators();

      expect(component.separators[0].type).toBe('OR');
    });

    it('should mark group boundaries correctly', () => {
      component.groups = [{
        id: 'group-1',
        type: 'OR',
        filterIndices: [1, 2]
      }];
      component.filters = [
        { field: 'A', operator: 'is', value: '1' },
        { field: 'B', operator: 'is', value: '2', groupMeta: { groupId: 'group-1', groupType: 'OR', isGroupStart: true } },
        { field: 'C', operator: 'is', value: '3', groupMeta: { groupId: 'group-1', groupType: 'OR', isGroupEnd: true } }
      ];
      component.calculateSeparators();

      // Between A and B should be a group boundary
      expect(component.separators[0].isGroupBoundary).toBe(true);
      // Between B and C should not be a boundary (same group)
      expect(component.separators[1].isGroupBoundary).toBe(false);
    });
  });

  describe('Selection', () => {
    it('should select single filter', () => {
      component.selectFilter(0);
      expect(component.isSelected(0)).toBe(true);
      expect(component.selectedIndices).toEqual([0]);
    });

    it('should toggle selection on Ctrl+click', () => {
      const mockEvent = { ctrlKey: true } as MouseEvent;
      component.selectFilter(0);
      component.selectFilter(1, mockEvent);
      
      expect(component.selectedIndices).toContain(0);
      expect(component.selectedIndices).toContain(1);
    });

    it('should range select on Shift+click', () => {
      component.filters = [
        { field: 'A', operator: 'is', value: '1' },
        { field: 'B', operator: 'is', value: '2' },
        { field: 'C', operator: 'is', value: '3' },
        { field: 'D', operator: 'is', value: '4' }
      ];
      
      component.selectFilter(0);
      const mockEvent = { shiftKey: true } as MouseEvent;
      component.selectFilter(3, mockEvent);
      
      expect(component.selectedIndices).toEqual([0, 1, 2, 3]);
    });
  });

  describe('Preview Generation', () => {
    it('should generate correct preview for simple filters', () => {
      component.filters = [
        { field: 'status', operator: 'is', value: 'active' },
        { field: 'type', operator: 'is', value: 'user', logic: 'AND' }
      ];
      component.calculateSeparators();
      
      const preview = component.buildPreview();
      expect(preview).toContain('status: active');
      expect(preview).toContain('AND');
      expect(preview).toContain('type: user');
    });

    it('should add parentheses for groups', () => {
      component.groups = [{
        id: 'group-1',
        type: 'OR',
        filterIndices: [0, 1]
      }];
      component.filters = [
        { field: 'A', operator: 'is', value: '1', groupMeta: { groupId: 'group-1', groupType: 'OR', isGroupStart: true } },
        { field: 'B', operator: 'is', value: '2', groupMeta: { groupId: 'group-1', groupType: 'OR', isGroupEnd: true } }
      ];

      const preview = component.buildPreview();
      expect(preview).toContain('(A: 1');
      expect(preview).toContain('B: 2)');
    });
  });

  describe('Group Status Helpers', () => {
    it('should correctly identify filters in groups', () => {
      component.filters = [
        { field: 'A', operator: 'is', value: '1' },
        { field: 'B', operator: 'is', value: '2', groupMeta: { groupId: 'g1', groupType: 'OR' } }
      ];

      expect(component.isInGroup(0)).toBe(false);
      expect(component.isInGroup(1)).toBe(true);
    });

    it('should correctly identify group start and end', () => {
      component.filters = [
        { field: 'A', operator: 'is', value: '1', groupMeta: { groupId: 'g1', groupType: 'OR', isGroupStart: true } },
        { field: 'B', operator: 'is', value: '2', groupMeta: { groupId: 'g1', groupType: 'OR', isGroupEnd: true } }
      ];

      expect(component.isGroupStart(0)).toBe(true);
      expect(component.isGroupEnd(0)).toBe(false);
      expect(component.isGroupStart(1)).toBe(false);
      expect(component.isGroupEnd(1)).toBe(true);
    });
  });
});
