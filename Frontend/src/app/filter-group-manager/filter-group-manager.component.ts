import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { GroupedFilter, FilterGroupDefinition, FilterSeparator, FilterGroupState } from '../filter.model';
import { FilterRow, FilterField, FilterBuilderOutput } from '../filter-builder/filter-builder.model';

/**
 * Filter Group Manager Component
 * 
 * Manages Kibana-style multi-clause grouping:
 * - Explicit grouping via UI (OR/AND groups)
 * - Implicit grouping (top-level AND by default)
 * - UI separators between filter pills
 * - Click-order dependent grouping behavior
 */
@Component({
  selector: 'app-filter-group-manager',
  templateUrl: './filter-group-manager.component.html',
  styleUrls: ['./filter-group-manager.component.scss']
})
export class FilterGroupManagerComponent implements OnInit, OnChanges {
  @Input() filters: GroupedFilter[] = [];
  @Input() groups: FilterGroupDefinition[] = [];
  @Input() customLabel?: string;
  @Input() availableFields: FilterField[] = [];
  
  @Output() groupsChanged = new EventEmitter<FilterGroupDefinition[]>();
  @Output() filterRemoved = new EventEmitter<number>();
  @Output() filterEdit = new EventEmitter<number>();
  @Output() filtersChanged = new EventEmitter<FilterGroupState>();
  @Output() addFilter = new EventEmitter<{ index: number; logic: 'AND' | 'OR' }>();
  @Output() filterBuilderApplied = new EventEmitter<FilterBuilderOutput>();
  @Output() filterBuilderCancelled = new EventEmitter<void>();

  // Selection state for group creation
  selectedIndices: number[] = [];
  lastClickedIndex: number | null = null;

  // Computed separators between filters
  separators: FilterSeparator[] = [];

  // Filter builder mode
  showFilterBuilder: boolean = false;
  filterBuilderRows: FilterRow[] = [];

  constructor() {}

