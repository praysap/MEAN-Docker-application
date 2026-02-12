import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FilterAstService } from './filter-ast.service';
import {
  FilterRow,
  FilterClause,
  FilterField,
  FilterOperator,
  FilterOperatorDef,
  LogicalOperator,
  FilterBuilderOutput,
  createFilterRow,
  createEmptyClause,
  FILTER_OPERATORS,
  getOperatorDef,
  operatorRequiresValue,
  operatorSupportsMultipleValues,
  generateId,
  FilterASTNode
} from './filter-builder.model';

/**
 * Filter Builder Component
 * 
 * Kibana-style filter builder with:
 * - Field/Operator/Value selection per row
 * - AND/OR logical operators between rows
 * - Order-dependent grouping (click-order determines grouping)
 * - Real-time preview with parenthesis
 * - AST tree representation
 */
@Component({
  selector: 'app-filter-builder',
  templateUrl: './filter-builder.component.html',
  styleUrls: ['./filter-builder.component.scss']
})
export class FilterBuilderComponent implements OnInit, OnChanges {
  
  // ============================================================================
  // Inputs/Outputs
  // ============================================================================
  
  @Input() availableFields: FilterField[] = [];
  @Input() initialRows: FilterRow[] = [];
  @Input() showPreview: boolean = true;
  
  @Output() filtersApplied = new EventEmitter<FilterBuilderOutput>();
  @Output() filtersCleared = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @Output() rowsChanged = new EventEmitter<FilterRow[]>();
  @Output() previewChanged = new EventEmitter<string>();

  // ============================================================================
  // Component State
  // ============================================================================
  
  rows: FilterRow[] = [];
  preview: string = '';
  ast: FilterASTNode | null = null;
  
  // Available operators for dropdown
  readonly operators: FilterOperatorDef[] = FILTER_OPERATORS;
  
  // Track which rows are expanded for multi-value input
  expandedRows: Set<string> = new Set();

  constructor(private astService: FilterAstService) { }

  // ============================================================================
  // Lifecycle
  // ============================================================================
  
