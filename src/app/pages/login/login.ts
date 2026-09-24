import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { Footer } from '../../shared/componentes/footer/footer';
import { HeaderPadrao } from '../../shared/componentes/headers/header-padrao/header-padrao';
import { AuthService } from '../../core/services/auth/auth-service';

import { LoginPayload } from '../../core/models';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    Footer,
    HeaderPadrao,
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loading = false;
  errorMessage = '';

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const payload = this.loginForm.getRawValue() as LoginPayload;

    this.authService.login(payload).subscribe({
      next: (user) => {
        this.loading = false;
        console.log('Login OK:', user);

        if (user.type === 'operator') {
          this.router.navigate(['/operadora/dashboard']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('Erro no login:', err);
        this.errorMessage = this.traduzErro(err?.code);
      },
    });
  }

  private traduzErro(code: string | undefined): string {
    if (!code) return 'Erro ao fazer login. Tente novamente.';

    const erros: Record<string, string> = {
      'auth/invalid-email': 'E-mail inválido.',
      'auth/user-not-found': 'Usuário não encontrado.',
      'auth/wrong-password': 'Senha incorreta.',
      'auth/invalid-credential': 'E-mail ou senha incorretos.',
      'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
      'auth/network-request-failed': 'Falha de conexão. Verifique sua internet.',
    };

    return erros[code] ?? 'Erro ao fazer login. Tente novamente.';
  }
}