import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse, HttpClientModule } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { throwError } from 'rxjs/internal/observable/throwError';
import { TimeoutError } from 'rxjs';
// import { catchError } from 'rxjs/internal/operators/catchError';
import { catchError, map } from 'rxjs/operators';
// import { SessionstorageService } from './sessionstorage.service';
import { NotificationService } from './notification.service';
import { Location } from '@angular/common';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RestService {

  constructor(private http: HttpClient, private router: Router, private notificationService: NotificationService, private location: Location) { }

  getUserIp() {
    return this.http.get<any>('http://api.ipify.org/?format=json&callback=JSONP_CALLBACK', { headers: { skip: "true" } });
  }

  getnew(url: any, data: any, headers: any) {
    var headersObj = new HttpHeaders();
    if (headers.contentType) {
      headersObj = headersObj.set('content-type', headers.contentType);
    } else {
      headersObj.append('Content-Type', 'application/json');
    }
    let options = {
      params: (data != null && data.params != null) ? new HttpParams({ fromObject: data.params }) : {},
      headers: headersObj
    };

    return this.http.get<any>(url, options).pipe(
      map((res) => {
        return res;
      }),
      catchError(this.handleError)
    )
  }

  get(url: any, data: any, headers: any) {
    var headersObj = new HttpHeaders();
    if (headers.contentType) {
      headersObj = headersObj.set('content-type', headers.contentType);
    } else {
      headersObj.append('Content-Type', 'application/json');
    }
    let options = {
      params: (data != null && data.params != null) ? new HttpParams({ fromObject: data.params }) : {},
      headers: headersObj
    };
    return this.http.get<any>(url, options).pipe(
      map((res) => {
        return res;
      }),
      catchError((err) => {
        this.handleError(err);
        if (err.status == 400) {
          localStorage.removeItem('Token')
          localStorage.removeItem('userType')
        }
        return throwError(err);
      })
    )
  }
  delete(url: any, data: any, headers: any) {
    var headersObj = new HttpHeaders();
    if (headers.contentType) {
      headersObj = headersObj.set('content-type', headers.contentType);
    } else {
      headersObj.append('Content-Type', 'application/json');
    }
    let options = {
      params: (data != null && data.params != null) ? new HttpParams({ fromObject: data.params }) : {},
      headers: headersObj
    };
    return this.http.delete(url, options).pipe(
      catchError(this.handleError)
    );
  }
  put(url: any, data: any, headers: any) {
    var headersObj = new HttpHeaders();
    if (headers.contentType) {
      headersObj = headersObj.set('content-type', headers.contentType);
    } else {
      headersObj.append('Content-Type', 'application/json');
    }

    return this.http.put(url, data, { headers: headersObj, observe: 'response' }).pipe(
      catchError(this.handleError)
    );
  }


  postLogin = (url: any, data: any) => {
    var headersObj = new HttpHeaders();
    headersObj.append('Content-Type', 'application/json');
    return this.http.post(url, data, { headers: headersObj, observe: 'response' }).pipe(
      catchError(this.handleError)
    );
  }

  post = (url: any, data: any, headers: any) => {
    var headersObj = new HttpHeaders();
    if (headers.contentType) {
      headersObj = headersObj.set('content-type', headers.contentType);
    } else {
      headersObj.append('Content-Type', 'application/json');
    }
    return this.http.post<any>(url, data, { headers: headersObj }).pipe(
      map((res) => {
        return res;
      }),
      catchError((err) => {
        this.handleError(err);
        if (err.status == 400) {
          this.notificationService.showError(err.error.message)
        }
        return throwError(err);
      })
    )
  }

  postpdf = (url: any, data: any, headers: any) => {
    var headersObj = new HttpHeaders();
    headersObj.append('responseType', 'blob');


    return this.http.post(url, data, { responseType: 'blob' });
  }
  postForget(url: any, data: any, headers: any) {
    var headersObj = new HttpHeaders();
    if (headers.contentType) {
      headersObj = headersObj.set('content-type', headers.contentType);
    } else {
      headersObj.append('Content-Type', 'application/json');
    }

    return this.http.post(url, data, { headers: headersObj, observe: 'response' })
      ;
  }

  handleError = (error: HttpErrorResponse) => {
    if (error instanceof TimeoutError) {
      this.notificationService.showWarning("Api failed to get data. Automatic timout.");
    }

    if (error.status === 400) {
      if (error.error.message) {
        this.notificationService.showError(error.error.message);
      }
      localStorage.removeItem('Token')
      localStorage.removeItem('userType')
      this.router.navigate(['login']);

    } else if (error.status === 400) {
    } else if (error.status === 400) {
      console.log('An error occurred:', error.error);
    } else {
      console.log(`Backend returned code ${error.status}, body was: `, error.error);
      if (error && error.error && error.error.message) {
        this.notificationService.showError("Some Error Occoured ");
      }
    }
    return throwError(() => new Error('Something bad happened; please try again later.'));
  }


  getFile(downloadFileUrl: any) {
    // console.log('downloadFileUrl',downloadFileUrl);

    let fileUrl = environment.apiUrl1 + '?filePath=' + downloadFileUrl;
    return this.http.get(fileUrl, { responseType: 'blob' });
  }


  getpdfFile(downloadFileUrl: any) {
    // console.log('downloadFileUrl',downloadFileUrl);

    let fileUrl = downloadFileUrl;
    return this.http.get(fileUrl, { responseType: 'blob' });
  }


  downloadFile(filename: string) {
    console.log('filename', environment.apiUrl1 + '/download?filename=' + filename);

    return this.http.get(environment.apiUrl1 + '/download?filename=' + filename, {
      responseType: 'arraybuffer'
    });
  }

  //  getZipFile(data: any) {
  //   const blob = new Blob([data['_body']], { type: 'application/zip' });

  //   const a: any = document.createElement('a');
  //   document.body.appendChild(a);

  //   a.style = 'display: none';    
  //   const url = window.URL.createObjectURL(blob);
  //   a.href = url;
  //   a.download = 'log.zip';
  //   a.click();
  //   window.URL.revokeObjectURL(url);

  // }

}
