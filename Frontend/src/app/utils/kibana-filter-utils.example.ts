/**
 * Usage Examples for Kibana Filter Utilities
 * 
 * This file demonstrates how to use the Kibana-compatible filter utilities
 * to replicate Kibana v8.18.1's exact filter grouping behavior.
 */

import {
  buildEsQueryFromFilters,
  buildPreviewString,
  SimpleFilter,
} from './kibana-filter-utils';

// ============================================================================
// Example 1: Simple AND Filters
// ============================================================================

const andFilters: SimpleFilter[] = [
  { field: 'status', operator: 'is', value: 'active', logic: 'AND' },
  { field: 'type', operator: 'is', value: 'user', logic: 'AND' },
];

const andQuery = buildEsQueryFromFilters(andFilters);
console.log('AND Query:', JSON.stringify(andQuery, null, 2));
// Output:
// {
//   "query": {
//     "bool": {
//       "must": [
//         { "term": { "status": "active" } },
//         { "term": { "type": "user" } }
//       ]
//     }
//   }
// }

const andPreview = buildPreviewString(andFilters);
console.log('AND Preview:', andPreview);
// Output: "status: active AND type: user"

// ============================================================================
// Example 2: Simple OR Filters
// ============================================================================

const orFilters: SimpleFilter[] = [
  { field: 'status', operator: 'is', value: 'active', logic: 'OR' },
  { field: 'status', operator: 'is', value: 'pending', logic: 'OR' },
];

const orQuery = buildEsQueryFromFilters(orFilters);
console.log('OR Query:', JSON.stringify(orQuery, null, 2));
// Output:
// {
//   "query": {
//     "bool": {
//       "should": [
//         { "term": { "status": "active" } },
//         { "term": { "status": "pending" } }
//       ],
//       "minimum_should_match": 1
//     }
//   }
// }

const orPreview = buildPreviewString(orFilters);
console.log('OR Preview:', orPreview);
// Output: "status: active OR status: pending"

// ============================================================================
// Example 3: Mixed AND/OR (Left-Associative)
// ============================================================================

const mixedFilters: SimpleFilter[] = [
  { field: 'status', operator: 'is', value: 'active', logic: 'AND' },
  { field: 'type', operator: 'is', value: 'user', logic: 'OR' },
  { field: 'type', operator: 'is', value: 'admin', logic: 'AND' },
];

const mixedQuery = buildEsQueryFromFilters(mixedFilters);
console.log('Mixed Query:', JSON.stringify(mixedQuery, null, 2));
// Output:
// {
//   "query": {
//     "bool": {
//       "must": [
//         {
//           "bool": {
//             "should": [
//               { "bool": { "must": [{ "term": { "status": "active" } }, { "term": { "type": "user" } }] } },
//               { "term": { "type": "admin" } }
//             ],
//             "minimum_should_match": 1
//           }
//         }
//       ]
//     }
//   }
// }

const mixedPreview = buildPreviewString(mixedFilters);
console.log('Mixed Preview:', mixedPreview);
// Output: "(status: active AND type: user) OR type: admin"

// ============================================================================
// Example 4: Negated Filters
// ============================================================================

const negatedFilters: SimpleFilter[] = [
  { field: 'status', operator: 'is_not', value: 'deleted', logic: 'AND' },
  { field: 'type', operator: 'is', value: 'user' },
];

const negatedQuery = buildEsQueryFromFilters(negatedFilters);
console.log('Negated Query:', JSON.stringify(negatedQuery, null, 2));
// Output:
// {
//   "query": {
//     "bool": {
//       "must": [
//         { "bool": { "must_not": [{ "term": { "status": "deleted" } }] } },
//         { "term": { "type": "user" } }
//       ]
//     }
//   }
// }

const negatedPreview = buildPreviewString(negatedFilters);
console.log('Negated Preview:', negatedPreview);
// Output: "NOT status: deleted AND type: user"

// ============================================================================
// Example 5: Disabled Filters (Ignored)
// ============================================================================

const withDisabledFilters: SimpleFilter[] = [
  { field: 'status', operator: 'is', value: 'active', logic: 'AND' },
  { field: 'type', operator: 'is', value: 'user', disabled: true, logic: 'AND' },
  { field: 'category', operator: 'is', value: 'premium' },
];

const disabledQuery = buildEsQueryFromFilters(withDisabledFilters);
console.log('Disabled Query:', JSON.stringify(disabledQuery, null, 2));
// Output: (type filter is ignored)
// {
//   "query": {
//     "bool": {
//       "must": [
//         { "term": { "status": "active" } },
//         { "term": { "category": "premium" } }
//       ]
//     }
//   }
// }

// ============================================================================
// Example 6: Range Filters
// ============================================================================

const rangeFilters: SimpleFilter[] = [
  { field: 'price', operator: 'range', minValue: 10, maxValue: 100, logic: 'AND' },
  { field: 'status', operator: 'is', value: 'active' },
];

const rangeQuery = buildEsQueryFromFilters(rangeFilters);
console.log('Range Query:', JSON.stringify(rangeQuery, null, 2));

const rangePreview = buildPreviewString(rangeFilters);
console.log('Range Preview:', rangePreview);
// Output: "price: > 10 and < 100 AND status: active"

// ============================================================================
// Example 7: Complex Nested Groups
// ============================================================================

const complexFilters: SimpleFilter[] = [
  { field: 'status', operator: 'is', value: 'active', logic: 'AND' },
  { field: 'type', operator: 'is', value: 'user', logic: 'OR' },
  { field: 'type', operator: 'is', value: 'admin', logic: 'OR' },
  { field: 'category', operator: 'is', value: 'premium', logic: 'AND' },
  { field: 'verified', operator: 'is', value: 'true' },
];

const complexQuery = buildEsQueryFromFilters(complexFilters);
console.log('Complex Query:', JSON.stringify(complexQuery, null, 2));

const complexPreview = buildPreviewString(complexFilters);
console.log('Complex Preview:', complexPreview);
// Output: "status: active AND (type: user OR type: admin) AND category: premium AND verified: true"

// ============================================================================
// Example 8: Integration with Your Component
// ============================================================================

/**
 * Example: Using in your Angular component
 */
export function exampleComponentUsage() {
  // Get filters from your form/component
  const filters: SimpleFilter[] = [
    { field: 'status', operator: 'is', value: 'active', logic: 'AND' },
    { field: 'type', operator: 'is', value: 'user', logic: 'OR' },
  ];

  // Generate Elasticsearch Query DSL
  const queryDSL = buildEsQueryFromFilters(filters);
  
  // Generate preview string for display
  const preview = buildPreviewString(filters);

  // Use queryDSL.query in your Elasticsearch search
  // Use preview for display in UI

  return { queryDSL, preview };
}

// ============================================================================
// Example 9: Converting from Your Current Filter Format
// ============================================================================

/**
 * If you have filters in a different format, convert them first
 */
export function convertToSimpleFilters(yourFilters: any[]): SimpleFilter[] {
  return yourFilters.map(f => ({
    field: f.field,
    operator: f.operator,
    value: f.value,
    logic: f.logic || 'AND',
    disabled: f.disabled || false,
    minValue: f.minValue,
    maxValue: f.maxValue,
    minOperator: f.minOperator,
    maxOperator: f.maxOperator,
  }));
}

