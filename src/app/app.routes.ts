import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { DashboardComponent } from './dashboard/dashboard';
import { authGuard } from './auth.guard';
import { HomeComponent } from './features/home/home';
import { InitComponent } from './features/init/init'; 

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'init', component: InitComponent },
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] }, 
  { path: 'users', component: DashboardComponent, canActivate: [authGuard] }, 
  { path: '**', redirectTo: 'login' }
];