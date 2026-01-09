/**
 * Filter Service
 * Handles building Elasticsearch Query DSL from Kibana-style filter objects
 * Uses elastic-builder for proper query construction
 */

const esb = require('elastic-builder');

/**
 * Build Elasticsearch Query DSL from Kibana-style filter objects
 * Based on Kibana filter operators: is, is not, is one of, is not one of, exists, does not exist
 * 
 * @param {Array} filters - Array of filter objects with structure: { field, operator, value, logic }
 * @param {string} defaultIndex - Default index pattern to use (optional)
 * @returns {Object} Elasticsearch Query DSL object
 */
function buildElasticsearchQuery(filters, defaultIndex = null) {
  if (!filters || !Array.isArray(filters) || filters.length === 0) {
    // Return match_all query if no filters
    return {
      query: {
        match_all: {}
      }
    };
  }

  // Group queries: OR conditions form groups, AND conditions separate groups
  const queryGroups = [];
  let currentGroup = [];

  filters.forEach((filter, index) => {
    if (!filter.field || !filter.operator) {
      return; // Skip invalid filters
    }

    const field = filter.field;
    const operator = filter.operator;
    const value = filter.value;
    const logic = filter.logic || 'AND';

    // Determine if field is a keyword field (for exact matches)
    const isKeywordField = field.endsWith('.keyword');
    const baseField = field; // Use field as-is for Elasticsearch

    let query = null;

    // Build query based on operator (following Kibana filter mappings)
    switch (operator) {
      case 'is':
      case 'IS':
        // Field exactly matches a single value
        // Use term query for keyword fields, match for text fields
        if (isKeywordField) {
          query = esb.termQuery(field, value);
        } else {
          query = esb.matchQuery(field, value);
        }
        break;

      case 'is_not':
      case 'isNot':
      case 'IS_NOT':
        // Field does not exactly match a single value
        if (isKeywordField) {
          query = esb.boolQuery().mustNot(esb.termQuery(field, value));
        } else {
          query = esb.boolQuery().mustNot(esb.matchQuery(field, value));
        }
        break;

      case 'is_one_of':
      case 'terms':
      case 'TERMS':
        // Field matches any of multiple values
        const values = Array.isArray(value) 
          ? value 
          : (typeof value === 'string' ? value.split(',').map(v => v.trim()) : [value]);
        query = esb.termsQuery(field, values);
        break;

      case 'is_not_one_of':
      case 'notTerms':
      case 'NOT_TERMS':
        // Field matches none of multiple values
        const notValues = Array.isArray(value) 
          ? value 
          : (typeof value === 'string' ? value.split(',').map(v => v.trim()) : [value]);
        query = esb.boolQuery().mustNot(esb.termsQuery(field, notValues));
        break;

      case 'exists':
      case 'EXISTS':
        // Field has any value (is present)
        query = esb.existsQuery(field);
        break;

      case 'does_not_exist':
      case 'notExists':
      case 'NOT_EXISTS':
        // Field is missing or null
        query = esb.boolQuery().mustNot(esb.existsQuery(field));
        break;

      case 'range':
      case 'RANGE':
        // Range query with min and max operators
        const rangeQuery = {};
        if (filter.minValue) {
          rangeQuery[filter.minOperator || 'gt'] = filter.minValue;
        }
        if (filter.maxValue) {
          rangeQuery[filter.maxOperator || 'lt'] = filter.maxValue;
        }
        if (Object.keys(rangeQuery).length > 0) {
          query = esb.rangeQuery(field, rangeQuery);
        } else {
          console.warn('Range filter requires at least one value');
          return; // Skip invalid range filters
        }
        break;

      case 'prefix':
      case 'PREFIX':
        // Prefix query - matches documents where field starts with the given value
        if (!value) {
          console.warn('Prefix filter requires a value');
          return; // Skip invalid prefix filters
        }
        // Use prefix query for keyword fields, wildcard for text fields
        if (isKeywordField) {
          query = esb.prefixQuery(field, value);
        } else {
          // For text fields, use wildcard with prefix pattern
          query = esb.wildcardQuery(field, `${value}*`).caseInsensitive(true);
        }
        break;

      case 'wildcard':
      case 'WILDCARD':
        // Wildcard query - matches documents using wildcard patterns (* and ?)
        if (!value) {
          console.warn('Wildcard filter requires a value');
          return; // Skip invalid wildcard filters
        }
        // Use wildcard query for both keyword and text fields
        query = esb.wildcardQuery(field, value).caseInsensitive(true);
        break;

      case 'query_string':
      case 'queryString':
      case 'QUERY_STRING':
        // Query String query - uses Lucene query syntax
        if (!value) {
          console.warn('Query string filter requires a value');
          return; // Skip invalid query string filters
        }
        // Query string works on both keyword and text fields
        query = esb.queryStringQuery(value).defaultField(field);
        break;

      default:
        console.warn(`Unknown filter operator: ${operator}`);
        return; // Skip unknown operators
    }

    if (!query) {
      return; // Skip if query wasn't built
    }

    const queryJSON = query.toJSON();

    // Group queries: OR conditions form groups, AND conditions separate groups
    if (index === 0) {
      // First query always starts a group
      currentGroup.push(queryJSON);
    } else {
      if (logic === 'OR' || logic === 'or') {
        // Add to current OR group
        currentGroup.push(queryJSON);
      } else {
        // AND - close current group and start new one
        if (currentGroup.length > 0) {
          if (currentGroup.length === 1) {
            // Single query in group - add directly
            queryGroups.push(currentGroup[0]);
          } else {
            // Multiple queries in group - wrap in bool.should
            queryGroups.push({
              bool: {
                should: currentGroup,
                minimum_should_match: 1
              }
            });
          }
          currentGroup = [queryJSON];
        }
      }
    }
  });

  // Add the last group
  if (currentGroup.length > 0) {
    if (currentGroup.length === 1) {
      queryGroups.push(currentGroup[0]);
    } else {
      queryGroups.push({
        bool: {
          should: currentGroup,
          minimum_should_match: 1
        }
      });
    }
  }

  // Build final bool query - all groups are combined with AND (bool.must)
  const boolQuery = esb.boolQuery();

  if (queryGroups.length > 0) {
    boolQuery.must(queryGroups);
  }

  // Return Query DSL object
  const queryDSL = {
    query: boolQuery.toJSON()
  };

  return queryDSL;
}

