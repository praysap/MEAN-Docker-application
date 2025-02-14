import { Component, OnInit } from '@angular/core';
import { FormControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SignupService } from '../core/signup.service';
import { LoginService } from '../core/login.service';
import { environment } from 'src/environments/environment';
import { RestService } from '../core/rest.service';
import { AESEncryptDecryptService } from '../common/aesencrypt-decrypt.service';
import { minLengthAsyncValidator } from '../common/validator';
import { CurrentUrlService } from '../common/url.service';
import { NotificationService } from '../core/notification.service';
@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {
  signUpForm: any = FormGroup;
  signupSubmitted = false;
  assetPath = environment.assetPath;
  captchaStatus = false;
  siteKey = environment.recaptchasiteKey;
  nameRegexReq = false;
  usernameRegexReq = false;
  clientIp: any;
  currentUrl : any;

  constructor(
    private fb: FormBuilder, 
    private router: Router, 
    private cryptServ: AESEncryptDecryptService, 
    private signupService: SignupService, 
    private restServ: RestService,
    public loginService: LoginService, 
    public CurrentUrlService: CurrentUrlService,
    private notiService: NotificationService
    )
     {
    this.initSignupForm();
  }

  resolved(captchaResponse: string) {
    this.captchaStatus = true;
    this.signUpForm?.get('capcha_token')?.setValue(captchaResponse);
  }
  encConfirmPassword(e: any) {

    if (e.target.value.length == 0){
      this.signUpForm.controls['cpassword'].reset()
      document.getElementById("encCpassword")?.setAttribute('type','hidden');
      document.getElementById("cpassword")?.setAttribute('type','password');
    }
else{
      let enc = this.cryptServ.encrypt(this.signUpForm.get('cpassword')?.value);
      this.signUpForm.get('cpassword')?.setValue(enc);

      document.getElementById("cpassword")?.setAttribute('type', 'hidden');
      document.getElementById("encCpassword")?.setAttribute('type', 'password');
      this.signUpForm.get('encCpassword')?.setValue(enc);

    }
  }
  myEncryption(e: any) {

    if (e.target.value.length == 0){
      this.signUpForm.controls['orgPassword'].reset()
      document.getElementById("Password")?.setAttribute('type','hidden');
      document.getElementById("orgPassword")?.setAttribute('type','password');
    }
else{
      let enc = this.cryptServ.encrypt(this.signUpForm.get('orgPassword')?.value);
      this.signUpForm.get('orgPassword')?.setValue(enc);

      document.getElementById("orgPassword")?.setAttribute('type', 'hidden');
      document.getElementById("Password")?.setAttribute('type', 'password');
      this.signUpForm.get('password')?.setValue(enc);

    }
  }

  initSignupForm() {
    this.signUpForm = this.fb.group({
      name: ['', [Validators.required, Validators.pattern("^[a-zA-Z0-9 ]+$")]],
      username: ['', [Validators.required, Validators.pattern("^[a-zA-Z0-9 ]+$")]],
      password: [''],
      orgPassword: ['', [Validators.required], minLengthAsyncValidator(7)],
      encCpassword: [''],
      cpassword: ['', [Validators.required], minLengthAsyncValidator(7)],
      email: ['', [Validators.required, Validators.pattern("^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$")]],
      ip: [''],
      capcha_token: [''],
    });
  }

  ngOnInit(): void {
    
    const currentUrl = window.location.href;
    this.signupService.storeCurrentUrl(currentUrl).subscribe(
       // response => console.log(response),
       // error => console.error(error)
    );

  }

  ngOnDestroy(): void {
    // this.signupService.getClientIp1().subscribe(response => {
    //   this.clientIp = response
    //   console.log(response)
    // });
    // console.log(
    //   this.CurrentUrlService.currentUrl 
    // )
    //const currentUrl = this.currentUrl ;

    
   

  }

  getUserIp() {
    this.restServ.getUserIp().subscribe(res => {
      this.signUpForm?.get('ip')?.setValue(res.ip);
    });
  }


  signup() {
    this.nameRegexReq = false;
    this.usernameRegexReq = false;
    this.signupSubmitted = true;

    this.signUpForm.get('name').setValue(this.signUpForm?.value.name.trim());
    let name = this.signUpForm?.value.name.trim();

    this.signUpForm.get('username').setValue(this.signUpForm?.value.username.trim());
    let username = this.signUpForm?.value.username.trim();
    var nameRegex = new RegExp("^[a-zA-Z0-9 ]+$");

    if (!nameRegex.test(name)) {
      this.nameRegexReq = true;
      return;
    }

    if (!nameRegex.test(username)) {
      this.usernameRegexReq = true;
      return;
    }

    // if (!this.captchaStatus) {
    //   return;
    // }
    if (this.signUpForm.invalid) {
      return;
    }
    // if (this.signUpForm.value.password!=this.signUpForm.value.cpassword){
    //   this.notiService.showError("Password and Confirm Password doesn't match. Try Again!!!")
    // }
    else {
      this.signupService.signUp(this.signUpForm.value).subscribe(res => {
        // console.log("===", res)
        if (res["body"].status == 200) {
          this.notiService.showSuccess(res["body"].message);
          this.router.navigate([''])
        }
        else {
          // console.log("===", res)
          this.router.navigate(['/signup'])
          this.signUpForm.reset();
          document.getElementById("Password")?.setAttribute('type', 'hidden');
          document.getElementById("orgPassword")?.setAttribute('type', 'password');
          document.getElementById("encCpassword")?.setAttribute('type', 'hidden');
          document.getElementById("cpassword")?.setAttribute('type', 'password');
        }
      })
    }

  }


  get f() {
    return this.signUpForm.controls;
  }

  login() {
    this.router.navigate(["/login"])
  }

  

  
}
