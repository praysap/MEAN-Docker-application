export interface Filter {
  field: string;
  operator: string;
  value?: any;
  logic?: 'AND' | 'OR'; // Logic operator before this filter
}

export interface FilterGroup {
  filters: Filter[];
  customLabel?: string;
  queryDSL?: any;
}

// ============================================================================
// NEW: Multi-Clause Grouping Interfaces (Kibana-style)
// ============================================================================

/**
 * Metadata for filters that are part of a group
 */
export interface FilterGroupMetadata {
  groupId?: string;
  groupType?: 'AND' | 'OR';
  isGroupStart?: boolean;
  isGroupEnd?: boolean;
  parentGroupId?: string;
}

/**
 * Extended filter with grouping metadata
 */
export interface GroupedFilter extends Filter {
  groupMeta?: FilterGroupMetadata;
  disabled?: boolean;
  negate?: boolean;
}

/**
 * Definition of a filter group
 */
export interface FilterGroupDefinition {
  id: string;
  type: 'AND' | 'OR';
  filterIndices: number[];
  parentGroupId?: string;
}

/**
 * Complete filter state with groups
 */
export interface FilterGroupState {
  filters: GroupedFilter[];
  groups: FilterGroupDefinition[];
  customLabel?: string;
  queryDSL?: any;
}

/**
 * UI Separator between filters
 */
export interface FilterSeparator {
  position: 'before' | 'after';
  index: number;
  type: 'AND' | 'OR';
  isGroupBoundary: boolean;
  groupId?: string;
}










