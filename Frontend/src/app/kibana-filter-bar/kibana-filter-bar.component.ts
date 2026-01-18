import { Component, OnInit, OnChanges, SimpleChanges, Input, Output, EventEmitter } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Filter, FilterGroup } from '../filter.model';
import { FilterService } from '../services/filter.service';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';

@Component({
  selector: 'app-kibana-filter-bar',
  templateUrl: './kibana-filter-bar.component.html',
  styleUrls: ['./kibana-filter-bar.component.scss']
})
export class KibanaFilterBarComponent implements OnInit, OnChanges {
  @Input() isVisible: boolean = false;
  @Output() filtersApplied = new EventEmitter<any>();
  @Output() closeFilterBar = new EventEmitter<void>();

  filterForm: FormGroup;
  availableFields: string[] = [];
  showQueryDSL: boolean = false;
  queryDSL: string = '';
  customLabel: string = '';
  previewText: string = '';
  previewHtml: SafeHtml = '';
  fieldValuesMap: { [key: string]: string[] } = {};
  loadingFieldValues: { [key: number]: boolean } = {};

// Kibana filter operators - using standard format for consistency
operators = [
  { label: 'is', value: 'is' },
  { label: 'is not', value: 'is_not' },
  { label: 'is one of', value: 'is_one_of' },
  { label: 'is not one of', value: 'is_not_one_of' },
  { label: 'exists', value: 'exists' },
  { label: 'does not exist', value: 'does_not_exist' },
  { label: 'range', value: 'range' },
  { label: 'prefix', value: 'prefix' },
  { label: 'wildcard', value: 'wildcard' },
  { label: 'query_string', value: 'query_string' },
];

// Range operators for min and max values
rangeOperators = [
  { label: 'Greater Than', value: 'gt' },
  { label: 'Greater Than/Equal To', value: 'gte' },
  { label: 'Less Than', value: 'lt' },
  { label: 'Less Than/Equal To', value: 'lte' },
];

// Get range operators for min (greater than options)
getMinRangeOperators() {
  return this.rangeOperators.filter(op => op.value === 'gt' || op.value === 'gte');
}

// Get range operators for max (less than options)
getMaxRangeOperators() {
  return this.rangeOperators.filter(op => op.value === 'lt' || op.value === 'lte');
}

  constructor(
    private fb: FormBuilder,
    private filterService: FilterService,
    private sanitizer: DomSanitizer
  ) {
    this.filterForm = this.fb.group({
      filters: this.fb.array([])
    });
    this.previewHtml = this.sanitizer.bypassSecurityTrustHtml('');
  }

  ngOnInit(): void {
    this.loadAvailableFields();
    if (this.filters.length === 0) {
      this.addFilter();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isVisible'] && changes['isVisible'].currentValue === true) {
      // Reset form when filter bar is opened
      if (this.filters.length === 0) {
        this.addFilter();
      }
    } else if (changes['isVisible'] && changes['isVisible'].currentValue === false) {
      // Optionally reset when closed
      // this.resetForm();
    }
  }

  get filters(): FormArray {
    return this.filterForm.get('filters') as FormArray;
  }

  loadAvailableFields(): void {
    this.filterService.getFields().subscribe(
      (fields: string[]) => {
        this.availableFields = fields;
      },
      (error) => {
        console.error('Error loading fields:', error);
        // Fallback fields if API fails - using web-l* index fields
        this.availableFields = [
          '@timestamp',
          '@version',
          '@version.keyword',
          'agent',
          'agent.keyword',
          'auth',
          'auth.keyword',
          'bytes',
          'bytes.keyword',
          'clientip',
          'clientip.keyword',
          'event.original',
          'event.original.keyword',
          'host.name',
          'host.name.keyword',
          'httpversion',
          'httpversion.keyword',
          'ident',
          'ident.keyword',
          'log.file.path',
          'log.file.path.keyword',
          'message',
          'message.keyword',
          'referrer',
          'referrer.keyword',
          'request',
          'request.keyword',
          'response',
          'response.keyword',
          'tags',
          'tags.keyword',
          'timestamp',
          'timestamp.keyword',
          'verb',
          'verb.keyword',
        ];
      }
    );
  }