  ngOnInit(): void {
    if (this.initialRows && this.initialRows.length > 0) {
      this.rows = [...this.initialRows];
    } else {
      // Start with one empty row
      this.addRow();
    }
    this.updatePreview();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialRows'] && changes['initialRows'].currentValue) {
      this.rows = [...changes['initialRows'].currentValue];
      this.updatePreview();
    }
  }

  // ============================================================================
  // Row Management
  // ============================================================================
  
  /**
   * Adds a new filter row after the specified index
   */
  addRow(afterIndex?: number, logicOperator: LogicalOperator = 'AND'): void {
    const newRow = createFilterRow(logicOperator);
    
    if (afterIndex === undefined || afterIndex < 0 || afterIndex >= this.rows.length) {
      // Add to end
      this.rows.push(newRow);
    } else {
      // Insert after specified index
      this.rows.splice(afterIndex + 1, 0, newRow);
      
      // Set the logic operator for the new row
      newRow.logicOperator = logicOperator;
    }
    
    this.onRowsChanged();
  }

  /**
   * Removes a row at the specified index
   */
  removeRow(index: number): void {
    if (index < 0 || index >= this.rows.length) {
      return;
    }
    
    this.rows.splice(index, 1);
    
    // If we removed the first row, clear the logic operator of the new first row
    if (index === 0 && this.rows.length > 0) {
      this.rows[0].logicOperator = undefined;
    }
    
    // If no rows left, add an empty one
    if (this.rows.length === 0) {
      this.addRow();
    }
    
    this.onRowsChanged();
  }

  /**
   * Duplicates a row
   */
  duplicateRow(index: number): void {
    if (index < 0 || index >= this.rows.length) {
      return;
    }
    
    const sourceRow = this.rows[index];
    const newRow: FilterRow = {
      id: generateId(),
      clause: { ...sourceRow.clause, id: generateId() },
      logicOperator: 'AND',
      level: sourceRow.level
    };
    
    this.rows.splice(index + 1, 0, newRow);
    this.onRowsChanged();
  }

  /**
   * Moves a row up or down
   */
  moveRow(index: number, direction: 'up' | 'down'): void {
    if (direction === 'up' && index > 0) {
      [this.rows[index], this.rows[index - 1]] = [this.rows[index - 1], this.rows[index]];
      this.onRowsChanged();
    } else if (direction === 'down' && index < this.rows.length - 1) {
      [this.rows[index], this.rows[index + 1]] = [this.rows[index + 1], this.rows[index]];
      this.onRowsChanged();
    }
  }

  // ============================================================================
  // Clause Updates
  // ============================================================================
  
  /**
   * Updates a clause field
   */
  updateField(rowIndex: number, field: string): void {
    if (rowIndex < 0 || rowIndex >= this.rows.length) {
      return;
    }
    
    const row = this.rows[rowIndex];
    row.clause.field = field;
    
    // Reset operator and value when field changes
    row.clause.operator = 'is';
    row.clause.value = '';
    row.clause.values = undefined;
    
    this.onRowsChanged();
  }

  /**
   * Updates a clause operator
   */
  updateOperator(rowIndex: number, operator: FilterOperator): void {
    if (rowIndex < 0 || rowIndex >= this.rows.length) {
      return;
    }
    
    const row = this.rows[rowIndex];
    const oldOperator = row.clause.operator;
    row.clause.operator = operator;
    
    // Clear values if operator doesn't require them
    if (!operatorRequiresValue(operator)) {
      row.clause.value = '';
      row.clause.values = undefined;
    }
    
    // Initialize values array for multi-value operators
    if (operatorSupportsMultipleValues(operator) && !row.clause.values) {
      row.clause.values = [];
    }
    
    // Clear single value if switching to multi-value
    if (operatorSupportsMultipleValues(operator)) {
      row.clause.value = '';
    }
    
    this.onRowsChanged();
  }

  /**
   * Updates a clause value
   */
  updateValue(rowIndex: number, value: any): void {
    if (rowIndex < 0 || rowIndex >= this.rows.length) {
      return;
    }
    
    this.rows[rowIndex].clause.value = value;
    this.onRowsChanged();
  }

  /**
   * Updates clause values (for multi-value operators)
   */
  updateValues(rowIndex: number, values: any[]): void {
    if (rowIndex < 0 || rowIndex >= this.rows.length) {
      return;
    }
    
    this.rows[rowIndex].clause.values = values;
    this.onRowsChanged();
  }

  /**
   * Updates range values
   */
  updateRangeValue(rowIndex: number, type: 'min' | 'max', value: any): void {
    if (rowIndex < 0 || rowIndex >= this.rows.length) {
      return;
    }
    
    const row = this.rows[rowIndex];
    if (type === 'min') {
      row.clause.minValue = value;
    } else {
      row.clause.maxValue = value;
    }
    
    this.onRowsChanged();
  }

  // ============================================================================
  // Logic Operator Management
  // ============================================================================
  
  /**
   * Updates the logic operator between rows
   * This is the key method for order-dependent grouping
   */
  updateLogicOperator(rowIndex: number, operator: LogicalOperator): void {
    if (rowIndex <= 0 || rowIndex >= this.rows.length) {
      return;
    }
    
    this.rows[rowIndex].logicOperator = operator;
    this.onRowsChanged();
  }

  /**
   * Gets the logic operator for a row
   */
  getLogicOperator(rowIndex: number): LogicalOperator {
    if (rowIndex <= 0 || rowIndex >= this.rows.length) {
      return 'AND';
    }
    return this.rows[rowIndex].logicOperator || 'AND';
  }

  // ============================================================================
  // Preview & AST
  // ============================================================================
  
  /**
   * Updates the preview and AST based on current rows
   */
  private updatePreview(): void {
    this.ast = this.astService.buildAST(this.rows);
    this.preview = this.astService.generatePreview(this.ast);
    this.previewChanged.emit(this.preview);
  }

  /**
   * Called when rows change
   */
  private onRowsChanged(): void {
    this.updatePreview();
    this.rowsChanged.emit([...this.rows]);
  }

  // ============================================================================
  // Actions
  // ============================================================================
  
  /**
   * Applies the filters and emits the output
   */
  applyFilters(): void {
    if (!this.ast) {
      return;
    }
    
    const queryDSL = this.astService.toQueryDSL(this.ast);
    
    const output: FilterBuilderOutput = {
      ast: this.ast,
      rows: [...this.rows],
      queryDSL,
      preview: this.preview
    };
    
    this.filtersApplied.emit(output);
  }

  /**
   * Clears all filters and resets to initial state
   */
  clearFilters(): void {
    this.rows = [];
    this.addRow();
    this.onRowsChanged();
    this.filtersCleared.emit();
  }

  /**
   * Cancels the filter building
   */
  cancel(): void {
    this.cancelled.emit();
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================
  
  /**
   * Checks if a row needs a value input
   */
  needsValue(row: FilterRow): boolean {
    return operatorRequiresValue(row.clause.operator);
  }

  /**
   * Checks if a row supports multiple values
   */
  supportsMultipleValues(row: FilterRow): boolean {
    return operatorSupportsMultipleValues(row.clause.operator);
  }

  /**
   * Checks if operator is range
   */
  isRangeOperator(row: FilterRow): boolean {
    return row.clause.operator === 'range';
  }

  /**
   * Gets operator definition
   */
  getOperatorDef(operator: FilterOperator): FilterOperatorDef | undefined {
    return getOperatorDef(operator);
  }

  /**
   * Gets available operators for a field
   */
  getOperatorsForField(fieldName: string): FilterOperatorDef[] {
    const field = this.availableFields.find(f => f.name === fieldName);
    if (field && field.operators && field.operators.length > 0) {
      return FILTER_OPERATORS.filter(op => field.operators?.includes(op.value));
    }
    return FILTER_OPERATORS;
  }

  /**
   * Checks if a row is valid (has required fields)
   */
  isRowValid(row: FilterRow): boolean {
    const clause = row.clause;
    
    if (!clause.field) {
      return false;
    }
    
    if (!operatorRequiresValue(clause.operator)) {
      return true;
    }
    
    if (clause.operator === 'range') {
      return clause.minValue !== undefined && clause.minValue !== '' ||
             clause.maxValue !== undefined && clause.maxValue !== '';
    }
    
    if (operatorSupportsMultipleValues(clause.operator)) {
      return (clause.values && clause.values.length > 0) || 
             (clause.value !== undefined && clause.value !== '');
    }
    
    return clause.value !== undefined && clause.value !== '';
  }

  /**
   * Checks if all rows are valid
   */
  areAllRowsValid(): boolean {
    return this.rows.every(row => this.isRowValid(row));
  }

  /**
   * Gets the number of valid rows
   */
  getValidRowCount(): number {
    return this.rows.filter(row => this.isRowValid(row)).length;
  }

  /**
   * Toggles row expansion for multi-value input
   */
  toggleRowExpansion(rowId: string): void {
    if (this.expandedRows.has(rowId)) {
      this.expandedRows.delete(rowId);
    } else {
      this.expandedRows.add(rowId);
    }
  }

  /**
   * Checks if a row is expanded
   */
  isRowExpanded(rowId: string): boolean {
    return this.expandedRows.has(rowId);
  }

  /**
   * Adds a value to multi-value list
   */
  addMultiValue(rowIndex: number, value: string): void {
    if (!value.trim()) return;
    
    const row = this.rows[rowIndex];
    if (!row.clause.values) {
      row.clause.values = [];
    }
    
    if (!row.clause.values.includes(value.trim())) {
      row.clause.values.push(value.trim());
      this.onRowsChanged();
    }
  }

  /**
   * Removes a value from multi-value list
   */
  removeMultiValue(rowIndex: number, value: string): void {
    const row = this.rows[rowIndex];
    if (row.clause.values) {
      row.clause.values = row.clause.values.filter(v => v !== value);
      this.onRowsChanged();
    }
  }

  /**
   * Track by function for ngFor
   */
  trackByRow(index: number, row: FilterRow): string {
    return row.id;
  }
}
