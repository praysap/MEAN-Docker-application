
import { BrowserModule } from '@angular/platform-browser';
import { NgModule,  NO_ERRORS_SCHEMA } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { ProjectComponent } from './project/project.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import {MatSliderModule} from '@angular/material/slider';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { BillpaymentComponent } from './billpayment/billpayment.component';
import { environment } from 'src/environments/environment';
import { AuthInterceptor,DEFAULT_TIMEOUT } from './auth/auth.interceptor';
import { ToastrModule } from 'ngx-toastr';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import {RECAPTCHA_SETTINGS,RecaptchaModule,RecaptchaSettings,} from 'ng-recaptcha';
import { DatePipe } from '@angular/common';
import { DataService } from './common/data.service';
import { HeaderComponent } from './header/header.component';
import { MatDialogModule } from '@angular/material/dialog';
import { HomeComponent } from './home/home.component';
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import { AboutComponent } from './about/about.component';
import { NotfoundComponent } from './notfound/notfound.component';
import {MatTableModule} from '@angular/material/table';
@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
   
    ProjectComponent,
    BillpaymentComponent,
    SignupComponent,
    HeaderComponent,
    HomeComponent,
    AboutComponent,
    NotfoundComponent
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'ng-cli-universal' }),
    AppRoutingModule,
    FormsModule,
    RecaptchaModule,
    MatSliderModule,
    HttpClientModule,
    NgbModule,
    MatTableModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    MatDialogModule,
    ToastrModule.forRoot({
      positionClass :'toast-top-right',
      preventDuplicates: true,
    }),
  ],
  schemas:[NO_ERRORS_SCHEMA], 
  providers: [
    DatePipe,
    DataService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
      
    },
    // [{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }],
    [{ provide: DEFAULT_TIMEOUT, useValue: 100000 }],
    {
      provide: RECAPTCHA_SETTINGS,
      useValue: {
        siteKey: environment.recaptchasiteKey,
      } as RecaptchaSettings,
    },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
