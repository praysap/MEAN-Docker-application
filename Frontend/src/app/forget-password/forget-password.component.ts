import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators,FormBuilder } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { RestService } from 'src/app/core/rest.service'; 
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
@Component({
  selector: 'app-forget-password',
  templateUrl: './forget-password.component.html',
  styleUrls: ['./forget-password.component.scss']
})
export class ForgetPasswordComponent implements OnInit {
  assetPath = environment.assetPath;
  forgotGroup: any= FormGroup;
  urlPass: any;
  captchaStatus = false;
  siteKey = environment.recaptchasiteKey;

  constructor(public dialogRef: MatDialogRef<ForgetPasswordComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public router: Router, private restServ: RestService,
    private fb: FormBuilder) 
    {

      this.initSignupForm();
  }


  initSignupForm() {
    this.forgotGroup = this.fb.group({
      email: ['', [Validators.required,Validators.pattern("^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$")]],
      ip: [''],
      capcha_token: [''],
    urlPass : location.origin + environment.recoverUrl

    });
  }


  getUserIp() {
    this.restServ.getUserIp().subscribe(res=>{
     this.forgotGroup?.get('ip')?.setValue(res.ip);
   });
 }
 
  ngOnInit(): void {
    this.urlPass = location.origin + environment.recoverUrl
    this.getUserIp()
  }
  close() {
    this.dialogRef.close("Closed")
  }

  resolved(captchaResponse: string) {
    this.captchaStatus = true;
    this.forgotGroup?.get('capcha_token')?.setValue(captchaResponse);
  }


  sendMail() {



    if (this.forgotGroup.value.email == '') {
      return;
    }

    if (!this.captchaStatus) {
      return;
    }

    if (this.forgotGroup.value) {
      console.log("this.signUpForm.value",this.forgotGroup.value)
      this.dialogRef.close(this.forgotGroup.value)
      // let dataToSend = {
      //   email: this.forgotGroup.value.email,
      //   path: this.urlPass
      // }
      this.restServ.post(environment.forgot,this.forgotGroup.value,{}).subscribe(res=>{
console.log("=====",res)
        if (res.message) {
          return;
        }
        this.router.navigate(['/login'])
      })
    }
  }
}
