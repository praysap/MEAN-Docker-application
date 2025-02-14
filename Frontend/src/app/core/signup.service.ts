import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class SignupService {

  constructor(private http: HttpClient) { }

  public apiUrl = environment.API_URL;
 

  storeCurrentUrl(currentUrl: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/store-info`, { currentUrl });
}

  getUserIpold() {
   const dataset='/signup'
    return this.http.get<any>('https://geolocation-db.com/json/')
    .pipe(
      catchError(err => {
        return throwError(err);
      }),
      tap(response => {
        console.log('response.IPv4', response.IPv4);
        // Call a method to send the data to your server

        this.sendDataToServer(response,dataset);
      })
    )
    .subscribe();
  }

   sendDataToServer(data: any,dataset :string) {
    // console.log("---send data to servers",this.sendDataToServer)
    // Assuming you have an API endpoint on your server to handle the data
    const apiUrl = environment.saveUserData;
    const body=({
      data,dataset
    })
    return this.http.post(apiUrl, body)
      .subscribe(
        response => {
          console.log('Data sent to server:', response);
        },
        error => {
          console.error('Error sending data to server:', error);
        }
      );
  }

  getClientIp1(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }
  signUp(data: any) {
    const headers = new HttpHeaders();
    headers.append("Content-Type", "application/json");
    return this.http.post<any>(`${environment.createUser}`, data, { observe: 'response' }).pipe(
      map((res) => {
        return res;
      }),
      catchError((err) => {
        console.log(err);
        // this.notiServ.showError(err.error.details);
        return throwError(err);

      })
    );
  }


}