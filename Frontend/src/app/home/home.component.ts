import { HttpClient } from '@angular/common/http';
import { Component,OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  getChipsData! : Subscription;
  public apiUrl=environment.API_URL;
  constructor(public http: HttpClient) {}

  ngOnInit(): void {
    const currentUrl = window.location.href;
    this.storeCurrentUrl(currentUrl).subscribe(
        //response => console.log(response),
       // error => console.error(error)
    );
  }

  storeCurrentUrl(currentUrl: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/store-info`, { currentUrl });
  }
}
