import { Injectable } from '@angular/core';
import {
  FilterRow,
  FilterASTNode,
  ClauseNode,
  GroupNode,
  LogicalOperator,
  FilterClause,
  createClauseNode,
  createGroupNode,
  generateId,
  ASTNode
} from './filter-builder.model';

/**
 * Filter AST Service
 * 
 * Manages the Abstract Syntax Tree representation of filter expressions.
 * Handles building, manipulating, and converting the AST.
 * 
 * Key behaviors (matching Kibana):
 * 1. Left-associative: A AND B OR C → ((A AND B) OR C)
 * 2. Order-dependent grouping based on when AND/OR are clicked
 * 3. Automatic parenthesis insertion for mixed operators
 */
@Injectable({
  providedIn: 'root'
})
export class FilterAstService {

  constructor() { }

  // ============================================================================
  // AST Building from Rows
  // ============================================================================

  /**
   * Builds an AST from filter rows using order-dependent grouping
   * 
   * Algorithm:
   * 1. Process rows sequentially (left-to-right)
   * 2. Each row has a logic operator connecting it to the previous row
   * 3. When operator changes, wrap previous result in a new group
   * 4. Result follows Kibana's left-associative behavior
   * 
   * Example: Rows [A, B(AND), C(OR), D(AND)]
   * - Start: A
   * - Add B with AND: {AND: [A, B]}
   * - Add C with OR: {OR: [{AND: [A, B]}, C]}
   * - Add D with AND: {AND: [{OR: [...]}, D]}
   */
  buildAST(rows: FilterRow[]): FilterASTNode | null {
    if (rows.length === 0) {
      return null;
    }

    if (rows.length === 1) {
      return createClauseNode(rows[0].clause);
    }

    // Start with first row
    let result: FilterASTNode = createClauseNode(rows[0].clause);

    // Process remaining rows
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const operator = row.logicOperator || 'AND';
      const nextNode = createClauseNode(row.clause);

      result = this.combineNodes(result, nextNode, operator);
    }

