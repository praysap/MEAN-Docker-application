import { Component, OnInit, OnDestroy, OnChanges, SimpleChanges, Input, Output, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { FilterGroup } from '../filter.model';
import { Subscription } from 'rxjs';

interface LogEntry {
  _id?: string;
  _index?: string;
  expanded?: boolean;
  _source: {
    [key: string]: any;
     // Flexible structure to support all field types
  };
}

@Component({
  selector: 'app-kibana-data-table',
  templateUrl: './kibana-data-table.component.html',
  styleUrls: ['./kibana-data-table.component.scss']
})
export class KibanaDataTableComponent implements OnInit, OnDestroy, OnChanges {
  @Input() filters: FilterGroup | null = null;
  @Output() dataLoaded = new EventEmitter<any>();

  logs: LogEntry[] = [];
  totalHits: number = 0;
  currentPage: number = 0;
  
  pageSize: number = 100;
  loading: boolean = false;
  error: string | null = null;
  
  

  // Default visible fields (subset for initial display)
  selectedFields: string[] = [
    '@timestamp',
    '@version',
    'WAF_DATE',
    'WAF_TIME',
    'agent.ephemeral_id',
    'agent.hostname',
    'agent.id',
    'agent.name',
    'agent.type',
    'agent.version',
    'ecs.version',
    'hname',
    'host.architecture',
    'host.containerized',
    'host.hostname',
    'host.id',
    'host.ip',
    'host.mac',
    'host.name',
    'host.os.family',
    'host.os.kernel',
    'host.os.name',
    'host.os.platform',
    'host.os.type',
    'host.os.version',
    'input.type',
    'iptype',
    'iptype_dst',
    'log.file.path',
    'log.offset',
    'log_id',
    'logcat',
    'logfilepath',
    'logname',
    'message',
    'region',
    'request',
    'siem_dstip',
    'siem_firewall',
    'siem_hostname',
    'siem_logname',
    'siem_shostname',
    'siem_sourceip',
    'siem_sourceip_geoip.city_name',
    'siem_sourceip_geoip.continent_code',
    'siem_sourceip_geoip.country_code2',
    'siem_sourceip_geoip.country_code3',
    'siem_sourceip_geoip.country_name',
    'siem_sourceip_geoip.dma_code',
    'siem_sourceip_geoip.ip',
    'siem_sourceip_geoip.latitude',
    'siem_sourceip_geoip.location.lat',
    'siem_sourceip_geoip.location.lon',
    'siem_sourceip_geoip.longitude',
    'siem_sourceip_geoip.postal_code',
    'siem_sourceip_geoip.region_code',
    'siem_sourceip_geoip.region_name',
    'siem_sourceip_geoip.timezone',
    'siem_waf_dstport',
    'siem_waf_srcport',
    'tags',
    'timestamp',
    'useragent',
    'verb',
    'waf_action',
    'waf_content_switch_name',
    'waf_device_id',
    'waf_dst',
    'waf_dst_port',
    'waf_http_agent',
    'waf_http_host',
    'waf_http_method',
    'waf_http_session_id',
    'waf_http_url',
    'waf_msg',
    'waf_msg_id',
    'waf_policy',
    'waf_pri',
    'waf_proto',
    'waf_server_pool_name',
    'waf_service',
    'waf_severity_level',
    'waf_signature_id',
    'waf_signature_subclass',
    'waf_src',
    'waf_src_port',
    'waf_srccountry',
    'waf_subtype',
    'waf_timezone',
    'waf_type',
    'waf_vd',
    'wafmessage',
  ];

  sortField: string = '@timestamp';
  sortOrder: 'asc' | 'desc' = 'desc';
  
  private searchSubscription?: Subscription;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  ngOnChanges(): void {
    if (this.filters) {
      this.currentPage = 0;
      this.loadData();
    }
  }

  loadData(): void {
    this.loading = true;
    this.error = null;

    const payload: any = {
      page: this.currentPage,
      size: this.pageSize,
      sortField: this.sortField,
      sortOrder: this.sortOrder
    };

    // Add Query DSL if filters are provided
    if (this.filters && this.filters.queryDSL) {
      payload.queryDSL = this.filters.queryDSL;
    }

    this.searchSubscription = this.http.post<any>(
      environment.webLogsSearch,
      payload
    ).subscribe(
      (response) => {
        this.logs = response.hits || response.data || [];
        this.totalHits = response.total || 0;
        this.loading = false;
        this.dataLoaded.emit({
          logs: this.logs,
          total: this.totalHits
        });
      },
      (error) => {
        console.error('Error loading data:', error);
        this.error = error.error?.message || 'Failed to load data';
        this.loading = false;
        this.logs = [];
      }
    );
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadData();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 0;
    this.loadData();
  }

  onSort(field: string): void {
    if (this.sortField === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortOrder = 'desc';
    }
    this.loadData();
  }

  getTotalPages(): number {
    return Math.ceil(this.totalHits / this.pageSize);
  }

  formatTimestamp(timestamp: string | undefined): string {
    if (!timestamp) return '-';
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    } catch {
      return timestamp;
    }
  }

  getFieldValue(entry: LogEntry, field: string): any {
    const source = entry._source || {};
    
    // Handle nested field paths (e.g., 'agent.ephemeral_id', 'host.os.family')
    if (field.includes('.')) {
      const fieldParts = field.split('.');
      let value = source;
      
      for (const part of fieldParts) {
        if (value && typeof value === 'object' && part in value) {
          value = value[part];
        } else {
          return '-';
        }
      }
      
      // Format the value for display
      if (value === null || value === undefined) {
        return '-';
      }
      
      // If it's an object or array, stringify it
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      
      return value;
    }
    
    // Handle simple field access
    const value = source[field];
    if (value === null || value === undefined) {
      return '-';
    }
    
    // If it's an object or array, stringify it
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    return value;
  }

  isFieldHighlighted(entry: LogEntry, field: string): boolean {
    if (!this.filters || !this.filters.filters) {
      return false;
    }

    // Check if this field matches any active filter (Kibana-style highlighting)
    return this.filters.filters.some(filter => {
      // Normalize field comparison (handle .keyword suffix)
      const filterField = filter.field || '';
      const baseField = field.replace('.keyword', '');
      const baseFilterField = filterField.replace('.keyword', '');
      
      if (baseFilterField !== baseField && filterField !== field) {
        return false;
      }

      // Use the full field path for getting the value (handles nested fields)
      const fieldValue = this.getFieldValue(entry, field);
      const filterValue = filter.value;
      const normalizedOperator = this.normalizeOperator(filter.operator);

      // Apply highlighting based on filter operator
      switch (normalizedOperator) {
        case 'is':
          // Highlight exact matches
          return String(fieldValue) === String(filterValue);
        case 'is_not':
          // Highlight non-matching values
          return String(fieldValue) !== String(filterValue);
        case 'is_one_of':
          // Highlight if field value is in the list
          const values = Array.isArray(filterValue) 
            ? filterValue.map(v => String(v))
            : String(filterValue).split(',').map(v => v.trim());
          return values.includes(String(fieldValue));
        case 'is_not_one_of':
          // Highlight if field value is NOT in the list
          const notValues = Array.isArray(filterValue) 
            ? filterValue.map(v => String(v))
            : String(filterValue).split(',').map(v => v.trim());
          return !notValues.includes(String(fieldValue));
        case 'exists':
          // Highlight if field exists (has value)
          return fieldValue !== '-' && fieldValue !== null && fieldValue !== undefined;
        case 'does_not_exist':
          // Highlight if field doesn't exist (missing or null)
          return fieldValue === '-' || fieldValue === null || fieldValue === undefined;
        default:
          return false;
      }
    });
  }

  normalizeOperator(operator: string): string {
    // Map various operator formats to standard format
    const operatorMap: { [key: string]: string } = {
      'is': 'is',
      'isNot': 'is_not',
      'is_not': 'is_not',
      'terms': 'is_one_of',
      'is_one_of': 'is_one_of',
      'notTerms': 'is_not_one_of',
      'is_not_one_of': 'is_not_one_of',
      'exists': 'exists',
      'notExists': 'does_not_exist',
      'does_not_exist': 'does_not_exist'
    };
    return operatorMap[operator] || operator;
  }

  toggleFieldSelection(field: string): void {
    const index = this.selectedFields.indexOf(field);
    if (index > -1) {
      this.selectedFields.splice(index, 1);
    } else {
      this.selectedFields.push(field);
    }
  }

  expandRow(entry: LogEntry): void {
    // Toggle expansion state
  entry.expanded = !entry.expanded;
  }

  getObjectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }
}

