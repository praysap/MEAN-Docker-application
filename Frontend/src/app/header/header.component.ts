import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginService } from 'src/app/core/login.service';
import { MatDialog } from '@angular/material/dialog';
import { RestService } from 'src/app/core/rest.service';
import { environment } from 'src/environments/environment';
import { SessionstorageService } from 'src/app/common/sessionstorage.service';
import { NotificationService } from 'src/app/core/notification.service';
import { Observable, Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  public apiUrl = environment.API_URL;
  getLogoutData!: Subscription

  logoutCheck: Boolean = false
  userType: any;
  currentComponent: any;
  username: any;
  notificationCount = 0;
  assetPath = environment.assetPath;
  @Input() countData?: number;
  constructor(private router: Router,
    public lazyRouter: ActivatedRoute,
    private loginService: LoginService,
    public dialog: MatDialog,
    private restServ: RestService,
    private sessServ: SessionstorageService,
    private notiService: NotificationService,
    
  ) { }

  ngOnInit(): void {

    this.userType = this.loginService.getUser().role;
    let currentUrl = this.router.url.split('/')
    let lengthOfUrl = this.router.url.split('/').length

    this.currentComponent = currentUrl[lengthOfUrl - 1]
    this.getName();
  }

  navigation(path?: any) {
    this.router.navigate([`/dashboard/${path}`])
  }

  logout() {
    this.logoutCheck = true
    let url = environment.logOut;
    this.restServ.getnew(url, {}, {}).subscribe(res => {
      this.sessServ.logout();
      this.notiService.showSuccess(res.message)
    },
      (error) => {
        this.logout()
      }

    );

  }
  // profile(){
  //   // this.router.navigate(['/change-password']);
  //   let dialogRef = this.dialog.open(ProfileComponent,{
  //     // data: dataToSend
  //   } );
    
  // }

  getName() {
    this.username = this.loginService.getUser().username;
    console.log('ss',this.username);
  }

  // changePassword() {
  //   let dialogRef = this.dialog.open(ChangepasswordComponent, {
  //   });
  //   dialogRef.afterClosed().subscribe(res => {
  //     if (res) {
  //       this.notiService.showSuccess("Password Changed successfully");
  //     }

  //   })
  // }

}
