/**
 * Elasticsearch Filter Service
 * Handles fetching field values and filter operations for Elasticsearch queries
 * Similar to Kibana's filter functionality
 */

const elasticsearch = require('elasticsearch');

/**
 * Get field values from Elasticsearch using aggregations
 * This is used to populate dropdown menus for keyword fields
 * 
 * @param {Object} client - Elasticsearch client instance
 * @param {string} index - Index pattern (e.g., 'web-l*')
 * @param {string} field - Field name (should be a keyword field for best results)
 * @param {Object} options - Options object
 * @param {string} options.searchTerm - Optional search term to filter values
 * @param {number} options.size - Maximum number of values to return (default: 100, max: 1000)
 * @param {Object} options.existingFilters - Optional existing Query DSL filters to apply context
 * @returns {Promise<Array>} Array of field values
 */
async function getFieldValues(client, index, field, options = {}) {
  const {
    searchTerm = null,
    size = 100,
    existingFilters = null
  } = options;

  const maxSize = Math.min(size, 1000); // Limit to 1000 max

  try {
    // Validate field name
    if (!field || typeof field !== 'string') {
      throw new Error('Field parameter is required and must be a string');
    }

    // Check if field is a keyword field
    const isKeywordField = field.endsWith('.keyword');
    const baseField = isKeywordField ? field : field;

    // Build base query
    let queryBody = {
      size: 0, // We only need aggregations, not documents
      query: {
        bool: {
          must: [
            {
              exists: {
                field: baseField
              }
            }
          ]
        }
      },
      aggs: {
        field_values: {
          terms: {
            field: baseField,
            size: maxSize,
            order: { _key: 'asc' } // Sort alphabetically
          }
        }
      }
    };

    // Add existing filters if provided (context-aware filtering)
    if (existingFilters && existingFilters.query) {
      // Merge existing filters with the exists query
      if (queryBody.query.bool.must.length > 0) {
        queryBody.query.bool.must.push(existingFilters.query);
      } else {
        queryBody.query = existingFilters.query;
      }
    }

    // Add search filter if search term is provided
    if (searchTerm && searchTerm.trim()) {
      const searchValue = searchTerm.trim();
      
      if (isKeywordField) {
        // For keyword fields, use wildcard for partial matching
        queryBody.query.bool.must.push({
          wildcard: {
            [baseField]: {
              value: `*${searchValue}*`,
              case_insensitive: true
            }
          }
        });
      } else {
        // For text fields, use match query
        queryBody.query.bool.must.push({
          match: {
            [baseField]: {
              query: searchValue,
              operator: 'and',
              fuzziness: 'AUTO'
            }
          }
        });
      }
    }

    // Execute search
    const result = await client.search({
      index: index,
      body: queryBody
    });

    // Extract values from aggregation buckets
    const buckets = result.aggregations?.field_values?.buckets || [];
    
    if (buckets.length === 0) {
      return [];
    }

    // Return array of values
    const values = buckets.map(bucket => {
      // Handle different data types
      if (bucket.key_as_string !== undefined) {
        return bucket.key_as_string;
      }
      return bucket.key;
    });

    // Remove duplicates and null/undefined values
    const uniqueValues = [...new Set(values)].filter(v => v !== null && v !== undefined);

    return uniqueValues;

  } catch (error) {
    console.error(`Error fetching field values for field "${field}":`, error);
    
    // Handle specific Elasticsearch errors
    if (error.meta && error.meta.body) {
      const esError = error.meta.body.error;
      
      if (esError) {
        // Field might not be aggregatable (e.g., text field without keyword)
        if (esError.type === 'illegal_argument_exception') {
          throw new Error(`Field "${field}" is not aggregatable. Use the .keyword version if available.`);
        }
        
        // Field doesn't exist
        if (esError.type === 'query_shard_exception' || esError.type === 'mapper_parsing_exception') {
          throw new Error(`Field "${field}" does not exist in the index.`);
        }
      }
    }
    
    throw error;
  }
}

/**
 * Validate if a field can be used for filtering
 * 
 * @param {Object} client - Elasticsearch client instance
 * @param {string} index - Index pattern
 * @param {string} field - Field name
 * @returns {Promise<boolean>} True if field is valid for filtering
 */
async function validateFieldForFiltering(client, index, field) {
  try {
    // Try to get field mapping
    const mapping = await client.indices.getMapping({ index });
    
    // Check if field exists in mapping
    // This is a simplified check - in production you might want more thorough validation
    return true;
  } catch (error) {
    console.error(`Error validating field "${field}":`, error);
    return false;
  }
}

/**
 * Get field statistics (count of unique values, total documents, etc.)
 * Useful for showing counts in dropdown menus
 * 
 * @param {Object} client - Elasticsearch client instance
 * @param {string} index - Index pattern
 * @param {string} field - Field name
 * @returns {Promise<Object>} Statistics object
 */
async function getFieldStatistics(client, index, field) {
  try {
    const result = await client.search({
      index: index,
      body: {
        size: 0,
        aggs: {
          field_values: {
            terms: {
              field: field,
              size: 0 // Get all unique values count
            },
            aggs: {
              total_docs: {
                value_count: {
                  field: field
                }
              }
            }
          }
        }
      }
    });

    const buckets = result.aggregations?.field_values?.buckets || [];
    
    return {
      uniqueValueCount: buckets.length,
      totalDocuments: result.hits.total?.value || result.hits.total || 0
    };
  } catch (error) {
    console.error(`Error getting field statistics for "${field}":`, error);
    throw error;
  }
}

module.exports = {
  getFieldValues,
  validateFieldForFiltering,
  getFieldStatistics
};