    return result;
  }

  /**
   * Combines two AST nodes with a logical operator
   * Implements order-dependent grouping
   */
  private combineNodes(left: FilterASTNode, right: FilterASTNode, operator: LogicalOperator): FilterASTNode {
    // If left is already a group with the same operator, extend it
    if (left.type === 'group' && left.operator === operator) {
      return {
        ...left,
        children: [...left.children, right]
      };
    }

    // If left is a group with different operator, we need to wrap
    // This maintains left-associativity: ((A AND B) OR C)
    return createGroupNode(operator, [left, right]);
  }

  // ============================================================================
  // AST Manipulation
  // ============================================================================

  /**
   * Adds a clause to the AST at a specific position
   */
  addClause(ast: FilterASTNode | null, clause: FilterClause, operator: LogicalOperator, position?: number): FilterASTNode {
    const newNode = createClauseNode(clause);

    if (!ast) {
      return newNode;
    }

    // For simplicity, we rebuild from rows rather than manipulating AST directly
    // This ensures consistency between rows and AST
    return this.combineNodes(ast, newNode, operator);
  }

  /**
   * Removes a clause from the AST by ID
   */
  removeClause(ast: FilterASTNode | null, clauseId: string): FilterASTNode | null {
    if (!ast) {
      return null;
    }

    if (ast.type === 'clause') {
      return ast.clause.id === clauseId ? null : ast;
    }

    // Filter out the clause from children
    const filteredChildren = (ast.children as FilterASTNode[])
      .map(child => this.removeClause(child, clauseId))
      .filter((child): child is FilterASTNode => child !== null);

    if (filteredChildren.length === 0) {
      return null;
    }

    if (filteredChildren.length === 1) {
      return filteredChildren[0];
    }

    return {
      ...ast,
      children: filteredChildren
    };
  }

  /**
   * Updates a clause in the AST
   */
  updateClause(ast: FilterASTNode | null, clauseId: string, updates: Partial<FilterClause>): FilterASTNode | null {
    if (!ast) {
      return null;
    }

    if (ast.type === 'clause') {
      if (ast.clause.id === clauseId) {
        return {
          ...ast,
          clause: { ...ast.clause, ...updates }
        };
      }
      return ast;
    }

    // Update in children
    return {
      ...ast,
      children: (ast.children as FilterASTNode[]).map(child => this.updateClause(child, clauseId, updates))
        .filter((child): child is FilterASTNode => child !== null)
    };
  }

  // ============================================================================
  // Group Management
  // ============================================================================

  /**
   * Creates a group from multiple AST nodes
   */
  createGroup(nodes: FilterASTNode[], operator: LogicalOperator): GroupNode {
    return createGroupNode(operator, nodes);
  }

  /**
   * Flattens a group node into its children
   */
  ungroup(node: GroupNode): FilterASTNode[] {
    return node.children as FilterASTNode[];
  }

  /**
   * Wraps existing AST nodes in a new group
   * Used when user explicitly creates a group
   */
  wrapInGroup(ast: FilterASTNode, nodesToWrap: FilterASTNode[], operator: LogicalOperator): FilterASTNode {
    const groupNode = createGroupNode(operator, nodesToWrap);
    
    // Replace the wrapped nodes with the group in the AST
    return this.replaceNodes(ast, nodesToWrap, groupNode);
  }

  /**
   * Replaces multiple nodes with a single node in the AST
   */
  private replaceNodes(ast: FilterASTNode, nodesToReplace: FilterASTNode[], replacement: FilterASTNode): FilterASTNode {
    // Check if this node should be replaced
    if (nodesToReplace.some(n => n.id === ast.id)) {
      return replacement;
    }

    if (ast.type === 'clause') {
      return ast;
    }

    // Recursively replace in children
    const newChildren = (ast.children as FilterASTNode[]).map(child => 
      nodesToReplace.some(n => n.id === child.id) ? null : this.replaceNodes(child, nodesToReplace, replacement)
    ).filter((child): child is FilterASTNode => child !== null);

    // Add the replacement if any children were replaced
    const hadReplacements = newChildren.length < ast.children.length;
    if (hadReplacements) {
      newChildren.push(replacement);
    }

    if (newChildren.length === 0) {
      return replacement;
    }

    if (newChildren.length === 1) {
      return newChildren[0];
    }

    return {
      ...ast,
      children: newChildren
    };
  }

  // ============================================================================
  // Preview Generation
  // ============================================================================

  /**
   * Generates a human-readable preview of the AST
   * Shows proper parenthesis for grouping
   */
  generatePreview(ast: FilterASTNode | null): string {
    if (!ast) {
      return '';
    }

    return this.buildPreviewRecursive(ast, null);
  }

  /**
   * Recursively builds preview string
   */
  private buildPreviewRecursive(node: FilterASTNode, parentOperator: LogicalOperator | null): string {
    if (node.type === 'clause') {
      return this.formatClause(node.clause);
    }

    const childrenPreview = (node.children as FilterASTNode[]).map(child => 
      this.buildPreviewRecursive(child, node.operator)
    );

    const joined = childrenPreview.join(` ${node.operator} `);

    // Add parentheses if:
    // 1. Parent has different operator (mixed AND/OR)
    // 2. This is an OR group (for clarity)
    const needsParens = parentOperator !== null && parentOperator !== node.operator;

    return needsParens ? `(${joined})` : joined;
  }

  /**
   * Formats a single clause for preview
   */
  private formatClause(clause: FilterClause): string {
    const { field, operator, value, values, minValue, maxValue } = clause;

    if (!field) {
      return '...';
    }

    switch (operator) {
      case 'exists':
        return `${field} exists`;
      case 'does_not_exist':
        return `${field} does not exist`;
      case 'is_one_of':
        return `${field} is one of [${values?.join(', ') || value}]`;
      case 'is_not_one_of':
        return `${field} is not one of [${values?.join(', ') || value}]`;
      case 'range':
        const rangeParts: string[] = [];
        if (minValue) rangeParts.push(`>= ${minValue}`);
        if (maxValue) rangeParts.push(`<= ${maxValue}`);
        return rangeParts.length > 0 
          ? `${field} is between ${rangeParts.join(' and ')}`
          : `${field} ...`;
      case 'prefix':
        return `${field} starts with "${value}"`;
      case 'wildcard':
        return `${field} matches "${value}"`;
      case 'query_string':
        return `${field}: "${value}"`;
      case 'is_not':
        return `${field} is not "${value}"`;
      case 'is':
      default:
        return `${field} is "${value}"`;
    }
  }

  // ============================================================================
  // Query DSL Generation
  // ============================================================================

  /**
   * Converts AST to Elasticsearch Query DSL
   */
  toQueryDSL(ast: FilterASTNode | null): any {
    if (!ast) {
      return { match_all: {} };
    }

    return this.toQueryDSLRecursive(ast);
  }

  /**
   * Recursively converts AST to Query DSL
   */
  private toQueryDSLRecursive(node: FilterASTNode): any {
    if (node.type === 'clause') {
      return this.clauseToQueryDSL(node.clause);
    }

    const childrenQueries = (node.children as FilterASTNode[])
      .map(child => this.toQueryDSLRecursive(child))
      .filter(q => q && !this.isEmptyQuery(q));

    if (childrenQueries.length === 0) {
      return { match_all: {} };
    }

    if (childrenQueries.length === 1) {
      return childrenQueries[0];
    }

    if (node.operator === 'OR') {
      return {
        bool: {
          should: childrenQueries,
          minimum_should_match: 1
        }
      };
    } else {
      return {
        bool: {
          must: childrenQueries
        }
      };
    }
  }

  /**
   * Converts a single clause to Query DSL
   */
  private clauseToQueryDSL(clause: FilterClause): any {
    const { field, operator, value, values, minValue, maxValue, minOperator, maxOperator } = clause;

    if (!field) {
      return { match_all: {} };
    }

    const isKeyword = field.endsWith('.keyword');

    switch (operator) {
      case 'is':
        if (isKeyword || this.isNumeric(value)) {
          return { term: { [field]: this.convertValue(value, isKeyword) } };
        }
        return { match: { [field]: value } };

      case 'is_not':
        if (isKeyword || this.isNumeric(value)) {
          return { bool: { must_not: [{ term: { [field]: this.convertValue(value, isKeyword) } }] } };
        }
        return { bool: { must_not: [{ match: { [field]: value } }] } };

      case 'is_one_of':
        const oneOfValues = values || (value ? [value] : []);
        return { terms: { [field]: oneOfValues } };

      case 'is_not_one_of':
        const notOneOfValues = values || (value ? [value] : []);
        return { bool: { must_not: [{ terms: { [field]: notOneOfValues } }] } };

      case 'exists':
        return { exists: { field } };

      case 'does_not_exist':
        return { bool: { must_not: [{ exists: { field } }] } };

      case 'range':
        const rangeQuery: any = {};
        if (minValue !== undefined && minValue !== '') {
          rangeQuery[minOperator || 'gte'] = this.convertValue(minValue, isKeyword);
        }
        if (maxValue !== undefined && maxValue !== '') {
          rangeQuery[maxOperator || 'lte'] = this.convertValue(maxValue, isKeyword);
        }
        return Object.keys(rangeQuery).length > 0 ? { range: { [field]: rangeQuery } } : { match_all: {} };

      case 'prefix':
        if (isKeyword) {
          return { prefix: { [field]: value } };
        }
        return { wildcard: { [field]: { value: `${value}*`, case_insensitive: true } } };

      case 'wildcard':
        return { wildcard: { [field]: { value, case_insensitive: true } } };

      case 'query_string':
        return { query_string: { default_field: field, query: value } };

      default:
        return { match_all: {} };
    }
  }

  /**
   * Checks if value is numeric
   */
  private isNumeric(val: any): boolean {
    if (val === null || val === undefined || val === '') return false;
    if (typeof val === 'number') return true;
    if (typeof val === 'string') {
      return /^-?\d+(\.\d+)?$/.test(val.trim());
    }
    return false;
  }

  /**
   * Converts value for ES query
   */
  private convertValue(val: any, isKeyword: boolean): any {
    if (isKeyword) return val;
    if (this.isNumeric(val)) {
      const num = typeof val === 'string' ? parseFloat(val.trim()) : val;
      return isNaN(num) ? val : num;
    }
    return val;
  }

  /**
   * Checks if query is empty
   */
  private isEmptyQuery(query: any): boolean {
    return !query || (query.match_all && Object.keys(query).length === 1);
  }

  // ============================================================================
  // AST Traversal
  // ============================================================================

  /**
   * Flattens AST to array of nodes (depth-first)
   */
  flattenAST(ast: FilterASTNode | null): FilterASTNode[] {
    if (!ast) {
      return [];
    }

    const result: FilterASTNode[] = [ast];

    if (ast.type === 'group') {
      (ast.children as FilterASTNode[]).forEach(child => {
        result.push(...this.flattenAST(child));
      });
    }

    return result;
  }

  /**
   * Finds a node by ID
   */
  findNode(ast: FilterASTNode | null, id: string): FilterASTNode | null {
    if (!ast) {
      return null;
    }

    if (ast.id === id) {
      return ast;
    }

    if (ast.type === 'group') {
      for (const child of ast.children as FilterASTNode[]) {
        const found = this.findNode(child, id);
        if (found) {
          return found;
        }
      }
    }

    return null;
  }

  /**
   * Gets all clause nodes from AST
   */
  getAllClauses(ast: FilterASTNode | null): FilterClause[] {
    if (!ast) {
      return [];
    }

    const clauses: FilterClause[] = [];

    const traverse = (node: FilterASTNode) => {
      if (node.type === 'clause') {
        clauses.push(node.clause);
      } else {
        (node.children as FilterASTNode[]).forEach(traverse);
      }
    };

    traverse(ast);
    return clauses;
  }
}
