# Kibana v8.18.1 Filter Architecture Documentation

## Overview

This document explains how Kibana v8.18.1 handles filter grouping internally, based on analysis of the Kibana source code.

## File Locations in Kibana Repository

### Core Filter Implementation
- **`packages/kbn-es-query/src/es_query/build_es_query.ts`**
  - Main function: `buildEsQuery(indexPattern, queries, filters, config)`
  - Converts filters + queries to Elasticsearch Query DSL
  - Handles `minimum_should_match` logic

- **`src/plugins/data/common/query/filter_manager.ts`**
  - Filter state management
  - Filter serialization/deserialization
  - Filter lifecycle (add, remove, update, disable)

- **`src/plugins/data/common/query/filters_to_ast.ts`** (if exists)
  - Converts filter objects to AST representation
  - Handles combined filters (nested groups)

- **`packages/kbn-es-query/src/filters/build_filters.ts`**
  - Builds filter objects from UI inputs
  - Creates combined filters for nested groups

## Architecture Flow

```
UI Filter Input
    ↓
Filter Objects (with meta.relation for grouping)
    ↓
Filter AST (internal representation)
    ↓
Elasticsearch Bool Query (must/should/must_not)
    ↓
Preview String (human-readable)
```

## How Filters Are Stored in State

### Filter Object Structure

```typescript
interface Filter {
  meta: {
    type: string;              // 'phrase', 'range', 'exists', 'combined', etc.
    field?: string;            // Field name
    params?: any;              // Filter-specific parameters
    relation?: 'AND' | 'OR';   // For combined filters
    negate?: boolean;          // Whether filter is negated
    disabled?: boolean;         // Whether filter is disabled
    index?: string;            // Index pattern ID
  };
  query?: any;                 // Elasticsearch query
  $state?: {
    store?: string;            // 'appState' or 'globalState'
  };
}
```

### Combined Filters (Nested Groups)

When filters are grouped with AND/OR, Kibana creates a **combined filter**:

```typescript
{
  meta: {
    type: 'combined',
    relation: 'AND' | 'OR',
    params: [Filter, Filter, ...]  // Nested filters
  }
}
```

**Example:**
- Filter1 AND Filter2 → Combined filter with `relation: 'AND'`, `params: [Filter1, Filter2]`
- (Filter1 AND Filter2) OR Filter3 → Combined filter with `relation: 'OR'`, `params: [CombinedFilter(AND), Filter3]`

## How Grouping is Derived

### Operator Precedence

Kibana uses **left-associative** grouping with operator precedence:

1. **AND has higher precedence than OR** (like in boolean algebra)
2. **Left-associative**: `A AND B OR C` → `((A AND B) OR C)`
3. **Parentheses create explicit groups**: `(A OR B) AND C` → Combined filter

### Sequential Processing

Filters are processed **sequentially from left to right**:

1. Start with first filter
2. For each subsequent filter:
   - Get the operator (AND/OR) connecting it to the previous filter
   - If operator is same as previous: extend current group
   - If operator is different: create nested group

**Example:**
```
Filter1 (no op) → Filter2 (AND) → Filter3 (OR) → Filter4 (AND)
```

Results in:
```
((Filter1 AND Filter2) OR Filter3) AND Filter4
```

## How Nested OR Blocks Are Created

### When OR is Used

1. **Single OR between filters**: Creates `bool.should` with `minimum_should_match: 1`
2. **Multiple ORs in sequence**: All added to same `bool.should` array
3. **OR after AND**: Wraps previous AND group in `bool.should`

### minimum_should_match Logic

Kibana sets `minimum_should_match` based on context:

- **OR-only query**: `minimum_should_match: 1` (at least one must match)
- **OR with must clauses**: `minimum_should_match: 1` (still at least one)
- **OR with must_not**: `minimum_should_match: 1`

**Important**: If `should` appears with `must` or `must_not`, `minimum_should_match` defaults to 1.

## When should vs must is Used

### bool.must (AND)
- Used when filters are connected with AND
- All must clauses must match
- No `minimum_should_match` needed

### bool.should (OR)
- Used when filters are connected with OR
- At least one should clause must match (with `minimum_should_match: 1`)
- Can appear with `must` or `must_not`

### bool.must_not (NOT)
- Used for negated filters (`meta.negate: true`)
- Also used for operators like `is_not`, `does_not_exist`

## How Negated Filters Are Handled

### Negation at Filter Level

Filters with `meta.negate: true` are wrapped in `bool.must_not`:

```typescript
// Filter: { meta: { negate: true }, query: { term: { field: 'value' } } }
// Becomes:
{
  bool: {
    must_not: [{ term: { field: 'value' } }]
  }
}
```

### Negation at Operator Level

Operators like `is_not`, `does_not_exist` create `must_not` queries directly:

```typescript
// Operator: 'is_not'
// Becomes:
{
  bool: {
    must_not: [{ term: { field: 'value' } }]
  }
}
```

## How Disabled Filters Are Ignored

### Filtering Logic

1. **Before AST building**: Disabled filters (`meta.disabled: true`) are filtered out
2. **Empty result**: If all filters are disabled, returns `match_all` query
3. **Partial disable**: Only enabled filters are included in the query

### Implementation

```typescript
const enabledFilters = filters.filter(f => !f.meta?.disabled);
```

## Preview String Generation

### Format

- **Simple filter**: `field: value`
- **Negated filter**: `NOT field: value`
- **Range filter**: `field: > min and < max`
- **Exists filter**: `field: exists`
- **Groups**: `(filter1 AND filter2) OR filter3`

### Parentheses Rules

1. **Same operators**: No parentheses needed
   - `A AND B AND C` → `A AND B AND C`

2. **Different operators**: Parentheses when operator changes
   - `A AND B OR C` → `(A AND B) OR C`
   - `A OR B AND C` → `(A OR B) AND C`

3. **Nested groups**: Parentheses around nested groups
   - `(A OR B) AND C` → `(A OR B) AND C`

### Operator Display

- AND: ` AND ` (with spaces)
- OR: ` OR ` (with spaces)
- NOT: `NOT ` (prefix, no space after)

## Key Implementation Details

### 1. Left-Associative Grouping

Kibana processes filters **left-to-right**, creating nested groups when operators change:

```typescript
// Input: [Filter1, Filter2(AND), Filter3(OR), Filter4(AND)]
// Process:
// 1. Filter1 (start)
// 2. Filter2 with AND → (Filter1 AND Filter2)
// 3. Filter3 with OR → ((Filter1 AND Filter2) OR Filter3)
// 4. Filter4 with AND → (((Filter1 AND Filter2) OR Filter3) AND Filter4)
```

### 2. Combined Filter Structure

Nested groups are represented as combined filters:

```typescript
{
  meta: {
    type: 'combined',
    relation: 'OR',
    params: [
      {
        meta: { type: 'combined', relation: 'AND', params: [Filter1, Filter2] }
      },
      Filter3
    ]
  }
}
```

### 3. Recursive Query Building

The AST is converted to ES query recursively:

```typescript
function astToEsQuery(node):
  if node is filter:
    return filter.query (with negation handling)
  if node is bool:
    return {
      bool: {
        must: map(astToEsQuery, node.must),
        should: map(astToEsQuery, node.should),
        must_not: map(astToEsQuery, node.must_not)
      }
    }
```

### 4. minimum_should_match Calculation

```typescript
if (bool.should && bool.should.length > 0) {
  if (bool.must && bool.must.length > 0) {
    // OR with AND: minimum_should_match = 1
    bool.minimum_should_match = 1;
  } else {
    // OR only: minimum_should_match = 1
    bool.minimum_should_match = 1;
  }
}
```

## Testing Your Implementation

### Test Cases

1. **Simple AND**: `A AND B` → `{ bool: { must: [A, B] } }`
2. **Simple OR**: `A OR B` → `{ bool: { should: [A, B], minimum_should_match: 1 } }`
3. **Mixed**: `A AND B OR C` → `{ bool: { should: [{ bool: { must: [A, B] } }, C], minimum_should_match: 1 } }`
4. **Nested OR**: `A OR B OR C` → `{ bool: { should: [A, B, C], minimum_should_match: 1 } }`
5. **Negated**: `NOT A` → `{ bool: { must_not: [A] } }`
6. **Disabled**: `A (disabled) AND B` → `{ bool: { must: [B] } }`

## Differences from Simplified Implementations

### Common Mistakes to Avoid

1. **Right-associative grouping**: Kibana uses left-associative, not right
2. **Missing minimum_should_match**: Always set to 1 for should clauses
3. **Ignoring disabled filters**: Must filter out before processing
4. **Incorrect negation**: Negated filters go in `must_not`, not wrapped in `bool.must_not` at top level
5. **Operator precedence**: AND has higher precedence, but Kibana processes left-to-right

## References

- Kibana Source: https://github.com/elastic/kibana/tree/v8.18.1
- ES Query DSL: https://www.elastic.co/guide/en/elasticsearch/reference/8.18/query-dsl-bool-query.html

