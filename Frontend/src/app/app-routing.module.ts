import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProjectComponent } from './project/project.component';
import { LoginComponent } from './login/login.component';
import { AuthGuard } from 'src/auth.guard';
import { SignupComponent } from './signup/signup.component';
import { BillpaymentComponent } from './billpayment/billpayment.component';
import { HeaderComponent } from './header/header.component';
import { HomeComponent } from './home/home.component';
import { AboutComponent } from './about/about.component';
import { NotfoundComponent } from './notfound/notfound.component';
const routes: Routes = [
  { path: '', component: LoginComponent  },

  {path:'billpayment',component:BillpaymentComponent,pathMatch: 'full' },

  {path:'signup',component:SignupComponent},

  { path: 'login', component: LoginComponent, },

  {path:'header',component:HeaderComponent },    

  {path:'home',component:HomeComponent },

  {path:'about',component:AboutComponent  },

  {path:'**',component:NotfoundComponent  }
  
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    enableTracing: false,
    useHash: true 
})],
  exports: [RouterModule],
  providers: [AuthGuard]
})
export class AppRoutingModule { }
