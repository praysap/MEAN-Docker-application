import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
// import { RestService } from '../../services/rest.service';
import { environment } from 'src/environments/environment';
import { Subscription } from 'rxjs';
import { FilterGroup } from '../filter.model';

@Component({
  selector: 'app-dashboard-filter-wrapper',
  templateUrl: './dashboard-filter-wrapper.component.html',
  styleUrls: ['./dashboard-filter-wrapper.component.scss']
})
export class DashboardFilterWrapperComponent implements OnInit, OnDestroy {
  @Input() dashboardData: any = { chartAllData: [], BarData: [] };
  @Output() dataUpdated = new EventEmitter<any>();

  showFilterBar: boolean = false;
  activeFilters: FilterGroup | null = null;
  
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
    this.showFilterBar = !this.showFilterBar;
  }

  onFiltersApplied(filterGroup: FilterGroup): void {
    this.activeFilters = filterGroup;
    this.showFilterBar = false;
    this.loadDashboardData(filterGroup);
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

    // Remove the filter at the specified index
    this.activeFilters.filters.splice(index, 1);

    // If no filters remain, clear all
    if (this.activeFilters.filters.length === 0) {
      this.clearFilters();
      return;
    }

    // Regenerate Query DSL
    this.generateQueryDSLFromFilters();

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




