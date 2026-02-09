import { Component, OnInit, OnChanges, SimpleChanges, Input, Output, EventEmitter } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Filter, FilterGroup } from '../filter.model';
import { FilterService } from '../services/filter.service';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { buildEsQueryFromFilters, buildPreviewString, SimpleFilter } from '../utils/kibana-filter-utils';

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

  /**
   * Adds a new filter. If it's the first filter (index 0), it has no logic operator.
   * Subsequent filters default to 'AND' logic unless specified.
   * 
   * @param logic The logic operator ('AND' or 'OR') to use for the new filter. 
   *              For the first filter, this is ignored and set to empty string.
   */
  addFilter(logic: 'AND' | 'OR' = 'AND'): void {
    // First filter should have no logic operator (it's the base filter)
    const isFirstFilter = this.filters.length === 0;
    const filterLogic = isFirstFilter ? '' : logic;
    
    const filterGroup = this.fb.group({
      field: ['', Validators.required],
      operator: ['', Validators.required],
      value: [''],
      logic: [filterLogic], // Empty for first filter, specified logic for others
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
    // After removing a filter, update logic of remaining filters
    // The first filter should have no logic, subsequent filters keep their logic
    if (this.filters.length > 0 && index === 0) {
      // If we removed the first filter, the new first filter should have no logic
      const firstFilter = this.filters.at(0);
      if (firstFilter) {
        firstFilter.get('logic')?.setValue('');
      }
    }
    this.updatePreview();
  }

  /**
   * Adds a new filter with the specified logic immediately after the filter at the given index.
   * This matches Kibana 8.18.1 behavior where clicking "Add OR filter" or "Add AND filter" 
   * inserts a new filter right after the current one.
   * 
   * @param index The index of the filter row where the button was clicked
   * @param logic The logic operator ('AND' or 'OR') to use for the new filter
   */
  addFilterWithLogic(index: number, logic: 'AND' | 'OR'): void {
    // Create new filter group with the specified logic
    const filterGroup = this.fb.group({
      field: ['', Validators.required],
      operator: ['', Validators.required],
      value: [''],
      logic: [logic], // Set the logic for this new filter
      // Range-specific fields
      minOperator: ['gt'],
      minValue: [''],
      maxOperator: ['lt'],
      maxValue: ['']
    });

    // Insert the new filter immediately after the current filter (at index + 1)
    // This matches Kibana's behavior where the new filter appears right below the clicked row
    this.filters.insert(index + 1, filterGroup);
    this.updatePreview();
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
   * Converts form filter format to SimpleFilter format for Kibana utilities
   */
  private convertToSimpleFilters(formFilters: any[]): SimpleFilter[] {
    return formFilters
      .filter((f: any) => f.field && f.operator) // Filter out invalid filters
      .map((f: any) => ({
        field: f.field,
        operator: this.normalizeOperator(f.operator),
        value: f.value,
        logic: f.logic || 'AND' as 'AND' | 'OR',
        disabled: false, // Form filters are always enabled
        minValue: f.minValue,
        maxValue: f.maxValue,
        minOperator: f.minOperator || 'gt',
        maxOperator: f.maxOperator || 'lt',
      }));
  }

  updatePreview(): void {
    const filterArray = this.filters.value;
    if (filterArray.length === 0) {
      this.previewText = '';
      this.previewHtml = this.sanitizer.bypassSecurityTrustHtml('');
      return;
    }

    // Convert to SimpleFilter format and use Kibana utilities
    const simpleFilters = this.convertToSimpleFilters(filterArray);
    
    if (simpleFilters.length === 0) {
      this.previewText = '';
      this.previewHtml = this.sanitizer.bypassSecurityTrustHtml('');
      return;
    }

    // Use Kibana's buildPreviewString for text preview
    this.previewText = buildPreviewString(simpleFilters);

    // Build HTML version with styled operators (keeping existing HTML formatting)
    const htmlPreview = this.buildKibanaPreviewHtml(simpleFilters);
    this.previewHtml = this.sanitizer.bypassSecurityTrustHtml(htmlPreview);
  }

  /**
   * Builds HTML version of Kibana preview with styled operators, filters, and parentheses
   * Uses the preview string from Kibana utilities and adds HTML styling
   */
  buildKibanaPreviewHtml(simpleFilters: SimpleFilter[]): string {
    if (simpleFilters.length === 0) {
      return '';
    }

    // Get the preview string from Kibana utilities
    const previewText = buildPreviewString(simpleFilters);
    
    if (!previewText) {
      return '';
    }

    // Escape HTML first to prevent XSS
    let html = this.escapeHtml(previewText);

    // Style field:value patterns first (before operators to avoid conflicts)
    // Match "field: value" where field is alphanumeric with dots/underscores
    // and value can contain spaces, quotes, etc.
    html = html.replace(/([a-zA-Z0-9_.-]+):\s*([^\s()<>]+(?:\s+[^\s()<>]+)*)/g, 
      '<span class="preview-field">$1: $2</span>');

    // Style operators (after field styling to avoid matching field names)
    html = html.replace(/\b(AND|OR)\b/g, '<span class="preview-operator">$1</span>');
    
    // Style NOT
    html = html.replace(/\bNOT\s+/g, '<span class="preview-not">NOT</span> ');

    // Style parentheses (groups) - wrap entire groups (do this last)
    html = html.replace(/\(([^)]+)\)/g, '<span class="preview-group">($1)</span>');

    return html;
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

  /**
   * Generates Elasticsearch Query DSL using Kibana-compatible utilities
   * This replaces the manual query building with the official Kibana implementation
   */
  generateQueryDSL(): void {
    const filterArray = this.filters.value;
    
    if (filterArray.length === 0) {
      this.queryDSL = JSON.stringify({ query: { match_all: {} } }, null, 2);
      return;
    }

    // Convert form filters to SimpleFilter format
    const simpleFilters = this.convertToSimpleFilters(filterArray);
    
    if (simpleFilters.length === 0) {
      this.queryDSL = JSON.stringify({ query: { match_all: {} } }, null, 2);
      return;
    }

    // Use Kibana's buildEsQueryFromFilters to generate Query DSL
    const queryDSL = buildEsQueryFromFilters(simpleFilters);
    
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

    // Generate Query DSL using Kibana utilities
    const simpleFilters = this.convertToSimpleFilters(validFilters);
    const queryDSL = buildEsQueryFromFilters(simpleFilters);

    const filterGroup: FilterGroup = {
      filters: validFilters,
      customLabel: this.customLabel || undefined,
      queryDSL: queryDSL
    };

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

