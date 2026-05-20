import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  allUsers: any[] = []; 
  users: any[] = [];    

  logiSystemowe: any[] = [];
  pokazLogi: boolean = false; 
  pokazMenu: boolean = false; 

  wszystkieLogi: any[] = [];
  wybranyStatusLogow: string = 'ALL';

  wybranyStatusFiltru: string = 'ALL'; 

  pracownikForm = { name: '', surname: '', login: '', email: '', phone: '', isAdmin: 0 };
  mojeDane: any = { name: '', surname: '', login: '', email: '', phone: '' };
  
  czyJestemAdminem: boolean = false;
  
  pokazModalProfilu: boolean = false;
  pokazModalEdycji: boolean = false;
  pokazModalUsuwania: boolean = false;
  
  edytowanyId: number | null = null;
  uzytkownikDoUsuniecia: any = null;

  errorMsg: string | null = null;
  successMsg: string | null = null;

  wybranyJezyk: string = 'pl';
  
  teksty: any = {
    'dash.title': 'Lista Użytkowników',
    'dash.logout': 'Wyloguj się',
    'dash.add': 'Dodaj',
    'dash.edit': 'Edytuj',
    'dash.fire': 'Zwolnij',
    'dash.name': 'Imię',
    'dash.surname': 'Nazwisko',
    'dash.status': 'Status',
    'dash.actions': 'Akcje',
    'dash.form.add': 'Zatrudnij nowego pracownika',
    'dash.form.edit': 'Edytujesz pracownika:',
    'dash.profile': 'Mój Profil',
    'dash.cancel': 'Anuluj',
    'dash.save': 'Zapisz',
    'dash.welcome': 'Witaj,',
    'dash.filter.all': 'Wszyscy',
    'dash.filter.active': 'Aktywni',
    'dash.filter.deleted': 'Zwolnieni',
    'dash.logs.btn': 'Logi',
    'dash.logs.title': 'Rejestr Zdarzeń Systemowych',
    'dash.phone': 'Telefon',
    'dash.email': 'Email',
    'app.footer': '© 2026 strona utworzona przez Wiktora Włodarczyka',
    'dash.filter.label': 'Pokaż:'
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
    this.inicjalizujDane();
  }

  inicjalizujDane() {
    const token = localStorage.getItem('moj_token');
    if (!token) { this.router.navigate(['/login']); return; }
    
    const naglowki = new HttpHeaders({ 'Authorization': 'Bearer ' + token });
    this.http.get<any>('http://localhost:8080/api/me', { headers: naglowki })
      .subscribe({
        next: (user) => {
          this.mojeDane = user;
          this.czyJestemAdminem = user.isAdmin === 1;
          this.pobierzUzytkownikow();
          if (this.czyJestemAdminem) { this.pobierzLogi(); }
          this.cdr.detectChanges(); 
        },
        error: () => this.wyloguj()
      });
  }

  zmienJezyk(jezyk: string) {
    this.http.get<any>(`http://localhost:8080/api/public/i18n/${jezyk}`)
      .subscribe({
        next: (slownik) => {
          this.teksty = slownik; 
          this.wybranyJezyk = jezyk;
          localStorage.setItem('jezyk', jezyk);
          this.cdr.detectChanges(); 
        }
      });
  }

