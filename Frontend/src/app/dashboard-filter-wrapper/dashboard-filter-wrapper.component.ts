import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
// import { RestService } from '../../services/rest.service';
import { environment } from 'src/environments/environment';
import { Subscription } from 'rxjs';
import { FilterGroup, FilterGroupState, GroupedFilter, FilterGroupDefinition } from '../filter.model';
import { buildEsQueryFromGroupedFilters, buildGroupedAST, groupedAstToEsQuery } from '../utils/kibana-filter-utils';
import { FilterField, FilterBuilderOutput, FilterRow } from '../filter-builder/filter-builder.model';

@Component({
  selector: 'app-dashboard-filter-wrapper',
  templateUrl: './dashboard-filter-wrapper.component.html',
  styleUrls: ['./dashboard-filter-wrapper.component.scss']
})
export class DashboardFilterWrapperComponent implements OnInit, OnDestroy {
  @Input() dashboardData: any = { chartAllData: [], BarData: [] };
  @Output() dataUpdated = new EventEmitter<any>();

  showFilterBar: boolean = false; // Controls Filter Group Manager overlay
  showKibanaFilterBar: boolean = false; // Controls Kibana Filter Bar for creating filters
  showFilterGroupManager: boolean = true; // Default visible when filters exist
  activeFilters: FilterGroupState | null = null;
  showQueryPreview: boolean = false;
  
  // Available fields for filter builder
  availableFields: FilterField[] = [
    { name: 'timestamp', label: 'Timestamp', type: 'date' },
    { name: 'source.ip', label: 'Source IP', type: 'ip' },
    { name: 'destination.ip', label: 'Destination IP', type: 'ip' },
    { name: 'source.port', label: 'Source Port', type: 'number' },
    { name: 'destination.port', label: 'Destination Port', type: 'number' },
    { name: 'protocol', label: 'Protocol', type: 'string' },
    { name: 'event.action', label: 'Event Action', type: 'string' },
    { name: 'event.category', label: 'Event Category', type: 'string' },
    { name: 'event.severity', label: 'Severity', type: 'number' },
    { name: 'message', label: 'Message', type: 'string' },
    { name: 'host.name', label: 'Host Name', type: 'string' },
    { name: 'user.name', label: 'User Name', type: 'string' },
    { name: 'process.name', label: 'Process Name', type: 'string' },
    { name: 'file.path', label: 'File Path', type: 'string' },
    { name: 'network.transport', label: 'Network Transport', type: 'string' },
    { name: 'url.original', label: 'URL', type: 'string' },
    { name: 'http.request.method', label: 'HTTP Method', type: 'string' },
    { name: 'http.response.status_code', label: 'HTTP Status', type: 'number' }
  ];
  
  snort !: Subscription;
  bin !: Subscription;
  binary !: Subscription;

  constructor() { }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(filters?: FilterGroup): void {
    // Clear existing data
    this.dashboardData.chartAllData = [];
    this.dashboardData.BarData = [];
    
    // Note: getSnortAlert, getBinClass, and getBinary methods are removed
    // Dashboard data should be loaded via Elasticsearch queries instead
    this.emitDataUpdate();
  }

  // Removed getSnortAlert, getBinClass, and getBinary methods
  // Dashboard data should be loaded via Elasticsearch queries instead

  emitDataUpdate(): void {
    this.dataUpdated.emit({
      chartAllData: [...this.dashboardData.chartAllData],
      BarData: [...this.dashboardData.BarData]
    });
  }

  toggleFilterBar(): void {
    // Toggle Filter Group Manager overlay when clicking Add filter
    this.showFilterBar = !this.showFilterBar;
  }

  toggleKibanaFilterBar(): void {
    // Toggle Kibana Filter Bar for creating new filters
    this.showKibanaFilterBar = !this.showKibanaFilterBar;
  }

  toggleFilterGroupManager(): void {
    this.showFilterGroupManager = !this.showFilterGroupManager;
  }

  onCloseKibanaFilterBar(): void {
    this.showKibanaFilterBar = false;
  }

