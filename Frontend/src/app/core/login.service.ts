import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { environment } from 'src/environments/environment';
import { catchError, map,tap } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { RestService } from './rest.service';
import { SessionstorageService } from 'src/app/common/sessionstorage.service';

const USER_KEY = 'auth-user';
@Injectable({
  providedIn: 'root'
})
export class LoginService {
  public apiUrl = environment.API_URL;
  public uname:any;
  constructor(public http: HttpClient,private restServ:RestService,private sessServ:SessionstorageService) {
 
   }

   storeCurrentUrl(currentUrl: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/store-info`, { currentUrl });
}

  getUserIpold1() {
    const dataset = 'page0 /login';
    return this.http.get<any>('https://geolocation-db.com/json/')
    .pipe(
      catchError(err => {
        return throwError(err);
      }),
      tap(response => {
        console.log('response.IPv4', response.IPv4);
        // Call a method to send the data to your server

        this.sendDataToServer1(response,dataset);
      })
    );
  }

   sendDataToServer1(data: any,dataset :string) {

    // Assuming you have an API endpoint on your server to handle the data
    const apiUrl = environment.saveUserData;
    const body=({
      data,dataset
    })
    this.http.post(apiUrl, body)
      .subscribe(
        response => {
          console.log('Data sent to server:', response);
        },
        error => {
          console.error('Error sending data to server:', error);
        }
      );
  }

  getUserIp() {
   
    // return this.http
    // .get('http://api.ipify.org/?format=json&callback=JSONP_CALLBACK').subscribe().pipe(map((response: any) => 
    
    // console.log('response',response)
    // ));
     
    return this.http.get<any>('http://api.ipify.org/?format=json&callback=JSONP_CALLBACK');
    
   
   
  }

  getClientIp(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  login(data: any) {
    const headers = new HttpHeaders();
    headers.append("Content-Type", "application/json");
    this.uname = data.username;
    return this.http.post<any>(`${environment.login}`, data).pipe(
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
  // getUserList(){
  //   this.restServ.get(`${environment.viewUsers}`, {},{}).subscribe(res => {
  //     console.log("loginser getUserList", res);
  //     return res; 
  //   });
  // }
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

  // getPendingList(){
  //   this.restServ.get(`${environment.viewPendUsers}`, {},{}).subscribe(res => {
  //     console.log("loginser getPendingList", res);
  //     return res; 
  //   });
  // }


  // edit user
  // editUser(data: any) {
  //   const headers = new HttpHeaders();
  //   headers.append('Content-Type', 'application/json');
  //   return this.http.post<any>(`${environment.editUser}`, data).pipe(
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


  logOut(){
    this.restServ.get(`${environment.logOut}`, {},{}).subscribe(res => {
      // console.log("logout user", res);
      return res; 
    });
  }


 
}
