
import { Injectable } from '@angular/core';
import { Router, NavigationEnd, Event as NavigationEvent } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SignupService } from '../core/signup.service';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CurrentUrlService {
  currentUrl: string | undefined;
  clientIp: any;
   

  constructor(private router: Router,private signupService: SignupService,public http: HttpClient 
    ) {
    this.router.events.pipe(
      filter((event: NavigationEvent): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.currentUrl = event.url;
    console.log(this.currentUrl);
   
    });
  }
}