const express = require('express');
const auth = require('../../middleware/auth')
const axios = require('axios');
const path = require('path');
const elasticFilterService = require('../services/elasticFilterService');
const cors = require('cors');
const router = express.Router();

const elasticsearch = require('elasticsearch');

const client = new elasticsearch.Client({
  host: {
    host: '3.148.186.35',
    port: 9200,
    protocol: 'https',
    auth: 'elastic:EeU+n9IeC*VRn7qR8Zqq'
  },
  requestTimeout: 120000
});


// var client = new elasticsearch.Client({
//   host: ['http://192.168.7.26:9200',
//     'http://192.168.7.3:9200'],
//   requestTimeout: 120000,
// });



client.ping( function (error) {
  if (error) {
    console.error('❌ Elasticsearch cluster is DOWN!', error.message);
  } else {
    console.log('✅ Elasticsearch cluster is UP!');
  }
});




router.get('/fields', async (req, res) => {
  try {
    
    const index = 'web-l';
    const mapping = await client.indices.getMapping({ index });

    const fields = new Set();

    const extract = (properties, prefix = '') => {
      for (const key in properties) {
        const fieldPath = prefix ? `${prefix}.${key}` : key;
        const field = properties[key];

        // Nested object
        if (field.properties) {
          extract(field.properties, fieldPath);
        }

        // Normal field (exclude implicit keyword name)
        if (field.type && key !== 'keyword') {
          fields.add(fieldPath);
        }

        // keyword sub-field
        if (field.fields && field.fields.keyword) {
          fields.add(`${fieldPath}.keyword`);
        }
      }
    };

    for (const indexName in mapping) {
      extract(mapping[indexName].mappings.properties);
    }

    
    //console.log('📤 Final extracted fields:', [...fields]);

    res.json([...fields]);

  } catch (err) {
    console.error('❌ Error in /fields API:', err);
    res.status(500).json({ error: 'Failed to fetch fields' });
  }
});


router.get('/field-values',  async (req, res) => {
  try {
    const { field, search, size, filters } = req.query;
    
    if (!field) {
      return res.status(400).json({ 
        error: 'Field parameter is required',
        message: 'Please provide a field name to fetch values for'
      });
    }

    const index = 'web-l';
    
    // Parse existing filters if provided (for context-aware filtering like Kibana)
    let existingFilters = null;
    if (filters) {
      try {
        existingFilters = typeof filters === 'string' ? JSON.parse(filters) : filters;
      } catch (parseError) {
        console.warn('Failed to parse existing filters for field values:', parseError);
        // Continue without context filters if parsing fails
      }
    }

    // Prepare options for the filter service
    const options = {
      searchTerm: search || null,
      size: size ? parseInt(size) : 100,
      existingFilters: existingFilters
    };

    // Use the dedicated filter service to get field values (Kibana-like behavior)
    const values = await elasticFilterService.getFieldValues(
      client,
      index,
      field,
      options
    );

    // Return values as array (for dropdown population)
    res.json(values);

  } catch (err) {
    console.error('Error fetching field values:', err);
    
    // Handle specific error types with proper HTTP status codes
    if (err.message && err.message.includes('not aggregatable')) {
      return res.status(400).json({
        error: 'Field is not aggregatable',
        message: err.message,
        suggestion: 'Use the .keyword version of this field if available (e.g., "message.keyword" instead of "message")'
      });
    }
    
    if (err.message && err.message.includes('does not exist')) {
      return res.status(404).json({
        error: 'Field not found',
        message: err.message
      });
    }
    
    // Handle Elasticsearch-specific errors
    if (err.meta && err.meta.body) {
      const esError = err.meta.body.error;
      if (esError) {
        return res.status(400).json({
          error: 'Elasticsearch error',
          message: esError.reason || err.message || 'Failed to fetch field values',
          type: esError.type
        });
      }
    }
    
    // Generic error response
    res.status(500).json({
      error: 'Failed to fetch field values',
      message: err.message || 'Unknown error occurred'
    });
  }
});

router.post('/web-logs-search',  async (req, res) => {
  try {
    const {
      queryDSL,
      page = 0,
      size = 10,
      sortField = '@timestamp',
      sortOrder = 'desc'
    } = req.body;

    const index = 'web-l';
    
    // Build query from Query DSL or use default
    let queryBody = {
      query: {
        match_all: {}
      },
      sort: [
        {
          [sortField]: {
            order: sortOrder
          }
        }
      ]
    };

    // If Query DSL is provided, use it
    if (queryDSL && queryDSL.query) {
      queryBody.query = queryDSL.query;
    }

    const result = await client.search({
      index,
      from: page * size,
      size,
      body: queryBody
    });

    // Format response similar to Kibana
    const hits = result.hits.hits.map(hit => ({
      _id: hit._id,
      _index: hit._index,
      _source: hit._source,
      _score: hit._score
    }));

    res.json({
      total: result.hits.total?.value || result.hits.total,
      hits: hits,
      data: hits.map(h => h._source) // For backward compatibility
    });

  } catch (err) {
    console.error('Elasticsearch Error:', err.meta?.body || err);
    res.status(500).json({
      error: 'Elasticsearch query failed',
      message: err.message
    });
  }
});



module.exports = router