  onFilterGroupChanged(event: FilterGroupState): void {
    this.activeFilters = event;
    this.regenerateQueryDSL();
  }

  onFiltersApplied(filterGroup: FilterGroup): void {
    // Convert to FilterGroupState with empty groups
    this.activeFilters = {
      filters: filterGroup.filters as GroupedFilter[],
      groups: [],
      customLabel: filterGroup.customLabel,
      queryDSL: filterGroup.queryDSL
    };
    this.showFilterBar = false;
    // Open Filter Group Manager when filters are applied
    this.showFilterGroupManager = true;
    this.loadDashboardData(this.activeFilters);
  }

  onGroupsChanged(groups: FilterGroupDefinition[]): void {
    if (this.activeFilters) {
      this.activeFilters.groups = groups;
      this.regenerateQueryDSL();
      this.loadDashboardData(this.activeFilters);
    }
  }

  toggleQueryPreview(): void {
    this.showQueryPreview = !this.showQueryPreview;
  }

  regenerateQueryDSL(): void {
    if (!this.activeFilters) return;
    
    // Use enhanced AST builder with groups
    const queryDSL = buildEsQueryFromGroupedFilters(
      this.activeFilters.filters,
      this.activeFilters.groups || []
    );
    
    this.activeFilters.queryDSL = queryDSL;
  }

  onCloseFilterBar(): void {
    this.showFilterBar = false;
  }

  clearFilters(): void {
    this.activeFilters = null;
    this.loadDashboardData();
  }

  removeFilter(index: number): void {
    if (!this.activeFilters || !this.activeFilters.filters) {
      return;
    }

    // Check if filter is in a group and update groups accordingly
    const filter = this.activeFilters.filters[index];
    if (filter?.groupMeta?.groupId) {
      const groupId = filter.groupMeta.groupId;
      const groupIndex = this.activeFilters.groups?.findIndex(g => g.id === groupId);
      
      if (groupIndex !== undefined && groupIndex >= 0 && this.activeFilters.groups) {
        const group = this.activeFilters.groups[groupIndex];
        const updatedIndices = group.filterIndices
          .filter(idx => idx !== index)
          .map(idx => idx > index ? idx - 1 : idx);
        
        if (updatedIndices.length < 2) {
          // Remove group if less than 2 filters
          this.activeFilters.groups.splice(groupIndex, 1);
          // Clear group metadata from remaining filter
          updatedIndices.forEach(idx => {
            if (this.activeFilters && this.activeFilters.filters[idx]) {
              this.activeFilters.filters[idx].groupMeta = undefined;
            }
          });
        } else {
          // Update group
          group.filterIndices = updatedIndices;
        }
      }
    }

    // Remove the filter at the specified index
    this.activeFilters.filters.splice(index, 1);

    // If no filters remain, clear all
    if (this.activeFilters.filters.length === 0) {
      this.clearFilters();
      return;
    }

    // Regenerate Query DSL with groups
    this.regenerateQueryDSL();

    // Reload data with updated filters
    this.loadDashboardData(this.activeFilters);
  }

