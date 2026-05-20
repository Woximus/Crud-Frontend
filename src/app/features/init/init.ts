import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-init',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './init.html',
  styleUrl: './init.css'
})
export class InitComponent implements OnInit {
  form = {
    login: '',
    email: '',
    password: '',
    passwordRepeat: ''
  };

  errorMsg: string | null = null;
  successMsg: string | null = null;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.http.get<boolean>('http://localhost:8080/api/public/init-status').subscribe({
      next: (isInitialized) => {
        if (isInitialized) {
          this.router.navigate(['/login']);
        }
      },
      error: () => this.pokazBlad('Nie można połączyć się z serwerem.')
    });
  }

  pokazBlad(msg: string) {
    this.errorMsg = msg;
    this.successMsg = null;
  }

  walidujHaslo(): boolean {
    const p = this.form.password;

    if (p.length < 12) {
      this.pokazBlad('Hasło musi mieć co najmniej 12 znaków.');
      return false;
    }
    if (!/[A-Z]/.test(p) || !/[a-z]/.test(p) || !/[0-9]/.test(p) || !/[^A-Za-z0-9]/.test(p)) {
      this.pokazBlad('Hasło musi zawierać małą i wielką literę, cyfrę oraz znak specjalny.');
      return false;
    }
    if (p.toLowerCase().includes(this.form.login.toLowerCase()) && this.form.login.length > 0) {
      this.pokazBlad('Hasło nie może zawierać loginu.');
      return false;
    }
    const emailPrefix = this.form.email.split('@')[0];
    if (emailPrefix && p.toLowerCase().includes(emailPrefix.toLowerCase())) {
      this.pokazBlad('Hasło nie może zawierać części Twojego adresu email.');
      return false;
    }
    if (p !== this.form.passwordRepeat) {
      this.pokazBlad('Hasła nie są identyczne!');
      return false;
    }
    return true;
  }

  zainicjujSystem() {
    if (!this.form.login || !this.form.email || !this.form.password) {
      this.pokazBlad('Wypełnij wszystkie pola!');
      return;
    }
    
    if (!this.walidujHaslo()) return;

    this.http.post('http://localhost:8080/api/public/init-admin', this.form, { responseType: 'text' })
      .subscribe({
        next: (odp) => {
          this.successMsg = 'Inicjalizacja zakończona! Za chwilę zostaniesz przekierowany do logowania...';
          this.errorMsg = null;
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        },
        error: (err) => this.pokazBlad(err.error || 'Błąd inicjalizacji systemu.')
      });
  }
}