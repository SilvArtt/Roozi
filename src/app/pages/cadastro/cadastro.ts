import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HeaderPadrao } from '../../shared/componentes/headers/header-padrao/header-padrao';
import { Footer } from '../../shared/componentes/footer/footer';
import { AuthService } from '../../core/services/auth/auth-service';

import {
  RegisterPassengerPayload,
  RegisterOperatorPayload,
  CardType,
  PassengerCategory,
} from '../../core/models';

type UserType = 'passageiro' | 'operadora';

@Component({
  selector: 'app-cadastro',
  imports: [ReactiveFormsModule, RouterLink, HeaderPadrao, Footer],
  templateUrl: './cadastro.html',
  styleUrl: './cadastro.css',
})
export class Cadastro {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  userType: UserType = 'passageiro';
  loading = false;
  errorMessage = '';

  cadastroForm = this.fb.group({
    // Campos passageiro
    nome: [''],
    password: [''],
    username: [''],
    telefone: [''],
    email: [''],

    // Campos operadora
    responsavel: [''],
    nome_operadora: [''],
    cnpj: [''],
    regiao: [''],
    bilhetagem: [''],
    telefone_op: [''],
    email_op: [''],
    password_op: [''],

    lgpd: [false, Validators.requiredTrue],
  });

  setUserType(tipo: UserType) {
    this.userType = tipo;
    this.errorMessage = '';
  }

  onSubmit() {
    if (this.userType === 'passageiro') {
      this.validarPassageiro();
    } else {
      this.validarOperadora();
    }

    if (this.cadastroForm.invalid) {
      this.cadastroForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const formValue = this.cadastroForm.getRawValue();

    if (this.userType === 'passageiro') {
      const payload: RegisterPassengerPayload = {
        email: formValue.email!,
        password: formValue.password!,
        full_name: formValue.nome!,
        username: formValue.username!,
        phone: formValue.telefone || undefined,
        cpf: undefined,
        lgpd_consent: formValue.lgpd!,
      };

      this.authService.registerPassenger(payload).subscribe({
        next: (user) => {
          this.loading = false;
          console.log('Passageiro cadastrado:', user);
      
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.loading = false;
          console.error('Erro no cadastro:', err);
          this.errorMessage = this.traduzErro(err?.code);
        },
      });
    } else {
      const payload: RegisterOperatorPayload = {
        email: formValue.email_op!,
        password: formValue.password_op!,
        manager_name: formValue.responsavel!,
        company_name: formValue.nome_operadora!,
        company_phone: formValue.telefone_op!,
        cnpj: formValue.cnpj!,
        area_ids: [],
        available_card_types: [
          CardType.FISICO,
          CardType.VIRTUAL,
        ],
        available_categories: [
          PassengerCategory.COMUM,
          PassengerCategory.ESTUDANTE,
          PassengerCategory.IDOSO,
        ],
        billing_system: formValue.bilhetagem || undefined,
        lgpd_consent: formValue.lgpd!,
      };

      this.authService.registerOperator(payload).subscribe({
        next: (user) => {
          this.loading = false;
          console.log('Operadora cadastrada:', user);
       
          this.router.navigate(['/operadora/dashboard']);
        },
        error: (err) => {
          this.loading = false;
          console.error('Erro no cadastro:', err);
          this.errorMessage = this.traduzErro(err?.code);
        },
      });
    }
  }

  private validarPassageiro() {
    const f = this.cadastroForm;

    f.get('nome')?.setValidators([Validators.required]);
    f.get('email')?.setValidators([Validators.required, Validators.email]);
    f.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    f.get('username')?.setValidators([Validators.required]);

    f.get('nome')?.updateValueAndValidity();
    f.get('email')?.updateValueAndValidity();
    f.get('password')?.updateValueAndValidity();
    f.get('username')?.updateValueAndValidity();
  }

  private validarOperadora() {
    const f = this.cadastroForm;

    f.get('responsavel')?.setValidators([Validators.required]);
    f.get('nome_operadora')?.setValidators([Validators.required]);
    f.get('cnpj')?.setValidators([Validators.required]);
    f.get('email_op')?.setValidators([Validators.required, Validators.email]);
    f.get('password_op')?.setValidators([Validators.required, Validators.minLength(6)]);
    f.get('telefone_op')?.setValidators([Validators.required]);

    f.get('responsavel')?.updateValueAndValidity();
    f.get('nome_operadora')?.updateValueAndValidity();
    f.get('cnpj')?.updateValueAndValidity();
    f.get('email_op')?.updateValueAndValidity();
    f.get('password_op')?.updateValueAndValidity();
    f.get('telefone_op')?.updateValueAndValidity();
  }

  private traduzErro(code: string | undefined): string {
    if (!code) return 'Erro ao cadastrar. Tente novamente.';

    const erros: Record<string, string> = {
      'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
      'auth/invalid-email': 'E-mail inválido.',
      'auth/weak-password': 'A senha é muito fraca. Use pelo menos 6 caracteres.',
      'auth/network-request-failed': 'Falha de conexão. Verifique sua internet.',
    };

    return erros[code] ?? 'Erro ao cadastrar. Tente novamente.';
  }
}