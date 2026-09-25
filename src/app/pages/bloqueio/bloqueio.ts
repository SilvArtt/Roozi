import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { take } from 'rxjs';
import { HeaderApp } from '../../shared/componentes/headers/header-app/header-app';
import { BlockRequestService } from '@core/services/blockRequest/block-request-service';
import {
  BlockReason,
  BlockRequestModel,
  CardType,
} from '@core/models';

@Component({
  selector: 'app-bloqueio',
  imports: [ReactiveFormsModule, CommonModule, HeaderApp],
  templateUrl: './bloqueio.html',
  styleUrl: './bloqueio.css',
})
export class Bloqueio {
  private fb = inject(FormBuilder);
  private blockRequestService = inject(BlockRequestService);
  private router = inject(Router);

  loading = false;
  erro = '';
  sucesso = '';

  bloqueioForm = this.fb.group({
    card_code: ['', Validators.required],
    holder_name: ['', Validators.required],
    card_type: ['', Validators.required],
    has_cpf: ['', Validators.required],
    cpf: [''],
    block_reason: ['', Validators.required],
    other_reason: [''],
    confirm_block: [false, Validators.requiredTrue],
  });

  onSubmit() {
    if (this.loading) {
      console.warn('[Bloqueio] Clique ignorado — já processando');
      return;
    }

    this.erro = '';
    this.sucesso = '';

    if (this.bloqueioForm.invalid) {
      this.bloqueioForm.markAllAsTouched();
      return;
    }

    this.loading = true;

    const formValue = this.bloqueioForm.getRawValue();

    const payload = {
      card_code: formValue.card_code!,
      holder_name: formValue.holder_name!,
      card_type: formValue.card_type as CardType,
      has_cpf_linked: formValue.has_cpf === 'true',
      cpf: formValue.cpf ?? '',
      reason: formValue.block_reason as BlockReason,
      other_reason: formValue.other_reason ?? '',
      confirm_block: formValue.confirm_block!,
    };

    this.blockRequestService.createBlockRequest(payload).pipe(
      take(1)
    ).subscribe({
      next: (req: BlockRequestModel) => {
        this.loading = false;
        this.sucesso = 'Bloqueio solicitado! A operadora vai analisar em breve.';

        setTimeout(() => {
          this.router.navigate(['/dashboard'], {
            queryParams: { bloqueio: 'sucesso' },
          });
        }, 1500);
      },
      error: (err: any) => {
        this.loading = false;
        console.error('[Bloqueio] Erro:', err);
        this.erro = err?.message ?? 'Erro ao solicitar bloqueio. Tente novamente.';
      },
    });
  }
}