  isKeywordField(field: string): boolean {
    return field.endsWith('.keyword');
  }

  loadFieldValues(index: number, field: string, searchTerm?: string): void {
    if (!this.isKeywordField(field)) {
      return;
    }

    this.loadingFieldValues[index] = true;
    this.filterService.getFieldValues(field, searchTerm).subscribe(
      (values: string[]) => {
        this.fieldValuesMap[`${index}_${field}`] = values;
        this.loadingFieldValues[index] = false;
      },
      (error) => {
        console.error('Error loading field values:', error);
        this.fieldValuesMap[`${index}_${field}`] = [];
        this.loadingFieldValues[index] = false;
      }
    );
  }

  getFieldValues(index: number, field: string): string[] {
    return this.fieldValuesMap[`${index}_${field}`] || [];
  }

  addFilter(logic: 'AND' | 'OR' = 'AND'): void {
    const filterGroup = this.fb.group({
      field: ['', Validators.required],
      operator: ['', Validators.required],
      value: [''],
      logic: [logic],
      // Range-specific fields
      minOperator: ['gt'],
      minValue: [''],
      maxOperator: ['lt'],
      maxValue: ['']
    });

    this.filters.push(filterGroup);
    this.updatePreview();
  }

  removeFilter(index: number): void {
    this.filters.removeAt(index);
    this.updatePreview();
  }

  addFilterWithLogic(index: number, logic: 'AND' | 'OR'): void {
    this.addFilter(logic);
  }

  onFieldChange(index: number): void {
    const filter = this.filters.at(index);
    const operator = filter.get('operator')?.value;
    const field = filter.get('field')?.value;
    
    // Reset value when field changes
    filter.get('value')?.setValue('');
    
    if (field && !operator) {
      filter.get('operator')?.setValue('');
    }
    
    // Load field values if it's a keyword field and operator is selected
    // This enables real-time dropdown population from Elasticsearch
    const normalizedOperator = this.normalizeOperator(operator);
    if (field && operator && this.isKeywordField(field) && 
        normalizedOperator !== 'exists' && normalizedOperator !== 'does_not_exist') {
      this.loadFieldValues(index, field);
    }
    
    this.updatePreview();
  }

  onOperatorChange(index: number): void {
    const filter = this.filters.at(index);
    const operator = filter.get('operator')?.value;
    const field = filter.get('field')?.value;
    
    // Normalize operator values for consistency
    const normalizedOperator = this.normalizeOperator(operator);
    
    if (normalizedOperator === 'exists' || normalizedOperator === 'does_not_exist' || 
        normalizedOperator === 'notExists') {
      filter.get('value')?.setValue('');
    } else if (normalizedOperator === 'range') {
      // Reset range values when switching to range
      filter.get('value')?.setValue('');
      filter.get('minOperator')?.setValue('gt');
      filter.get('minValue')?.setValue('');
      filter.get('maxOperator')?.setValue('lt');
      filter.get('maxValue')?.setValue('');
    } else if (normalizedOperator === 'prefix') {
      // Reset value when switching to prefix
      filter.get('value')?.setValue('');
    } else if (normalizedOperator === 'wildcard') {
      // Reset value when switching to wildcard
      filter.get('value')?.setValue('');
    } else if (normalizedOperator === 'query_string') {
      // Reset value when switching to query_string
      filter.get('value')?.setValue('');
    } else if (field && this.isKeywordField(field)) {
      // Load field values when operator is selected for keyword field
      // This enables real-time dropdown population from Elasticsearch
      this.loadFieldValues(index, field);
    }
    
    this.updatePreview();
  }

