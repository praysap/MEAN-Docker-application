import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree,Router } from '@angular/router';
import { Observable } from 'rxjs';
import { SessionstorageService } from './app/common/sessionstorage.service';
@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  // loginRole: any;
  constructor(
    private router: Router,
    private localstorage: SessionstorageService,
  ) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
      let url: string = state.url;
      return this.checkUserLogin(next, url);
  }
  checkUserLogin(route: ActivatedRouteSnapshot, url: any): boolean {

    // console.log("route.data['role']",route.data['role']);
    
    let isLoggedIn = this.localstorage.getToken();
    // console.log("==========>>>>>",isLoggedIn)
    // console.log("===>>>",isLoggedIn)
    if(isLoggedIn == undefined || isLoggedIn == null){
      this.router.navigate(['login']);
      return false;
    }
    var size = Object.keys(isLoggedIn).length;
    // console.log("======",size)
   if (size > 0) {
        return true;
      } else {
        this.router.navigate(['login']);
        return false;
      }
    
    
  }
}

