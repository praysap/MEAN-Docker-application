import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardserviceService {

  constructor(public http: HttpClient) { }

  filterControl = new BehaviorSubject({})



  findOne(data: any) {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    headers.append('Accept', 'application/json');
    return this.http.post<any>(`${environment.findeone}/`, data).pipe(
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

}
