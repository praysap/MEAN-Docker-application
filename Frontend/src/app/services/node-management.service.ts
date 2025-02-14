import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NodeManagementService {

  constructor(private http: HttpClient) { }

  // get honeypot node details
  getSectorData() {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    headers.append('Accept', 'application/json');
    return this.http.get<any>(`${environment.honeypotDetail}`).pipe(
      map((res) => {
        return res
      }),
      catchError((err) => {
        console.log(err.status)
        if (err.status == 400) {
          localStorage.removeItem('Token')
          localStorage.removeItem('userType')
        }
        return throwError(err);
      })
    )
  }

  // get node details
  getNodeDetails() {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    headers.append('Accept', 'application/json');
    return this.http.get<any>(`${environment.nodeDetail}`).pipe(
      map((res) => {
        return res
      }),
      catchError((err) => {
        console.log(err.status)
        if (err.status == 400) {
          localStorage.removeItem('Token')
          localStorage.removeItem('userType')
        }
        return throwError(err);
      })
    )
  }

  // get node details
  getRegion(type: string) {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    headers.append('Accept', 'application/json');
    let url = environment.eventsData + '/' + type
    return this.http.get<any>(`${url}`).pipe(
      map((res) => {
        return res
      }),
      catchError((err) => {
        console.log('getRegion error', err.status)
        return throwError(err);
      })
    )
  }

  // get Threat details
  getThreatData(data: any) {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    headers.append('Accept', 'application/json');
    let url = environment.threatEvents + '/';
    return this.http.post<any>(`${url}`, { data }).pipe(
      map((res) => {
        return res
      }),
      catchError((err) => {
        console.log(err.status)

        return throwError(err);
      })
    )
  }

  // get Threat details
  getStateWiseAttackData(startDate: any, endDate: any) {
    let url = environment.stateWiseAttackData;
    return this.http.get<any>(`${url}`, {
        params: {
          start_date: startDate, end_date: endDate
        }
      }).pipe(
        map((res) => {
          return res
        }),
        catchError((err) => {
          console.log(err.status)
          return throwError(err);
        })
      )
  }

}
