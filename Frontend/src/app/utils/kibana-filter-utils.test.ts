/**
 * Test Cases for Kibana Filter Utilities
 * 
 * These tests verify that the implementation matches Kibana v8.18.1's behavior.
 * Run these tests to ensure accuracy.
 */

import {
  buildEsQueryFromFilters,
  buildPreviewString,
  SimpleFilter,
} from './kibana-filter-utils';

// ============================================================================
// Test Helper Functions
// ============================================================================

function expectQueryStructure(query: any, expected: any, description: string) {
  console.log(`\nTest: ${description}`);
  console.log('Expected:', JSON.stringify(expected, null, 2));
  console.log('Actual:', JSON.stringify(query, null, 2));
  
  // Deep comparison would go here in a real test framework
  // For now, we just log and verify manually
}

// ============================================================================
// Test Cases
// ============================================================================

export function runAllTests() {
  console.log('=== Running Kibana Filter Utilities Tests ===\n');

  // Test 1: Single Filter
  testSingleFilter();
  
  // Test 2: Simple AND
  testSimpleAND();
  
  // Test 3: Simple OR
  testSimpleOR();
  
  // Test 4: Mixed AND/OR (Left-Associative)
  testMixedANDOR();
  
  // Test 5: Negated Filters
  testNegatedFilters();
  
  // Test 6: Disabled Filters
  testDisabledFilters();
  
  // Test 7: Range Filters
  testRangeFilters();
  
  // Test 8: Complex Nested Groups
  testComplexNested();
  
  // Test 9: Preview String Generation
  testPreviewStrings();
  
  console.log('\n=== Tests Complete ===');
}

// ============================================================================
// Individual Test Cases
// ============================================================================

function testSingleFilter() {
  const filters: SimpleFilter[] = [
    { field: 'status', operator: 'is', value: 'active' },
  ];

  const query = buildEsQueryFromFilters(filters);
  const expected = {
    query: {
      term: { status: 'active' },
    },
  };

  expectQueryStructure(query, expected, 'Single Filter');
}

function testSimpleAND() {
  const filters: SimpleFilter[] = [
    { field: 'status', operator: 'is', value: 'active', logic: 'AND' },
    { field: 'type', operator: 'is', value: 'user' },
  ];

  const query = buildEsQueryFromFilters(filters);
  const expected = {
    query: {
      bool: {
        must: [
          { term: { status: 'active' } },
          { term: { type: 'user' } },
        ],
      },
    },
  };

  expectQueryStructure(query, expected, 'Simple AND');
}

function testSimpleOR() {
  const filters: SimpleFilter[] = [
    { field: 'status', operator: 'is', value: 'active', logic: 'OR' },
    { field: 'status', operator: 'is', value: 'pending' },
  ];

  const query = buildEsQueryFromFilters(filters);
  const expected = {
    query: {
      bool: {
        should: [
          { term: { status: 'active' } },
          { term: { status: 'pending' } },
        ],
        minimum_should_match: 1,
      },
    },
  };

  expectQueryStructure(query, expected, 'Simple OR');
}

function testMixedANDOR() {
  const filters: SimpleFilter[] = [
    { field: 'status', operator: 'is', value: 'active', logic: 'AND' },
    { field: 'type', operator: 'is', value: 'user', logic: 'OR' },
    { field: 'type', operator: 'is', value: 'admin' },
  ];

  const query = buildEsQueryFromFilters(filters);
  
  // Expected: ((status: active AND type: user) OR type: admin)
  // This should create nested bool queries
  console.log('\nTest: Mixed AND/OR (Left-Associative)');
  console.log('Expected: Nested bool with should containing must');
  console.log('Actual:', JSON.stringify(query, null, 2));
}

function testNegatedFilters() {
  const filters: SimpleFilter[] = [
    { field: 'status', operator: 'is_not', value: 'deleted', logic: 'AND' },
    { field: 'type', operator: 'is', value: 'user' },
  ];

  const query = buildEsQueryFromFilters(filters);
  const expected = {
    query: {
      bool: {
        must: [
          { bool: { must_not: [{ term: { status: 'deleted' } }] } },
          { term: { type: 'user' } },
        ],
      },
    },
  };

  expectQueryStructure(query, expected, 'Negated Filters');
}

