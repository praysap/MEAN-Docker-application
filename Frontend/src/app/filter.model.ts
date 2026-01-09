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










