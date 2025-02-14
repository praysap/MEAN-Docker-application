import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { RestService } from './rest.service';
import { HttpClient } from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})

export class AdminNotificationsService {
  constructor(
    public http: HttpClient,
    private restServ: RestService
  ) { }

  getNotifications() {
    return this.restServ.get(`${environment.getNotifications}`, {}, {})
  }

  getNotificationCount() {
    return this.restServ.get(`${environment.getNotificationCount}`, {}, {})
  }

  markNotificationRead() {
    return this.restServ.get(`${environment.markNotificationRead}`, {}, {})
  }
}
