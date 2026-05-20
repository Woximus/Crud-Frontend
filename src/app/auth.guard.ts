import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

// Bramkarz
export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  
  const token = localStorage.getItem('moj_token');

  if (token) {
    return true; 
  } else {
    console.warn('Bramkarz: Brak opaski VIP! Wyrzucam na logowanie.');
    router.navigate(['/login']);
    return false;
  }
};