  /**
   * Builds Kibana 8.18.1 style preview with sequential nesting behavior.
   * This implements right-associative nesting where alternating operators create nested groups.
   * 
   * Examples:
   * - A OR B OR C → "A OR B OR C"
   * - A AND B AND C → "A AND B AND C"
   * - A OR B AND C OR D → "A OR (B AND (C OR D))"
   * - A AND B OR C AND D → "A AND (B OR (C AND D))"
   */
  buildKibanaPreview(filters: Array<{ text: string; logic: string; hasNot: boolean }>): string {
    if (filters.length === 0) {
      return '';
    }

    if (filters.length === 1) {
      return filters[0].hasNot ? `NOT ${filters[0].text}` : filters[0].text;
    }

    // Extract logic operators (first filter has no logic operator)
    const operators: Array<'AND' | 'OR' | null> = [null];
    for (let i = 1; i < filters.length; i++) {
      operators.push((filters[i].logic || 'AND') as 'AND' | 'OR');
    }

    // Check if all operators are the same
    const allOperators = operators.slice(1);
    const allSame = allOperators.every(op => op === allOperators[0]);

    if (allSame) {
      // All same operator - no parentheses needed
      const parts: string[] = [];
      filters.forEach((filter, idx) => {
        if (idx > 0) {
          parts.push(operators[idx]!);
        }
        parts.push(filter.hasNot ? `NOT ${filter.text}` : filter.text);
      });
      return parts.join(' ');
    }

    // Different operators - build right-associatively from right to left
    // Process filters from right to left, nesting when operators change
    
    let result = filters[filters.length - 1].hasNot 
      ? `NOT ${filters[filters.length - 1].text}` 
      : filters[filters.length - 1].text;

    // Build from right to left, nesting when operator changes
    // operators[i] is the operator BEFORE filter[i] (between filter[i-1] and filter[i])
    for (let i = filters.length - 2; i >= 0; i--) {
      // The operator between filter[i] and filter[i+1] is operators[i+1]
      const currentOp = operators[i + 1]!;
      const currentFilter = filters[i];
      const currentFilterText = currentFilter.hasNot 
        ? `NOT ${currentFilter.text}` 
        : currentFilter.text;

      // Check if result needs parentheses
      // Result needs parentheses if it starts with a different operator than current
      // We can check this by looking at the operator used to build the current result
      let needsParens = false;
      if (i + 1 < filters.length - 1) {
        // The operator that was used to build 'result' is operators[i+2]
        // (the operator between filter[i+1] and filter[i+2], which is what we just processed)
        const resultOp = operators[i + 2]!;
        needsParens = resultOp !== currentOp;
      }

      result = `${currentFilterText} ${currentOp} ${needsParens ? `(${result})` : result}`;
    }

    return result;
  }

