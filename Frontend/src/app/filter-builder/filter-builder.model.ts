/**
 * Filter Builder Model
 * Kibana-style filter builder with AST tree representation
 */

// ============================================================================
// Filter Clause Types
// ============================================================================

export type FilterOperator = 
  | 'is' 
  | 'is_not' 
  | 'is_one_of' 
  | 'is_not_one_of' 
  | 'exists' 
  | 'does_not_exist'
  | 'range'
  | 'prefix'
  | 'wildcard'
  | 'query_string';

export type LogicalOperator = 'AND' | 'OR';

/**
 * Single filter clause (leaf node in AST)
 */
export interface FilterClause {
  id: string;
  field: string;
  operator: FilterOperator;
  value?: any;
  values?: any[]; // For is_one_of / is_not_one_of
  minValue?: any; // For range
  maxValue?: any; // For range
  minOperator?: string; // For range
  maxOperator?: string; // For range
}

// ============================================================================
// AST Node Types
// ============================================================================

export type ASTNodeType = 'clause' | 'group';

/**
 * Base AST Node
 */
export interface ASTNode {
  id: string;
  type: ASTNodeType;
}

/**
 * Leaf node - represents a single filter clause
 */
export interface ClauseNode extends ASTNode {
  type: 'clause';
  clause: FilterClause;
}

/**
 * Internal node - represents AND/OR logical group
 */
export interface GroupNode extends ASTNode {
  type: 'group';
  operator: LogicalOperator;
  children: ASTNode[];
}

/**
 * Union type for all AST nodes
 */
export type FilterASTNode = ClauseNode | GroupNode;

// ============================================================================
// Filter Row UI Model
// ============================================================================

/**
 * UI representation of a filter row
 * Maps to the visual row in the filter builder
 */
export interface FilterRow {
  id: string;
  clause: FilterClause;
  logicOperator?: LogicalOperator; // Operator connecting to previous row (null for first row)
  level: number; // Nesting level for indentation
  parentGroupId?: string;
}

// ============================================================================
// Field Definition
// ============================================================================

/**
 * Available field for filtering
 */
export interface FilterField {
  name: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'ip';
  operators?: FilterOperator[]; // Optional: restrict available operators
}

// ============================================================================
// Operator Definition
// ============================================================================

/**
 * Operator metadata for UI
 */
export interface FilterOperatorDef {
  value: FilterOperator;
  label: string;
  description: string;
  requiresValue: boolean;
  supportsMultipleValues: boolean;
}

/**
 * All available operators
 */
export const FILTER_OPERATORS: FilterOperatorDef[] = [
  { value: 'is', label: 'is', description: 'Equals a value', requiresValue: true, supportsMultipleValues: false },
  { value: 'is_not', label: 'is not', description: 'Does not equal a value', requiresValue: true, supportsMultipleValues: false },
  { value: 'is_one_of', label: 'is one of', description: 'Equals any of the values', requiresValue: true, supportsMultipleValues: true },
  { value: 'is_not_one_of', label: 'is not one of', description: 'Does not equal any of the values', requiresValue: true, supportsMultipleValues: true },
  { value: 'exists', label: 'exists', description: 'Field exists', requiresValue: false, supportsMultipleValues: false },
  { value: 'does_not_exist', label: 'does not exist', description: 'Field does not exist', requiresValue: false, supportsMultipleValues: false },
  { value: 'range', label: 'is between', description: 'Within a range', requiresValue: true, supportsMultipleValues: false },
  { value: 'prefix', label: 'starts with', description: 'Starts with prefix', requiresValue: true, supportsMultipleValues: false },
  { value: 'wildcard', label: 'matches pattern', description: 'Matches wildcard pattern', requiresValue: true, supportsMultipleValues: false },
  { value: 'query_string', label: 'query string', description: 'Lucene query syntax', requiresValue: true, supportsMultipleValues: false },
];

// ============================================================================
// Filter Builder State
// ============================================================================

/**
 * Complete filter builder state
 */
export interface FilterBuilderState {
  rows: FilterRow[];
  ast: FilterASTNode | null;
  preview: string;
}

/**
 * Output when filters are applied
 */
export interface FilterBuilderOutput {
  ast: FilterASTNode;
  rows: FilterRow[];
  queryDSL: any;
  preview: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generates a unique ID
 */
export function generateId(): string {
  return `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Creates a new empty filter clause
 */
export function createEmptyClause(): FilterClause {
  return {
    id: generateId(),
    field: '',
    operator: 'is',
    value: ''
  };
}

/**
 * Creates a new filter row
 */
export function createFilterRow(logicOperator?: LogicalOperator, level: number = 0): FilterRow {
  return {
    id: generateId(),
    clause: createEmptyClause(),
    logicOperator,
    level
  };
}

/**
 * Creates a clause node
 */
export function createClauseNode(clause: FilterClause): ClauseNode {
  return {
    id: clause.id,
    type: 'clause',
    clause
  };
}

/**
 * Creates a group node
 */
export function createGroupNode(operator: LogicalOperator, children: ASTNode[]): GroupNode {
  return {
    id: generateId(),
    type: 'group',
    operator,
    children
  };
}

/**
 * Gets operator definition by value
 */
export function getOperatorDef(operator: FilterOperator): FilterOperatorDef | undefined {
  return FILTER_OPERATORS.find(op => op.value === operator);
}

/**
 * Checks if an operator requires a value
 */
export function operatorRequiresValue(operator: FilterOperator): boolean {
  const opDef = getOperatorDef(operator);
  return opDef?.requiresValue ?? true;
}

/**
 * Checks if an operator supports multiple values
 */
export function operatorSupportsMultipleValues(operator: FilterOperator): boolean {
  const opDef = getOperatorDef(operator);
  return opDef?.supportsMultipleValues ?? false;
}
