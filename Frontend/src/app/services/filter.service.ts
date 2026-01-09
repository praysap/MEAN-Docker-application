import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';



@Injectable({ providedIn: 'root' })
export class FilterService {


  constructor(private http: HttpClient) {}

 getFields() {
    return this.http.get<any[]>(environment.getfields);
  }


  getFieldValues(field: string, searchTerm?: string) {
    let params = new HttpParams().set('field', field);
    if (searchTerm) {
      params = params.set('search', searchTerm);
    }
    return this.http.get<any[]>(environment.getfiledvalues, { params });
  }
}
