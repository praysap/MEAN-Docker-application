import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

const TOKEN_KEY = 'Token';
const USER_KEY = 'auth-user';
const ROLE_KEY = 'auth-role';
const TAB_KEY = 'tabDetails';
const ENTITY_TAB_KEY = 'entityTabDetails';
const UP_TIME = 'setupTime';
const ATTEMPT_LEFT = 'setupTime';


@Injectable({
  providedIn: 'root'
})
export class SessionstorageService {

  constructor(private router: Router) { }

  signOut(): void {
    window.localStorage.clear();
  }
  public saveToken(token: any) {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.setItem(TOKEN_KEY, token);
  }
  public getToken() {
    let token = window.localStorage.getItem(TOKEN_KEY);
    if(token){
      return token;
    }
    return '';
   
  }
  public saveUser(user: any): void {
    window.localStorage.removeItem(USER_KEY);
    window.localStorage.setItem(USER_KEY, btoa(JSON.stringify(user)));
  }
  public getUser(): any {
    const user = window.localStorage.getItem(USER_KEY);
    if (user) {
  
      
      return JSON.parse(atob(user));
    }
    return {};
  }
  public saveSessTime(): void {
    var sessTime: any = new Date();
    sessTime.setMinutes(sessTime.getMinutes() + 15);
    window.localStorage.setItem(UP_TIME, JSON.stringify(sessTime));
  }

  public logout():void{
    window.localStorage.clear();
    this.router.navigate(['/login']);
    window.location.reload();
  }
}
