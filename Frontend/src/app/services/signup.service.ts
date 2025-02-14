import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { NotificationService } from './notification.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class SignupService {

  constructor(private http: HttpClient, private notiServ: NotificationService, private router: Router) { }

  signUp(data: any) {
    const headers = new HttpHeaders();
    headers.append("Content-Type", "application/json");
    return this.http.post<any>(`${environment.createUser}`, data, { observe: 'response' }).pipe(
      map((res) => {
        return res;
      }),
      catchError((err) => {

        this.notiServ.showError(err.error.message);
        return throwError(err);

      })
    );
  }


}