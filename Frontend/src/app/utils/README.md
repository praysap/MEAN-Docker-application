# Kibana v8.18.1 Filter Utilities

This module provides **exact replication** of Kibana v8.18.1's filter grouping behavior for your application.

## Quick Start

```typescript
import {
  buildEsQueryFromFilters,
  buildPreviewString,
  SimpleFilter,
} from './kibana-filter-utils';

// Define your filters
const filters: SimpleFilter[] = [
  { field: 'status', operator: 'is', value: 'active', logic: 'AND' },
  { field: 'type', operator: 'is', value: 'user', logic: 'OR' },
  { field: 'category', operator: 'is', value: 'premium' },
];

// Generate Elasticsearch Query DSL
const queryDSL = buildEsQueryFromFilters(filters);
// Result: { query: { bool: { ... } } }

// Generate human-readable preview
const preview = buildPreviewString(filters);
// Result: "status: active AND (type: user OR category: premium)"
```

## Features

✅ **Boolean AND/OR grouping** - Exact Kibana behavior  
✅ **Nested groups with parentheses** - Proper operator precedence  
✅ **Preview string generation** - Human-readable format  
✅ **Elasticsearch Query DSL output** - Ready for ES queries  
✅ **Disabled filter handling** - Filters out disabled filters  
✅ **Negated filter support** - Handles NOT operations  
✅ **Left-associative grouping** - Matches Kibana's processing order  

## Files

- **`kibana-filter-utils.ts`** - Main implementation
- **`KIBANA_FILTER_ARCHITECTURE.md`** - Detailed architecture documentation
- **`kibana-filter-utils.example.ts`** - Usage examples
- **`kibana-filter-utils.test.ts`** - Test cases

## API Reference

### `buildEsQueryFromFilters(filters: SimpleFilter[]): any`

Converts an array of filters to Elasticsearch Query DSL.

**Parameters:**
- `filters` - Array of `SimpleFilter` objects

**Returns:**
- `{ query: {...} }` - Elasticsearch Query DSL object

**Example:**
```typescript
const filters = [
  { field: 'status', operator: 'is', value: 'active', logic: 'AND' },
  { field: 'type', operator: 'is', value: 'user' },
];

const queryDSL = buildEsQueryFromFilters(filters);
// {
//   query: {
//     bool: {
//       must: [
//         { term: { status: 'active' } },
//         { term: { type: 'user' } }
//       ]
//     }
//   }
// }
```

### `buildPreviewString(filters: SimpleFilter[]): string`

Generates a human-readable preview string from filters.

**Parameters:**
- `filters` - Array of `SimpleFilter` objects

**Returns:**
- `string` - Human-readable preview

**Example:**
```typescript
const filters = [
  { field: 'status', operator: 'is', value: 'active', logic: 'AND' },
  { field: 'type', operator: 'is', value: 'user', logic: 'OR' },
  { field: 'category', operator: 'is', value: 'premium' },
];

const preview = buildPreviewString(filters);
// "status: active AND (type: user OR category: premium)"
```

## Filter Interface

```typescript
interface SimpleFilter {
  field: string;              // Field name
  operator: string;           // Operator: 'is', 'is_not', 'is_one_of', etc.
  value?: any;               // Filter value
  logic?: 'AND' | 'OR';      // Logic operator (connects to previous filter)
  disabled?: boolean;         // Whether filter is disabled
  minValue?: any;            // For range filters
  maxValue?: any;            // For range filters
  minOperator?: string;      // For range filters: 'gt', 'gte', etc.
  maxOperator?: string;      // For range filters: 'lt', 'lte', etc.
}
```

## Supported Operators

- `is` - Exact match (term/match query)
- `is_not` - Not equal (must_not with term/match)
- `is_one_of` - One of multiple values (terms query)
- `is_not_one_of` - Not one of values (must_not with terms)
- `exists` - Field exists (exists query)
- `does_not_exist` - Field does not exist (must_not with exists)
- `range` - Range query (range query)
- `prefix` - Prefix match (prefix/wildcard query)
- `wildcard` - Wildcard match (wildcard query)
- `query_string` - Query string (query_string query)

## How It Works

### Flow

```
SimpleFilter[] 
    ↓
KibanaFilter[] (convert to Kibana format)
    ↓
FilterAST (internal representation)
    ↓
Elasticsearch Query DSL
    ↓
Preview String (human-readable)
```

### Grouping Algorithm

Filters are processed **left-to-right** (left-associative):

1. Start with first filter
2. For each subsequent filter:
   - Get operator connecting it to previous filter
   - If operator matches current group: extend group
   - If operator differs: wrap current result in new bool node

**Example:**
```
Filter1 → Filter2(AND) → Filter3(OR) → Filter4(AND)
Result: ((Filter1 AND Filter2) OR Filter3) AND Filter4
```

### Operator Precedence

- **AND** has higher precedence than **OR**
- Left-associative: `A AND B OR C` → `((A AND B) OR C)`
- Parentheses create explicit groups

## Integration

### Angular Component Example

```typescript
import { Component } from '@angular/core';
import { buildEsQueryFromFilters, buildPreviewString, SimpleFilter } from './utils/kibana-filter-utils';

@Component({...})
export class MyComponent {
  filters: SimpleFilter[] = [];

  generateQuery() {
    const queryDSL = buildEsQueryFromFilters(this.filters);
    // Use queryDSL.query in your Elasticsearch search
    return queryDSL;
  }

  getPreview() {
    return buildPreviewString(this.filters);
  }
}
```

### Converting from Your Current Format

If you have filters in a different format:

```typescript
function convertToSimpleFilters(yourFilters: any[]): SimpleFilter[] {
  return yourFilters.map(f => ({
    field: f.field,
    operator: f.operator,
    value: f.value,
    logic: f.logic || 'AND',
    disabled: f.disabled || false,
    // ... other fields
  }));
}
```

## Testing

Run the test file to verify behavior:

```typescript
import { runAllTests } from './kibana-filter-utils.test';

runAllTests();
```

## Architecture Details

See **`KIBANA_FILTER_ARCHITECTURE.md`** for:
- Detailed architecture explanation
- Kibana file locations
- Implementation details
- Edge cases and gotchas

## Key Differences from Simplified Implementations

1. **Left-associative grouping** - Not right-associative
2. **Proper minimum_should_match** - Always set to 1 for should clauses
3. **Disabled filter filtering** - Filters out before processing
4. **Correct negation handling** - Negated filters in must_not
5. **Operator precedence** - AND has higher precedence, but processed left-to-right

## Accuracy

This implementation is based on:
- Kibana v8.18.1 source code analysis
- `packages/kbn-es-query/src/es_query/build_es_query.ts`
- `src/plugins/data/common/query/filter_manager.ts`
- Kibana's internal filter AST structure

The output matches Kibana's exact behavior for:
- Filter grouping
- Query DSL generation
- Preview string formatting
- Disabled filter handling
- Negated filter handling

## Support

For questions or issues, refer to:
1. `KIBANA_FILTER_ARCHITECTURE.md` - Architecture details
2. `kibana-filter-utils.example.ts` - Usage examples
3. `kibana-filter-utils.test.ts` - Test cases

