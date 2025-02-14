import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { SessionstorageService } from './app/common/sessionstorage.service';
@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  loginRole: any;

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
    
    let isLoggedIn = this.localstorage.getUser().role;
    var size = Object.keys(isLoggedIn).length;
    if (
      !isLoggedIn.user_type &&
      route.data['notLoggedin'] &&
      route.data['notLoggedin'] == 'true'
    ) {
      return true;
    } else if (size > 0) {
      this.loginRole = this.localstorage.getUser()?.role;
      
      if (route.data['role'] && route.data['role'] != this.loginRole) {

        // this.router.navigate(['/login']);
        return true;
      } else {
        this.router.navigate(['/login']);
        return false;
      }
    } else {
      this.router.navigate(['/login']);
    }
    return true;
  }
}









