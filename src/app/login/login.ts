import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent implements OnInit {
  daneLogowania = { login: '', password: '' };
  
  krokResetu: number = 0; 
  resetLogin: string = '';
  
  telefonWeryfikacyjny: string = ''; 
  noweHaslo: string = '';
  powtorzHaslo: string = ''; 
  resetToken: string = ''; 

  errorMsg: string | null = null;
  successMsg: string | null = null;

  wybranyJezyk: string = 'pl';
  
  teksty: any = {
    'app.title': 'System Zarządzania',
    'login.button': 'Zaloguj się',
    'login.password': 'Hasło',
    'login.forgot': 'Zapomniałeś hasła?',
    'login.reset.title': 'Reset Hasła',
    'login.reset.desc': 'Wpisz swój login, aby otrzymać link.',
    'login.reset.input': 'Twój login',
    'login.reset.btn': 'Wyślij maila',
    'login.reset.back': 'Wróć',
    'login.newpass.title': 'Ustaw nowe hasło',
    'login.newpass.desc': 'Wymagane: min. 12 znaków, duża litera, cyfra i znak specjalny.',
    'login.newpass.phone': 'Numer telefonu z profilu', 
    'login.newpass.input1': 'Nowe hasło',
    'login.newpass.input2': 'Powtórz nowe hasło',
    'login.newpass.btn': 'Zmień i zapisz',
    'login.newpass.back': 'Wróć do logowania',
    'app.footer': '© 2026 strona utworzona przez Wiktora Włodarczyka'
  };

  constructor(
    private http: HttpClient, 
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['token']) {
        this.resetToken = params['token']; 
        this.krokResetu = 2; 
        this.cdr.detectChanges(); 
      }
    });

    const zapisanyJezyk = localStorage.getItem('jezyk') || 'pl';
    this.wybranyJezyk = zapisanyJezyk;
    this.zmienJezyk(zapisanyJezyk);
  }

  zmienJezyk(jezyk: string) {
    this.http.get<any>(`http://localhost:8080/api/public/i18n/${jezyk}`)
      .subscribe({
        next: (slownik) => {
          this.teksty = slownik;
          if(!this.teksty['login.newpass.phone']) {
            this.teksty['login.newpass.phone'] = jezyk === 'en' ? 'Profile Phone Number' : 'Numer telefonu z profilu';
          }
          this.wybranyJezyk = jezyk;
          localStorage.setItem('jezyk', jezyk);
          
          this.cdr.detectChanges(); 
        }
      });
  }

  pokazBlad(tekst: string) {
    this.errorMsg = tekst;
    this.successMsg = null;
    this.cdr.detectChanges(); 

    setTimeout(() => { 
      this.errorMsg = null; 
      this.cdr.detectChanges(); 
    }, 5000);
  }

  zaloguj() {
    this.http.post<any>('http://localhost:8080/api/public/login', this.daneLogowania)
      .subscribe({
        next: (odpowiedz) => {
          localStorage.setItem('moj_token', odpowiedz.token);
          this.router.navigate(['/home']); 
        },
        error: () => this.pokazBlad(this.teksty['login.error'] || 'Błędne dane logowania!')
      });
  }

poprosOReset() {
    if (!this.resetLogin) {
      this.pokazBlad("Podaj login!");
      return;
    }
    
    this.http.post('http://localhost:8080/api/public/password-reset/request', { login: this.resetLogin }, { responseType: 'text' })
      .subscribe({
        next: (odp) => {
          this.successMsg = "Link został wysłany! Sprawdź pocztę.";
          this.errorMsg = null;
          this.cdr.detectChanges(); 
        },
        error: (err) => {
          const wiadomosc = typeof err.error === 'string' ? err.error : (err.error?.message || "Błąd serwera.");
          this.pokazBlad(wiadomosc);
        }
      });
    }

  walidujNoweHaslo(): boolean {
    if (!this.telefonWeryfikacyjny) {
      this.pokazBlad("Podaj numer telefonu do weryfikacji!");
      return false;
    }
    
    const p = this.noweHaslo;
    if (p.length < 12) {
      this.pokazBlad("Hasło musi mieć co najmniej 12 znaków.");
      return false;
    }
    if (!/[A-Z]/.test(p) || !/[a-z]/.test(p) || !/[0-9]/.test(p) || !/[^A-Za-z0-9]/.test(p)) {
      this.pokazBlad("Hasło musi zawierać małą i wielką literę, cyfrę oraz znak specjalny.");
      return false;
    }
    if (p !== this.powtorzHaslo) {
      this.pokazBlad("Hasła nie są identyczne!");
      return false;
    }
    
    return true;
  }

  potwierdzNoweHaslo() {
    if (!this.walidujNoweHaslo()) return; 

    const pakiet = { 
      token: this.resetToken, 
      phone: this.telefonWeryfikacyjny, 
      newPassword: this.noweHaslo 
    };
    
    this.http.post('http://localhost:8080/api/public/password-reset/confirm', pakiet, { responseType: 'text' })
      .subscribe({
        next: (odp) => {
          this.successMsg = odp || "Hasło zmienione pomyślnie!"; 
          this.errorMsg = null;
          this.cdr.detectChanges(); 

          setTimeout(() => { 
            this.krokResetu = 0; 
            this.telefonWeryfikacyjny = '';
            this.noweHaslo = '';
            this.powtorzHaslo = '';
            this.cdr.detectChanges(); 
            this.router.navigate(['/login']); 
          }, 3000);
        },
        error: (err) => {
          const wiadomosc = typeof err.error === 'string' ? err.error : (err.error?.message || "Błędne dane weryfikacyjne lub link wygasł.");
          this.pokazBlad(wiadomosc);
        }
      });
  }
}