/**
 * Convert Query DSL object to Elasticsearch query body
 * This is a helper function that ensures proper format
 * 
 * @param {Object} queryDSL - Query DSL object from buildElasticsearchQuery
 * @returns {Object} Elasticsearch query body ready for client.search()
 */
function queryDSLToElasticsearchBody(queryDSL) {
  if (!queryDSL || !queryDSL.query) {
    return {
      query: {
        match_all: {}
      }
    };
  }

  return {
    query: queryDSL.query
  };
}

/**
 * Build filter query from request (for backward compatibility)
 * Processes filters from request query parameter
 * 
 * @param {Object} req - Express request object
 * @returns {Object} Elasticsearch Query DSL object or null
 */
function processFiltersFromRequest(req) {
  if (!req.query || !req.query.filters) {
    return null;
  }

  try {
    const queryDSL = JSON.parse(req.query.filters);
    return queryDSL;
  } catch (parseErr) {
    console.error('Error parsing filters from request:', parseErr);
    return null;
  }
}

/**
 * Build Elasticsearch query from request filters
 * 
 * @param {Object} req - Express request object
 * @param {Array} defaultFilters - Optional default filters to apply
 * @returns {Object} Elasticsearch Query DSL object
 */
function buildQueryFromRequest(req, defaultFilters = []) {
  // Try to get filters from request query
  let filters = defaultFilters;
  
  if (req.query && req.query.filters) {
    try {
      const queryDSL = JSON.parse(req.query.filters);
      // If it's already a Query DSL object, return it
      if (queryDSL.query) {
        return queryDSL;
      }
      // If it's an array of filters, use it
      if (Array.isArray(queryDSL)) {
        filters = queryDSL;
      }
    } catch (parseErr) {
      console.error('Error parsing filters from request:', parseErr);
    }
  }

  // If filters is an array, build query from it
  if (Array.isArray(filters) && filters.length > 0) {
    return buildElasticsearchQuery(filters);
  }

  // Return match_all as default
  return {
    query: {
      match_all: {}
    }
  };
}

module.exports = {
  buildElasticsearchQuery,
  queryDSLToElasticsearchBody,
  processFiltersFromRequest,
  buildQueryFromRequest
};
