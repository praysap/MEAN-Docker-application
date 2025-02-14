import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { environment } from '../../environments/environment';
import { catchError, map, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { RestService } from './rest.service';
import { SessionstorageService } from 'src/app/common/sessionstorage.service';

const USER_KEY = 'auth-user';
@Injectable({
  providedIn: 'root'
})
export class LoginService {
  public uname: any;
  constructor(public http: HttpClient, private restServ: RestService, private sessServ: SessionstorageService) {

  }


  getUserIpold() {

    this.http.get<any>('https://geolocation-db.com/json/')
      .pipe(
        catchError(err => {
          return throwError(err);
        }),
        tap(response => {
          console.log('response.IPv4', response.IPv4);
        })
      )
  }

  getUserIp() {

    // return this.http
    // .get('http://api.ipify.org/?format=json&callback=JSONP_CALLBACK').subscribe().pipe(map((response: any) => 

    // console.log('response',response)
    // ));

    return this.http.get<any>('http://api.ipify.org/?format=json&callback=JSONP_CALLBACK');
    // return this.http.get<any>('http://api.ipify.org/?format=json');
    // return this.http.get<any>('http://api.ipify.org/?format=json');

  }

  login(data: any) {
    const headers = new HttpHeaders();
    headers.append("Content-Type", "application/json");
    this.uname = data.username;
    return this.http.post<any>(`${environment.apiUrl2 + '/login'}`, data).pipe(
      map((res) => {
        // console.log('res',res);
        // localStorage.setItem('user',res.user)
        // this.saveUser(res.user);
        return res;

      }),
      catchError((err) => {
        console.log(err);
        return throwError(err);
      })
    );
  }

  username() {
    return this.uname;
  }
  // getUserList() {
  //   const headers = new HttpHeaders();
  //   headers.append('Content-Type', 'application/json');
  //   return this.http.get<any>(`${environment.viewUsers}`).pipe(
  //     map((res) => {
  //       return res
  //     }),
  //     catchError((err) => {
  //       console.log(err.status)
  //       if (err.status == 400) {
  //         localStorage.removeItem('Token')
  //         localStorage.removeItem('userType')
  //       }
  //       return throwError(err);
  //     })
  //   )
  // }
  getUserList() {
    this.restServ.get(`${environment.apiUrl}`, {}, {}).subscribe(res => {
      console.log("loginser getUserList", res);
      return res;
    });
  }




  public saveUser(user: any): void {
    window.localStorage.removeItem(USER_KEY);
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
  public getUser(): any {
    // const user = window.localStorage.getItem(USER_KEY);
    // if (user) {
    //   return JSON.parse(user);
    // }
    // return {};
    return this.sessServ.getUser();
  }

  getPendingList() {
    this.restServ.get(`${environment.apiUrl}`, {}, {}).subscribe(res => {
      console.log("loginser getPendingList", res);
      return res;
    });
  }


  // edit user
  editUser(data: any) {
    const headers = new HttpHeaders();
    headers.append('Content-Type', 'application/json');
    return this.http.post<any>(`${environment.apiUrl}`, data).pipe(
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


  logOut() {
    this.restServ.get(`${environment.apiUrl2 + '/logout'}`, {}, {}).subscribe(res => {
      // console.log("logout user", res);
      return res;
    });
  }



}