  generateQueryDSLFromFilters(): void {
    if (!this.activeFilters || !this.activeFilters.filters) {
      return;
    }

    const mustQueries: any[] = [];
    const shouldQueries: any[] = [];

    this.activeFilters.filters.forEach((filter: any, index: number) => {
      if (!filter.field || !filter.operator) {
        return;
      }

      let query: any = {};
      const isKeyword = filter.field.endsWith('.keyword');

      // Normalize operator to handle various formats
      const normalizedOperator = this.normalizeOperator(filter.operator);
      
      switch (normalizedOperator) {
        case 'is':
          // Field exactly matches a single value
          if (isKeyword) {
            query = { term: { [filter.field]: filter.value } };
          } else {
            query = { match: { [filter.field]: filter.value } };
          }
          break;
        case 'is_not':
          // Field does not exactly match a single value
          if (isKeyword) {
            query = { bool: { must_not: [{ term: { [filter.field]: filter.value } }] } };
          } else {
            query = { bool: { must_not: [{ match: { [filter.field]: filter.value } }] } };
          }
          break;
        case 'is_one_of':
          // Field matches any of multiple values
          const values = Array.isArray(filter.value) 
            ? filter.value 
            : (typeof filter.value === 'string' ? filter.value.split(',').map((v: string) => v.trim()) : [filter.value]);
          query = { terms: { [filter.field]: values } };
          break;
        case 'is_not_one_of':
          // Field matches none of multiple values
          const notValues = Array.isArray(filter.value) 
            ? filter.value 
            : (typeof filter.value === 'string' ? filter.value.split(',').map((v: string) => v.trim()) : [filter.value]);
          query = { bool: { must_not: [{ terms: { [filter.field]: notValues } }] } };
          break;
        case 'exists':
          // Field has any value (is present)
          query = { exists: { field: filter.field } };
          break;
        case 'does_not_exist':
          // Field is missing or null
          query = { bool: { must_not: [{ exists: { field: filter.field } }] } };
          break;
        default:
          console.warn(`Unknown filter operator: ${filter.operator}`);
          return;
      }

      if (index === 0) {
        mustQueries.push(query);
      } else {
        const logic = filter.logic || 'AND';
        if (logic === 'AND') {
          mustQueries.push(query);
        } else {
          shouldQueries.push(query);
        }
      }
    });

    const boolQuery: any = {};
    if (mustQueries.length > 0) {
      boolQuery.must = mustQueries;
    }
    if (shouldQueries.length > 0) {
      boolQuery.should = shouldQueries;
      boolQuery.minimum_should_match = 1;
    }

    this.activeFilters.queryDSL = {
      query: {
        bool: boolQuery
      }
    };
  }

  normalizeOperator(operator: string): string {
    // Map various operator formats to standard format
    const operatorMap: { [key: string]: string } = {
      'is': 'is',
      'isNot': 'is_not',
      'is_not': 'is_not',
      'terms': 'is_one_of',
      'is_one_of': 'is_one_of',
      'notTerms': 'is_not_one_of',
      'is_not_one_of': 'is_not_one_of',
      'exists': 'exists',
      'notExists': 'does_not_exist',
      'does_not_exist': 'does_not_exist'
    };
    return operatorMap[operator] || operator;
  }

  getOperatorLabel(operator: string): string {
    const normalizedOperator = this.normalizeOperator(operator);
    const operatorMap: { [key: string]: string } = {
      'is': 'is',
      'is_not': 'is not',
      'is_one_of': 'is one of',
      'is_not_one_of': 'is not one of',
      'exists': 'exists',
      'does_not_exist': 'does not exist'
    };
    return operatorMap[normalizedOperator] || operator;
  }

  formatFilterValue(value: any): string {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return String(value);
  }

  onDataTableLoaded(data: any): void {
    // Handle data table loaded event if needed
    console.log('Data table loaded:', data);
  }

  /**
   * Handles filter builder output when filters are applied
   */
  onFilterBuilderApplied(output: FilterBuilderOutput): void {
    // Convert FilterBuilderOutput to FilterGroupState
    const groupedFilters: GroupedFilter[] = output.rows.map((row, index) => ({
      field: row.clause.field,
      operator: row.clause.operator,
      value: row.clause.values || row.clause.value,
      logic: row.logicOperator,
      minValue: row.clause.minValue,
      maxValue: row.clause.maxValue,
      minOperator: row.clause.minOperator,
      maxOperator: row.clause.maxOperator
    }));

    this.activeFilters = {
      filters: groupedFilters,
      groups: [], // Groups are represented in the AST, not as explicit groups
      queryDSL: output.queryDSL
    };

    this.regenerateQueryDSL();
    this.loadDashboardData(this.activeFilters);
    this.onCloseFilterBar();
  }

  ngOnDestroy(): void {
    if (this.snort) {
      this.snort.unsubscribe();
    }
    if (this.bin) {
      this.bin.unsubscribe();
    }
    if (this.binary) {
      this.binary.unsubscribe();
    }
  }
}