  updatePreview(): void {
    const filterArray = this.filters.value;
    if (filterArray.length === 0) {
      this.previewText = '';
      this.previewHtml = '';
      return;
    }

    // Build filter expressions
    interface FilterExpr {
      text: string;
      logic: string;
      hasNot: boolean;
    }
    
    const filterExpressions: FilterExpr[] = [];
    filterArray.forEach((filter: any, index: number) => {
      if (filter.field && filter.operator) {
        const normalizedOperator = this.normalizeOperator(filter.operator);
        let filterText = '';
        let hasNot = false;
        
        // Format: field: value or NOT field: value
        if (normalizedOperator === 'exists') {
          filterText = `${filter.field}: exists`;
        } else if (normalizedOperator === 'does_not_exist') {
          filterText = `${filter.field}: exists`;
          hasNot = true;
        } else if (normalizedOperator === 'range') {
          // Format range query: field: [minOp minValue] to [maxOp maxValue]
          const rangeParts: string[] = [];
          if (filter.minValue) {
            const minOpLabel = this.getRangeOperatorLabel(filter.minOperator || 'gt');
            rangeParts.push(`${minOpLabel} ${filter.minValue}`);
          }
          if (filter.maxValue) {
            const maxOpLabel = this.getRangeOperatorLabel(filter.maxOperator || 'lt');
            rangeParts.push(`${maxOpLabel} ${filter.maxValue}`);
          }
          if (rangeParts.length > 0) {
            filterText = `${filter.field}: ${rangeParts.join(' and ')}`;
          } else {
            filterText = `${filter.field}: -`;
          }
        } else if (normalizedOperator === 'prefix') {
          // Format prefix query: field: prefix "value"
          const value = filter.value || '-';
          filterText = `${filter.field}: prefix "${value}"`;
        } else if (normalizedOperator === 'wildcard') {
          // Format wildcard query: field: wildcard "value"
          const value = filter.value || '-';
          filterText = `${filter.field}: wildcard "${value}"`;
        } else if (normalizedOperator === 'query_string') {
          // Format query_string query: field: query_string "value"
          const value = filter.value || '-';
          filterText = `${filter.field}: query_string "${value}"`;
        } else if (normalizedOperator === 'is_not') {
          // For "is not", show as NOT field: value
          const value = filter.value || '-';
          filterText = `${filter.field}: ${value}`;
          hasNot = true;
        } else if (filter.value) {
          filterText = `${filter.field}: ${filter.value}`;
        } else {
          filterText = `${filter.field}: -`;
        }

        filterExpressions.push({
          text: filterText,
          logic: index > 0 ? (filter.logic || 'AND') : '',
          hasNot: hasNot
        });
      }
    });

    if (filterExpressions.length === 0) {
      this.previewText = '';
      this.previewHtml = this.sanitizer.bypassSecurityTrustHtml('');
      return;
    }

    // Use Kibana-style preview builder
    const previewText = this.buildKibanaPreview(filterExpressions);
    this.previewText = previewText;

    // Build HTML version with styled operators
    const htmlPreview = this.buildKibanaPreviewHtml(filterExpressions);
    this.previewHtml = this.sanitizer.bypassSecurityTrustHtml(htmlPreview);
  }

  /**
   * Builds HTML version of Kibana preview with styled operators and filters
   */
  buildKibanaPreviewHtml(filters: Array<{ text: string; logic: string; hasNot: boolean }>): string {
    if (filters.length === 0) {
      return '';
    }

    if (filters.length === 1) {
      const filter = filters[0];
      if (filter.hasNot) {
        return `<span style="color: #bd271e; font-weight: 600;">NOT</span> <span style="color: #008000;">${this.escapeHtml(filter.text)}</span>`;
      }
      return `<span style="color: #008000;">${this.escapeHtml(filter.text)}</span>`;
    }

    // Extract logic operators
    const operators: Array<'AND' | 'OR' | null> = [null];
    for (let i = 1; i < filters.length; i++) {
      operators.push((filters[i].logic || 'AND') as 'AND' | 'OR');
    }

    // Check if all operators are the same
    const allOperators = operators.slice(1);
    const allSame = allOperators.every(op => op === allOperators[0]);

    if (allSame) {
      // All same operator - no parentheses needed
      const parts: string[] = [];
      filters.forEach((filter, idx) => {
        if (idx > 0) {
          const opColor = 'rgb(0, 119, 204)';
          parts.push(` <span style="color: ${opColor}; font-weight: 600;">${operators[idx]}</span> `);
        }
        if (filter.hasNot) {
          parts.push(`<span style="color: #bd271e; font-weight: 600;">NOT</span> <span style="color: #008000;">${this.escapeHtml(filter.text)}</span>`);
        } else {
          parts.push(`<span style="color: #008000;">${this.escapeHtml(filter.text)}</span>`);
        }
      });
      return parts.join('');
    }

    // Different operators - build right-associatively from right to left (same as text version)
    const opColor = 'rgb(0, 119, 204)';
    
    let resultHtml = filters[filters.length - 1].hasNot
      ? `<span style="color: #bd271e; font-weight: 600;">NOT</span> <span style="color: #008000;">${this.escapeHtml(filters[filters.length - 1].text)}</span>`
      : `<span style="color: #008000;">${this.escapeHtml(filters[filters.length - 1].text)}</span>`;

    // Build from right to left, nesting when operator changes
    for (let i = filters.length - 2; i >= 0; i--) {
      const currentOp = operators[i + 1]!;
      const currentFilter = filters[i];
      const currentFilterHtml = currentFilter.hasNot
        ? `<span style="color: #bd271e; font-weight: 600;">NOT</span> <span style="color: #008000;">${this.escapeHtml(currentFilter.text)}</span>`
        : `<span style="color: #008000;">${this.escapeHtml(currentFilter.text)}</span>`;

      // Check if result needs parentheses (same logic as text version)
      let needsParens = false;
      if (i + 1 < filters.length - 1) {
        const resultOp = operators[i + 2]!;
        needsParens = resultOp !== currentOp;
      }

      resultHtml = `${currentFilterHtml} <span style="color: ${opColor}; font-weight: 600;">${currentOp}</span> ${needsParens ? `(${resultHtml})` : resultHtml}`;
    }

    return resultHtml;
  }

  escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  toggleQueryDSL(): void {
    this.showQueryDSL = !this.showQueryDSL;
    if (this.showQueryDSL) {
      this.generateQueryDSL();
    }
  }

  generateQueryDSL(): void {
    const filterArray = this.filters.value;
    const queries: Array<{ query: any, logic: string, index: number }> = [];

    filterArray.forEach((filter: any, index: number) => {
      if (!filter.field || !filter.operator) {
        return;
      }

      let query: any = {};
      const isKeyword = this.isKeywordField(filter.field);

      // Normalize operator to handle various formats
      const normalizedOperator = this.normalizeOperator(filter.operator);
      
      // Helper function to check if value is numeric
      const isNumericValue = (val: any): boolean => {
        if (val === null || val === undefined || val === '') return false;
        if (typeof val === 'number') return true;
        if (typeof val === 'string') {
          return /^-?\d+(\.\d+)?$/.test(val.trim());
        }
        return false;
      };

      // Helper function to check if field is a date/timestamp field
      const isDateField = (field: string): boolean => {
        return field === '@timestamp' || 
               field.toLowerCase().includes('date') || 
               field.toLowerCase().includes('time');
      };

      // Helper function to convert value to appropriate type
      const convertValue = (val: any, field: string): any => {
        // Never convert keyword fields - they should always be strings
        if (isKeyword) {
          return val;
        }
        // For non-keyword fields, convert numeric values to numbers
        if (isNumericValue(val)) {
          const numVal = typeof val === 'string' ? parseFloat(val.trim()) : val;
          return isNaN(numVal) ? val : numVal;
        }
        return val;
      };
      
      switch (normalizedOperator) {
        case 'is':
          // Use term for keyword fields, date fields, or numeric values
          // Use match only for text fields with non-numeric values
          if (isKeyword || isDateField(filter.field) || isNumericValue(filter.value)) {
            const value = convertValue(filter.value, filter.field);
            query = { term: { [filter.field]: value } };
          } else {
            query = { match: { [filter.field]: filter.value } };
          }
          break;
        case 'is_not':
          // Field does not exactly match a single value
          if (isKeyword || isDateField(filter.field) || isNumericValue(filter.value)) {
            const notValue = convertValue(filter.value, filter.field);
            query = { bool: { must_not: [{ term: { [filter.field]: notValue } }] } };
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
        case 'range':
          // Range query with min and max operators
          const rangeQuery: any = {};
          if (filter.minValue) {
            rangeQuery[filter.minOperator || 'gt'] = convertValue(filter.minValue, filter.field);
          }
          if (filter.maxValue) {
            rangeQuery[filter.maxOperator || 'lt'] = convertValue(filter.maxValue, filter.field);
          }
          if (Object.keys(rangeQuery).length > 0) {
            query = { range: { [filter.field]: rangeQuery } };
          } else {
            console.warn('Range filter requires at least one value');
            return;
          }
          break;
        case 'prefix':
          // Prefix query - matches documents where field starts with the given value
          if (!filter.value) {
            console.warn('Prefix filter requires a value');
            return;
          }
          // Use prefix query for keyword fields, wildcard for text fields
          if (isKeyword) {
            query = { prefix: { [filter.field]: filter.value } };
          } else {
            // For text fields, use wildcard with prefix pattern
            query = { wildcard: { [filter.field]: { value: `${filter.value}*`, case_insensitive: true } } };
          }
          break;
        case 'wildcard':
          // Wildcard query - matches documents using wildcard patterns (* and ?)
          if (!filter.value) {
            console.warn('Wildcard filter requires a value');
            return;
          }
          // Use wildcard query for both keyword and text fields
          if (isKeyword) {
            query = { wildcard: { [filter.field]: { value: filter.value, case_insensitive: true } } };
          } else {
            // For text fields, use wildcard query
            query = { wildcard: { [filter.field]: { value: filter.value, case_insensitive: true } } };
          }
          break;
        case 'query_string':
          // Query String query - uses Lucene query syntax
          if (!filter.value) {
            console.warn('Query string filter requires a value');
            return;
          }
          // Query string works on both keyword and text fields
          query = { query_string: { default_field: filter.field, query: filter.value } };
          break;
        default:
          console.warn(`Unknown filter operator: ${filter.operator}`);
          return;
      }

      // Store query with its logic for grouping
      queries.push({ query, logic: filter.logic || 'AND', index });
    });

    // Build Query DSL with Kibana-style sequential nesting (right-associative)
    // Extract operators (operators[i] is the operator before filter[i])
    const operators: Array<'AND' | 'OR' | null> = [null];
    for (let i = 1; i < queries.length; i++) {
      operators.push((queries[i].logic || 'AND') as 'AND' | 'OR');
    }

    // Check if all operators are the same
    const allOperators = operators.slice(1);
    const allSame = allOperators.length > 0 && allOperators.every(op => op === allOperators[0]);

    let queryDSL: any;

    if (queries.length === 1) {
      // Single query
      queryDSL = { query: queries[0].query };
    } else if (allSame) {
      // All same operator - simple grouping
      const queryList = queries.map(q => q.query);
      if (allOperators[0] === 'OR') {
        queryDSL = {
          query: {
            bool: {
              should: queryList,
              minimum_should_match: 1
            }
          }
        };
      } else {
        // AND
        queryDSL = {
          query: {
            bool: {
              must: queryList
            }
          }
        };
      }
    } else {
      // Different operators - build right-associatively from right to left
      // This matches the Kibana sequential nesting behavior
      
      let result = queries[queries.length - 1].query;

      // Build from right to left, nesting when operator changes
      for (let i = queries.length - 2; i >= 0; i--) {
        const currentOp = operators[i + 1]!;
        const currentQuery = queries[i].query;

        // Check if result needs parentheses (nesting)
        let needsNesting = false;
        if (i + 1 < queries.length - 1) {
          const resultOp = operators[i + 2]!;
          needsNesting = resultOp !== currentOp;
        }

        // Combine currentQuery with result
        if (currentOp === 'OR') {
          // OR operation: use bool.should
          if (needsNesting) {
            // Result needs to be wrapped (it has different operator inside)
            result = {
              bool: {
                should: [currentQuery, result],
                minimum_should_match: 1
              }
            };
          } else {
            // Check if result is already a should clause
            if (result.bool && result.bool.should) {
              // Extend existing should clause
              result.bool.should = [currentQuery, ...result.bool.should];
            } else {
              // Create new should clause
              result = {
                bool: {
                  should: [currentQuery, result],
                  minimum_should_match: 1
                }
              };
            }
          }
        } else {
          // AND operation: use bool.must
          if (needsNesting) {
            // Result needs to be wrapped (it has different operator inside)
            result = {
              bool: {
                must: [currentQuery, result]
              }
            };
          } else {
            // Check if result is already a must clause
            if (result.bool && result.bool.must) {
              // Extend existing must clause
              result.bool.must = [currentQuery, ...result.bool.must];
            } else {
              // Create new must clause
              result = {
                bool: {
                  must: [currentQuery, result]
                }
              };
            }
          }
        }
      }

      queryDSL = { query: result };
    }

    this.queryDSL = JSON.stringify(queryDSL, null, 2);
  }

  applyFilters(): void {
    if (this.filterForm.invalid) {
      this.updatePreview();
      return;
    }

    const filterArray = this.filters.value;
    const validFilters = filterArray.filter((f: any) => {
      if (!f.field || !f.operator) {
        return false;
      }
      const normalizedOperator = this.normalizeOperator(f.operator);
      if (normalizedOperator === 'exists' || normalizedOperator === 'does_not_exist') {
        return true;
      }
      if (normalizedOperator === 'range') {
        return !!(f.minValue || f.maxValue);
      }
      if (normalizedOperator === 'prefix') {
        return !!f.value;
      }
      if (normalizedOperator === 'wildcard') {
        return !!f.value;
      }
      if (normalizedOperator === 'query_string') {
        return !!f.value;
      }
      return !!f.value;
    });

    if (validFilters.length === 0) {
      return;
    }

    const filterGroup: FilterGroup = {
      filters: validFilters,
      customLabel: this.customLabel || undefined
    };

    this.generateQueryDSL();
    filterGroup.queryDSL = JSON.parse(this.queryDSL);

    this.filtersApplied.emit(filterGroup);
  }

  cancel(): void {
    this.closeFilterBar.emit();
    this.resetForm();
  }

  resetForm(): void {
    while (this.filters.length !== 0) {
      this.filters.removeAt(0);
    }
    this.addFilter();
    this.customLabel = '';
    this.previewText = '';
    this.previewHtml = '';
    this.showQueryDSL = false;
  }

  isFilterValid(index: number): boolean {
    const filter = this.filters.at(index);
    const field = filter.get('field')?.value;
    const operator = filter.get('operator')?.value;
    const value = filter.get('value')?.value;

    if (!field || !operator) {
      return false;
    }

    const normalizedOperator = this.normalizeOperator(operator);
    if (normalizedOperator === 'exists' || normalizedOperator === 'does_not_exist') {
      return true;
    }

    if (normalizedOperator === 'range') {
      // Range filter requires at least one value (min or max)
      const minValue = filter.get('minValue')?.value;
      const maxValue = filter.get('maxValue')?.value;
      return !!(minValue || maxValue);
    }

    if (normalizedOperator === 'prefix') {
      // Prefix filter requires a value
      return !!value;
    }

    if (normalizedOperator === 'wildcard') {
      // Wildcard filter requires a value
      return !!value;
    }

    if (normalizedOperator === 'query_string') {
      // Query string filter requires a value
      return !!value;
    }

    return !!value;
  }

  canAddFilter(): boolean {
    return this.filters.length > 0 && 
           this.filters.controls.every((control, index) => this.isFilterValid(index));
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
      'does_not_exist': 'does_not_exist',
      'range': 'range',
      'prefix': 'prefix',
      'wildcard': 'wildcard',
      'query_string': 'query_string',
      'queryString': 'query_string'
    };
    return operatorMap[operator] || operator;
  }

  getRangeOperatorLabel(operator: string): string {
    const op = this.rangeOperators.find(r => r.value === operator);
    return op ? op.label : operator;
  }

  getValuePlaceholder(index: number): string {
    const filter = this.filters.at(index);
    const field = filter.get('field')?.value;
    const operator = filter.get('operator')?.value;
    const normalizedOperator = this.normalizeOperator(operator);

    if (!field) {
      return 'Please select a field first...';
    }
    
    if (!operator) {
      return 'Please select operator first...';
    }

    if (normalizedOperator === 'exists' || normalizedOperator === 'does_not_exist') {
      return 'No value needed';
    }

    if (normalizedOperator === 'prefix' || normalizedOperator === 'wildcard' || normalizedOperator === 'query_string') {
      return 'Search';
    }

    return 'Enter value';
  }
}

