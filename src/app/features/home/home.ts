import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent implements OnInit {
  mojeDane: any = { name: '', surname: '', login: '' };
  czyJestemAdminem: boolean = false;
  wybranyJezyk: string = 'pl';
  pokazMenu: boolean = false;

  teksty: any = {
    'dash.welcome': 'Witaj,',
    'home.placeholder': 'Miejsce na przyszłe moduły systemowe',
    'dash.title': 'Użytkownicy',
    'dash.logout': 'Wyloguj się'
  };

  constructor(
    private http: HttpClient, 
    public router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const zapisanyJezyk = localStorage.getItem('jezyk') || 'pl';
    this.wybranyJezyk = zapisanyJezyk;
    this.zmienJezyk(zapisanyJezyk);
    
    this.pobierzDane();
  }

  pobierzDane() {
    const token = localStorage.getItem('moj_token');
    if (!token) { 
      this.router.navigate(['/login']); 
      return; 
    }
    
    const naglowki = new HttpHeaders({ 'Authorization': 'Bearer ' + token });
    this.http.get<any>('http://localhost:8080/api/me', { headers: naglowki }).subscribe({
      next: (user) => { 
        this.mojeDane = user; 
        this.czyJestemAdminem = user.isAdmin === 1;
        this.cdr.detectChanges(); 
      },
      error: () => { 
        this.wyloguj(); 
      }
    });
  }

  zmienJezyk(jezyk: string) {
    this.http.get<any>(`http://localhost:8080/api/public/i18n/${jezyk}`).subscribe({
      next: (slownik) => { 
        this.teksty = slownik; 
        this.wybranyJezyk = jezyk;
        localStorage.setItem('jezyk', jezyk);
        this.cdr.detectChanges(); 
      }
    });
  }

  wyloguj() {
    localStorage.removeItem('moj_token');
    this.router.navigate(['/login']);
  }
}