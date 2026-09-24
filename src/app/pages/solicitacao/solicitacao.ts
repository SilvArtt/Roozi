import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HeaderApp } from '../../shared/componentes/headers/header-app/header-app';
import { debounceTime, distinctUntilChanged, filter, switchMap } from 'rxjs';
import { CepService } from '@core/services/cep/cep-service';


@Component({
  selector: 'app-solicitacao',
  imports: [ReactiveFormsModule, HeaderApp],
  templateUrl: './solicitacao.html',
  styleUrl: './solicitacao.css',
})
export class Solicitacao implements OnInit {
  private fb = inject(FormBuilder);
  private cepService = inject(CepService);

  loading = false;
  buscandoCep = false;
  erroCep = false;

  solicitacaoForm = this.fb.group({
    region_id: ['', Validators.required],
    operator_id: ['', Validators.required],
    card_type: ['', Validators.required],
    passenger_category: ['', Validators.required],
    cpf: [''],
    delivery_type: ['', Validators.required],
    station: [''],
    zip_code: [''],
    address_number: [''],
    street: [''],
    complement: [''],
    neighborhood: [''],
    city: [''],
    state: [''],
    lgpd: [false, Validators.requiredTrue],
  });

  ngOnInit() {
    this.escutarCep();
  }

  onSubmit() {
    if (this.solicitacaoForm.invalid) {
      this.solicitacaoForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    console.log('Solicitação payload:', this.solicitacaoForm.getRawValue());

    setTimeout(() => {
      this.loading = false;
    }, 1000);
  }

  private escutarCep() {
    this.solicitacaoForm.get('zip_code')?.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      filter((cep) => !!cep && cep.replace(/\D/g, '').length === 8),
      switchMap((cep) => {
        this.buscandoCep = true;
        this.erroCep = false;
        return this.cepService.buscarCep(cep!);
      })
    ).subscribe({
      next: (endereco) => {
        this.buscandoCep = false;

        if (endereco) {
          this.solicitacaoForm.patchValue({
            street: endereco.street,
            neighborhood: endereco.neighborhood,
            city: endereco.city,
            state: endereco.state,
          });
        } else {
          this.erroCep = true;
        }
      },
      error: () => {
        this.buscandoCep = false;
        this.erroCep = true;
      },
    });
  }
}