pobierzLogi() {
  const naglowki = new HttpHeaders({ 'Authorization': 'Bearer ' + localStorage.getItem('moj_token') });
  this.http.get<any[]>('http://localhost:8080/api/logs', { headers: naglowki })
    .subscribe({
      next: (dane) => {
        this.wszystkieLogi = dane.reverse();
        this.filtrujLogi(this.wybranyStatusLogow);
        this.cdr.detectChanges();
      }
    });
}
filtrujLogi(status: string) {
  this.wybranyStatusLogow = status;
  if (status === 'ALL') {
    this.logiSystemowe = [...this.wszystkieLogi];
  } else {
    this.logiSystemowe = this.wszystkieLogi.filter(l => l.status === status);
  }
  this.cdr.detectChanges();
}

  pokazKomunikat(wiadomosc: string, typ: 'success' | 'error') {
    if (typ === 'success') { this.successMsg = wiadomosc; this.errorMsg = null; } 
    else { this.errorMsg = wiadomosc; this.successMsg = null; }
    this.cdr.detectChanges(); 
    setTimeout(() => { this.successMsg = null; this.errorMsg = null; this.cdr.detectChanges(); }, 5000);
  }

  pobierzUzytkownikow() {
    const naglowki = new HttpHeaders({ 'Authorization': 'Bearer ' + localStorage.getItem('moj_token') });
    this.http.get<any[]>('http://localhost:8080/api/users', { headers: naglowki })
      .subscribe({
        next: (dane) => { this.allUsers = dane; this.filtrujUzytkownikow(this.wybranyStatusFiltru); }
      });
  }

  filtrujUzytkownikow(nowyStatus: string) {
    this.wybranyStatusFiltru = nowyStatus;
    if (this.wybranyStatusFiltru === 'ALL') { this.users = [...this.allUsers]; } 
    else { this.users = this.allUsers.filter(u => u.status === this.wybranyStatusFiltru); }
    this.cdr.detectChanges(); 
  }


  walidujFormularz(dane: any): boolean {
    const bledy: string[] = [];

    const pustePola: string[] = [];
    if (!dane.name) pustePola.push(this.teksty['dash.name'] || 'Imię');
    if (!dane.surname) pustePola.push(this.teksty['dash.surname'] || 'Nazwisko');
    if (!dane.login) pustePola.push('Login');
    if (!dane.email) pustePola.push('Email');
    if (!dane.phone) pustePola.push(this.teksty['dash.phone'] || 'Telefon');

    if (pustePola.length > 0) {
      bledy.push(`Brakuje danych: ${pustePola.join(', ')}`);
    }

    if (dane.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(dane.email)) {
        bledy.push('Podaj poprawny format email (np. jan@firma.pl)');
      }
    }

    if (dane.phone) {
      const tylkoCyfry = /^\d+$/;
      if (!tylkoCyfry.test(dane.phone)) {
        bledy.push('Numer telefonu może zawierać tylko cyfry');
      } else if (dane.phone.length > 9) {
        bledy.push('Telefon jest za długi (max 9 cyfr)');
      }
    }

    if (bledy.length > 0) {
      this.pokazKomunikat(bledy.join('  |  '), 'error');
      return false;
    }

    return true;
  }

  dodajPracownika() {
    if (!this.walidujFormularz(this.pracownikForm)) return;
    this.pracownikForm.isAdmin = 0; 
    const naglowki = new HttpHeaders({ 'Authorization': 'Bearer ' + localStorage.getItem('moj_token') });
    
    this.http.post('http://localhost:8080/api/users', this.pracownikForm, { headers: naglowki, responseType: 'text' })
      .subscribe({
        next: (odp) => {
          this.pokazKomunikat(odp, 'success');
          this.pracownikForm = { name: '', surname: '', login: '', email: '', phone: '', isAdmin: 0 };
          this.pobierzUzytkownikow();
        },
        error: (err) => this.pokazKomunikat(err.error, 'error')
      });
  }

  wczytajDoEdycji(user: any) {
    this.pracownikForm = { ...user };
    this.edytowanyId = user.id;
    this.pokazModalEdycji = true;
    this.cdr.detectChanges();
  }

  zapytajOUsuniecie(user: any) {
    this.uzytkownikDoUsuniecia = user;
    this.pokazModalUsuwania = true;
    this.cdr.detectChanges();
  }

  zamknijModale() {
    this.pokazModalEdycji = false;
    this.pokazModalUsuwania = false;
    this.pracownikForm = { name: '', surname: '', login: '', email: '', phone: '', isAdmin: 0 };
    this.edytowanyId = null;
    this.uzytkownikDoUsuniecia = null;
    this.cdr.detectChanges();
  }

  zapiszZmiany() {
    if (!this.walidujFormularz(this.pracownikForm)) return;
    const naglowki = new HttpHeaders({ 'Authorization': 'Bearer ' + localStorage.getItem('moj_token') });
    this.http.put(`http://localhost:8080/api/users/${this.edytowanyId}`, this.pracownikForm, { headers: naglowki, responseType: 'text' })
      .subscribe({
        next: (odp) => { this.pokazKomunikat(odp, 'success'); this.pobierzUzytkownikow(); this.zamknijModale(); },
        error: (err) => this.pokazKomunikat(err.error, 'error')
      });
  }

  usunUzytkownika() {
    const naglowki = new HttpHeaders({ 'Authorization': 'Bearer ' + localStorage.getItem('moj_token') });
    this.http.delete(`http://localhost:8080/api/users/${this.uzytkownikDoUsuniecia.id}`, { headers: naglowki, responseType: 'text' })
      .subscribe({
        next: (odp) => { this.pokazKomunikat(odp, 'success'); this.pobierzUzytkownikow(); this.zamknijModale(); },
        error: (err) => this.pokazKomunikat(err.error, 'error')
      });
  }

  zapiszProfil() {
    if (!this.walidujFormularz(this.mojeDane)) return;
    const naglowki = new HttpHeaders({ 'Authorization': 'Bearer ' + localStorage.getItem('moj_token') });
    this.http.put(`http://localhost:8080/api/users/${this.mojeDane.id}`, this.mojeDane, { headers: naglowki, responseType: 'text' })
      .subscribe({
        next: () => { this.pokazKomunikat("Zaktualizowano profil!", 'success'); this.pokazModalProfilu = false; this.inicjalizujDane(); },
        error: (err) => this.pokazKomunikat(err.error, 'error')
      });
  }

  wyloguj() { localStorage.removeItem('moj_token'); this.router.navigate(['/login']); }
  zamknijProfil() { this.pokazModalProfilu = false; this.cdr.detectChanges(); }
  otworzProfil() { this.pokazModalProfilu = true; this.cdr.detectChanges(); }
  otworzLogi() { this.pobierzLogi(); this.pokazLogi = true; this.cdr.detectChanges(); }
  zamknijLogi() { this.pokazLogi = false; this.cdr.detectChanges(); }
}