  ngOnInit(): void {
    this.calculateSeparators();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filters'] || changes['groups']) {
      this.calculateSeparators();
    }
  }

  // ============================================================================
  // Group Management
  // ============================================================================

  /**
   * Creates a new group from selected filters
   * This implements Kibana's click-order dependent grouping behavior
   */
  createGroupFromSelection(type: 'AND' | 'OR'): void {
    if (this.selectedIndices.length < 2) {
      return;
    }

    // Sort indices to ensure proper order
    const sortedIndices = [...this.selectedIndices].sort((a, b) => a - b);
    
    // Check if indices are contiguous
    const isContiguous = sortedIndices.every((idx, i) => {
      if (i === 0) return true;
      return idx === sortedIndices[i - 1] + 1;
    });

    if (!isContiguous) {
      console.warn('Cannot create group with non-contiguous filters');
      return;
    }

    // Generate unique group ID
    const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create new group
    const newGroup: FilterGroupDefinition = {
      id: groupId,
      type,
      filterIndices: sortedIndices
    };

    // Remove any existing groups that overlap with these indices
    const filteredGroups = this.groups.filter(g => {
      return !sortedIndices.some(idx => g.filterIndices.includes(idx));
    });

    // Add new group
    const updatedGroups = [...filteredGroups, newGroup];

    // Update filter metadata
    this.updateFilterMetadata(sortedIndices, groupId, type);

    // Emit changes
    this.groupsChanged.emit(updatedGroups);
    this.emitFilterState();

    // Clear selection
    this.selectedIndices = [];
    this.lastClickedIndex = null;
  }

  /**
   * Removes a group and ungroups its filters
   */
  removeGroup(groupId: string): void {
    const group = this.groups.find(g => g.id === groupId);
    if (!group) return;

    // Clear metadata for filters in this group
    group.filterIndices.forEach(idx => {
      if (this.filters[idx]) {
        this.filters[idx].groupMeta = undefined;
      }
    });

    // Remove group
    const updatedGroups = this.groups.filter(g => g.id !== groupId);
    this.groupsChanged.emit(updatedGroups);
    this.emitFilterState();
    this.calculateSeparators();
  }

  /**
   * Creates an implicit group when clicking OR/AND button next to a filter
   * Kibana behavior: clicking OR next to filter B creates group (B OR next_filter)
   */
  createImplicitGroup(filterIndex: number, type: 'AND' | 'OR'): void {
    // Check if there's a next filter to group with
    if (filterIndex >= this.filters.length - 1) {
      // No next filter, just set selection for future group
      this.selectedIndices = [filterIndex];
      this.lastClickedIndex = filterIndex;
      return;
    }

    // Create group with current and next filter
    this.selectedIndices = [filterIndex, filterIndex + 1];
    this.createGroupFromSelection(type);
  }

  // ============================================================================
  // Filter Selection
  // ============================================================================

  /**
   * Handles filter click for selection
   * Supports Ctrl/Cmd click for multi-select and Shift for range select
   */
  selectFilter(index: number, event?: MouseEvent): void {
    if (event) {
      if (event.shiftKey && this.lastClickedIndex !== null) {
        // Range selection
        const start = Math.min(this.lastClickedIndex, index);
        const end = Math.max(this.lastClickedIndex, index);
        this.selectedIndices = Array.from(
          { length: end - start + 1 },
          (_, i) => start + i
        );
      } else if (event.ctrlKey || event.metaKey) {
        // Toggle selection
        const pos = this.selectedIndices.indexOf(index);
        if (pos > -1) {
          this.selectedIndices.splice(pos, 1);
        } else {
          this.selectedIndices.push(index);
        }
      } else {
        // Single selection
        this.selectedIndices = [index];
      }
    } else {
      // Single selection without event
      this.selectedIndices = [index];
    }

    this.lastClickedIndex = index;
  }

  /**
   * Checks if a filter is selected
   */
  isSelected(index: number): boolean {
    return this.selectedIndices.includes(index);
  }

  /**
   * Clears all selections
   */
  clearSelection(): void {
    this.selectedIndices = [];
    this.lastClickedIndex = null;
  }

  // ============================================================================
  // Separator Calculation
  // ============================================================================

  /**
   * Calculates UI separators between filters
   * This determines the visual AND/OR connectors between pills
   */
  calculateSeparators(): void {
    this.separators = [];

    if (this.filters.length <= 1) {
      return;
    }

    for (let i = 1; i < this.filters.length; i++) {
      const separator = this.determineSeparator(i);
      this.separators.push(separator);
    }
  }

  /**
   * Determines the separator type between filter[i-1] and filter[i]
   */
  private determineSeparator(index: number): FilterSeparator {
    const prevFilter = this.filters[index - 1];
    const currFilter = this.filters[index];

    // Check if both filters are in the same group
    const prevGroupId = prevFilter.groupMeta?.groupId;
    const currGroupId = currFilter.groupMeta?.groupId;

    if (prevGroupId && currGroupId && prevGroupId === currGroupId) {
      // Same group - use group's type
      const group = this.groups.find(g => g.id === prevGroupId);
      return {
        position: 'before',
        index,
        type: group?.type || 'AND',
        isGroupBoundary: false,
        groupId: prevGroupId
      };
    }

    // Different groups or ungrouped - check for group boundary
    const isGroupBoundary = !!(prevGroupId || currGroupId);

    // Default to AND for top-level ungrouped filters
    // Use the filter's logic property if available
    const separatorType = currFilter.logic || 'AND';

    return {
      position: 'before',
      index,
      type: separatorType,
      isGroupBoundary,
      groupId: currGroupId
    };
  }

  /**
   * Gets the separator for a specific position
   */
  getSeparator(index: number): FilterSeparator | undefined {
    return this.separators.find(s => s.index === index);
  }

  /**
   * Gets the separator type (AND/OR) for display
   */
  getSeparatorType(index: number): 'AND' | 'OR' {
    const separator = this.getSeparator(index);
    return separator?.type || 'AND';
  }

  /**
   * Checks if position is a group boundary
   */
  isGroupBoundary(prevIndex: number, currIndex: number): boolean {
    const separator = this.getSeparator(currIndex);
    return separator?.isGroupBoundary || false;
  }

  // ============================================================================
  // Group Status Helpers
  // ============================================================================

  /**
   * Checks if filter at index is in any group
   */
  isInGroup(index: number): boolean {
    return !!this.filters[index]?.groupMeta?.groupId;
  }

  /**
   * Checks if filter at index is the start of a group
   */
  isGroupStart(index: number): boolean {
    return !!this.filters[index]?.groupMeta?.isGroupStart;
  }

  /**
   * Checks if filter at index is the end of a group
   */
  isGroupEnd(index: number): boolean {
    return !!this.filters[index]?.groupMeta?.isGroupEnd;
  }

  /**
   * Gets the group for a filter
   */
  getFilterGroup(index: number): FilterGroupDefinition | undefined {
    const groupId = this.filters[index]?.groupMeta?.groupId;
    if (!groupId) return undefined;
    return this.groups.find(g => g.id === groupId);
  }

  /**
   * Gets the CSS grid column span for a group indicator
   */
  getGroupColumnSpan(group: FilterGroupDefinition): string {
    const start = Math.min(...group.filterIndices);
    const end = Math.max(...group.filterIndices);
    const span = end - start + 1;
    return `${start + 1} / span ${span}`;
  }

  // ============================================================================
  // Filter Operations
  // ============================================================================

  /**
   * Removes a filter and updates groups
   */
  removeFilter(index: number): void {
    // Check if filter is in a group
    const groupId = this.filters[index]?.groupMeta?.groupId;
    
    if (groupId) {
      // Update the group to remove this filter
      const group = this.groups.find(g => g.id === groupId);
      if (group) {
        const updatedIndices = group.filterIndices
          .filter(idx => idx !== index)
          .map(idx => idx > index ? idx - 1 : idx); // Adjust indices

        if (updatedIndices.length < 2) {
          // Group has less than 2 filters, remove it
          this.removeGroup(groupId);
        } else {
          // Update group
          const updatedGroup = { ...group, filterIndices: updatedIndices };
          const updatedGroups = this.groups.map(g => 
            g.id === groupId ? updatedGroup : g
          );
          this.groupsChanged.emit(updatedGroups);
        }
      }
    }

    // Emit filter removal
    this.filterRemoved.emit(index);
    this.clearSelection();
  }

  /**
   * Handler for remove button click in template
   */
  onRemoveFilter(index: number): void {
    this.removeFilter(index);
  }

  /**
   * Handler for add filter button click
   * Emits event to parent to add new filter
   */
  onAddFilter(index: number, logic: 'AND' | 'OR'): void {
    this.addFilter.emit({ index, logic });
  }

  /**
   * Initiates edit of a filter
   */
  editFilter(index: number): void {
    this.filterEdit.emit(index);
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  /**
   * Updates filter metadata for grouped filters
   */
  private updateFilterMetadata(
    indices: number[],
    groupId: string,
    groupType: 'AND' | 'OR'
  ): void {
    indices.forEach((idx, i) => {
      if (this.filters[idx]) {
        this.filters[idx].groupMeta = {
          groupId,
          groupType,
          isGroupStart: i === 0,
          isGroupEnd: i === indices.length - 1
        };
      }
    });
  }

  /**
   * Emits complete filter state
   */
  private emitFilterState(): void {
    const state: FilterGroupState = {
      filters: this.filters,
      groups: this.groups,
      customLabel: this.customLabel
    };
    this.filtersChanged.emit(state);
  }

  // ============================================================================
  // Preview Generation
  // ============================================================================

  /**
   * Builds a human-readable preview of the grouped filters
   */
  buildPreview(): string {
    if (this.filters.length === 0) {
      return '';
    }

    const parts: string[] = [];
    
    this.filters.forEach((filter, index) => {
      if (index > 0) {
        const separator = this.getSeparator(index);
        parts.push(separator?.type || 'AND');
      }

      let filterText = `${filter.field}: ${filter.value || '-'}`;
      
      // Add parentheses for group boundaries
      if (this.isGroupStart(index)) {
        filterText = '(' + filterText;
      }
      if (this.isGroupEnd(index)) {
        filterText = filterText + ')';
      }

      parts.push(filterText);
    });

    return parts.join(' ');
  }

  // ============================================================================
  // Filter Builder Integration
  // ============================================================================

  /**
   * Opens the filter builder
   */
  openFilterBuilder(): void {
    this.showFilterBuilder = true;
    // Convert existing filters to filter builder rows
    this.filterBuilderRows = this.convertFiltersToRows(this.filters);
  }

  /**
   * Closes the filter builder
   */
  closeFilterBuilder(): void {
    this.showFilterBuilder = false;
    this.filterBuilderRows = [];
  }

  /**
   * Converts GroupedFilter array to FilterRow array
   */
  private convertFiltersToRows(filters: GroupedFilter[]): FilterRow[] {
    return filters.map((filter, index) => ({
      id: `filter_${index}_${Date.now()}`,
      clause: {
        id: `clause_${index}_${Date.now()}`,
        field: filter.field || '',
        operator: (filter.operator as any) || 'is',
        value: filter.value,
        values: Array.isArray(filter.value) ? filter.value : undefined
      },
      logicOperator: index > 0 ? (filter.logic || 'AND') : undefined,
      level: 0
    }));
  }

  /**
   * Handles filter builder apply event
   */
  onFilterBuilderApplied(output: FilterBuilderOutput): void {
    this.filterBuilderApplied.emit(output);
    this.closeFilterBuilder();
  }

  /**
   * Handles filter builder cancel event
   */
  onFilterBuilderCancelled(): void {
    this.filterBuilderCancelled.emit();
    this.closeFilterBuilder();
  }

  /**
   * Handles filter builder rows change
   */
  onFilterBuilderRowsChanged(rows: FilterRow[]): void {
    this.filterBuilderRows = rows;
  }
}