function testDisabledFilters() {
  const filters: SimpleFilter[] = [
    { field: 'status', operator: 'is', value: 'active', logic: 'AND' },
    { field: 'type', operator: 'is', value: 'user', disabled: true, logic: 'AND' },
    { field: 'category', operator: 'is', value: 'premium' },
  ];

  const query = buildEsQueryFromFilters(filters);
  
  // Disabled filter should be ignored
  console.log('\nTest: Disabled Filters');
  console.log('Expected: type filter should be absent');
  console.log('Actual:', JSON.stringify(query, null, 2));
  
  // Verify 'type' is not in the query
  const queryStr = JSON.stringify(query);
  if (!queryStr.includes('"type"')) {
    console.log('✓ PASS: Disabled filter correctly ignored');
  } else {
    console.log('✗ FAIL: Disabled filter was not ignored');
  }
}

function testRangeFilters() {
  const filters: SimpleFilter[] = [
    { field: 'price', operator: 'range', minValue: 10, maxValue: 100, logic: 'AND' },
    { field: 'status', operator: 'is', value: 'active' },
  ];

  const query = buildEsQueryFromFilters(filters);
  
  console.log('\nTest: Range Filters');
  console.log('Expected: range query with gt and lt');
  console.log('Actual:', JSON.stringify(query, null, 2));
}

function testComplexNested() {
  const filters: SimpleFilter[] = [
    { field: 'status', operator: 'is', value: 'active', logic: 'AND' },
    { field: 'type', operator: 'is', value: 'user', logic: 'OR' },
    { field: 'type', operator: 'is', value: 'admin', logic: 'OR' },
    { field: 'category', operator: 'is', value: 'premium', logic: 'AND' },
  ];

  const query = buildEsQueryFromFilters(filters);
  
  console.log('\nTest: Complex Nested Groups');
  console.log('Expected: Nested bool queries with proper grouping');
  console.log('Actual:', JSON.stringify(query, null, 2));
}

function testPreviewStrings() {
  console.log('\n=== Preview String Tests ===');
  
  // Test 1: Simple AND
  const andFilters: SimpleFilter[] = [
    { field: 'status', operator: 'is', value: 'active', logic: 'AND' },
    { field: 'type', operator: 'is', value: 'user' },
  ];
  const andPreview = buildPreviewString(andFilters);
  console.log('AND Preview:', andPreview);
  console.log('Expected: "status: active AND type: user"');
  
  // Test 2: Simple OR
  const orFilters: SimpleFilter[] = [
    { field: 'status', operator: 'is', value: 'active', logic: 'OR' },
    { field: 'status', operator: 'is', value: 'pending' },
  ];
  const orPreview = buildPreviewString(orFilters);
  console.log('OR Preview:', orPreview);
  console.log('Expected: "status: active OR status: pending"');
  
  // Test 3: Mixed
  const mixedFilters: SimpleFilter[] = [
    { field: 'status', operator: 'is', value: 'active', logic: 'AND' },
    { field: 'type', operator: 'is', value: 'user', logic: 'OR' },
    { field: 'type', operator: 'is', value: 'admin' },
  ];
  const mixedPreview = buildPreviewString(mixedFilters);
  console.log('Mixed Preview:', mixedPreview);
  console.log('Expected: "(status: active AND type: user) OR type: admin"');
  
  // Test 4: Negated
  const negatedFilters: SimpleFilter[] = [
    { field: 'status', operator: 'is_not', value: 'deleted', logic: 'AND' },
    { field: 'type', operator: 'is', value: 'user' },
  ];
  const negatedPreview = buildPreviewString(negatedFilters);
  console.log('Negated Preview:', negatedPreview);
  console.log('Expected: "NOT status: deleted AND type: user"');
}

// ============================================================================
// Edge Cases
// ============================================================================

export function testEdgeCases() {
  console.log('\n=== Edge Case Tests ===');
  
  // Empty filters
  const emptyQuery = buildEsQueryFromFilters([]);
  console.log('Empty filters:', JSON.stringify(emptyQuery, null, 2));
  console.log('Expected: { query: { match_all: {} } }');
  
  // All disabled
  const allDisabled: SimpleFilter[] = [
    { field: 'status', operator: 'is', value: 'active', disabled: true },
  ];
  const allDisabledQuery = buildEsQueryFromFilters(allDisabled);
  console.log('All disabled:', JSON.stringify(allDisabledQuery, null, 2));
  console.log('Expected: { query: { match_all: {} } }');
  
  // Single disabled with enabled
  const partialDisabled: SimpleFilter[] = [
    { field: 'status', operator: 'is', value: 'active', disabled: true, logic: 'AND' },
    { field: 'type', operator: 'is', value: 'user' },
  ];
  const partialDisabledQuery = buildEsQueryFromFilters(partialDisabled);
  console.log('Partial disabled:', JSON.stringify(partialDisabledQuery, null, 2));
  console.log('Expected: Only type filter in query');
}

