import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HeaderApp } from '../../shared/componentes/headers/header-app/header-app';
import { RechargeService } from '@core/services/recharge/recharge-service';
import { CardService } from '@core/services/card/card-service';
import { PaymentMethod, CartaoModel } from '@core/models';
import { Recarga as RecargaFirestore } from '@core/models';
import { CommonModule } from '@angular/common'; 
@Component({
  selector: 'app-recarga',
  imports: [ReactiveFormsModule, HeaderApp, CommonModule],
  templateUrl: './recarga.html',
  styleUrl: './recarga.css',
})
export class Recarga implements OnInit {
  private fb = inject(FormBuilder);
  private rechargeService = inject(RechargeService);
  private cardService = inject(CardService);

  loading = false;
  meusCartoes: CartaoModel[] = [];

  recargaForm = this.fb.group({
    card_id: ['', Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(5), Validators.max(500)]],
    payment_method: ['', Validators.required],
    confirm_recharge: [false, Validators.requiredTrue],
  });

  ngOnInit() {
    this.cardService.getMyCards().subscribe({
      next: (cards) => {
        this.meusCartoes = cards;
      },
      error: (err) => {
        console.error('Erro ao carregar cartões:', err);
      },
    });
  }

  setAmount(value: number) {
    this.recargaForm.patchValue({ amount: value });
  }

  onSubmit() {
    if (this.recargaForm.invalid) {
      this.recargaForm.markAllAsTouched();
      return;
    }

    this.loading = true;

    const formValue = this.recargaForm.getRawValue();

    const payload = {
      card_id: formValue.card_id!,
      amount: formValue.amount!,
      payment_method: formValue.payment_method as PaymentMethod,
    };

    this.rechargeService.createRecharge(payload).subscribe({
      next: (recarga: RecargaFirestore) => {
        this.loading = false;
        console.log('Recarga criada:', recarga);
        this.recargaForm.reset();
        // TODO: redirecionar pra tela de pagamento
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Erro na recarga:', err);
      },
    });
  }
}