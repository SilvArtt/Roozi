import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { take } from 'rxjs';
import { HeaderApp } from '../../shared/componentes/headers/header-app/header-app';
import { RechargeService } from '@core/services/recharge/recharge-service';
import { CardService } from '@core/services/card/card-service';
import { CartaoModel, PaymentMethod } from '@core/models';

@Component({
    selector: 'app-recarga',
    imports: [ReactiveFormsModule, CommonModule, HeaderApp],
    templateUrl: './recarga.html',
    styleUrl: './recarga.css',
})
export class Recarga implements OnInit {
    private fb = inject(FormBuilder);
    private rechargeService = inject(RechargeService);
    private cardService = inject(CardService);
    private router = inject(Router);

    loading = false;
    meusCartoes: CartaoModel[] = [];

    // Modal de pagamento
    modalAberto = false;
    processandoPagamento = false;
    erro = '';

    // Resumo da recarga
    resumoRecarga = {
        cardId: '',
        cardLabel: '',
        amount: 0,
        paymentMethod: '',
    };

    recargaForm = this.fb.group({
        card_id: ['', Validators.required],
        amount: [null as number | null, [
            Validators.required,
            Validators.min(5),
            Validators.max(500),
        ]],
        payment_method: ['', Validators.required],
        confirm_recharge: [false, Validators.requiredTrue],
    });

    ngOnInit() {
        this.cardService.getMyCards().pipe(take(1)).subscribe({
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

    // ═══════════════════════════════════════════════════════════
    // SUBMIT — abre o modal de pagamento
    // ═══════════════════════════════════════════════════════════

    onSubmit() {
        if (this.recargaForm.invalid) {
            this.recargaForm.markAllAsTouched();
            return;
        }

        const formValue = this.recargaForm.getRawValue();
        const cartao = this.meusCartoes.find(c => c.id === formValue.card_id);

        this.resumoRecarga = {
            cardId: formValue.card_id!,
            cardLabel: cartao?.nickname || cartao?.card_code || 'Cartão',
            amount: formValue.amount!,
            paymentMethod: formValue.payment_method!,
        };

        this.erro = '';
        this.modalAberto = true;
    }

    // ═══════════════════════════════════════════════════════════
    // MODAL
    // ═══════════════════════════════════════════════════════════

    fecharModal() {
        if (this.processandoPagamento) return; // não fecha enquanto processa
        this.modalAberto = false;
        this.erro = '';
    }

    confirmarPagamento() {
        // ⭐ Guard: bloqueia cliques duplicados
        if (this.processandoPagamento) {
            console.warn('[Recarga] Clique ignorado — já processando');
            return;
        }

        this.processandoPagamento = true;
        this.erro = '';

        const payload = {
            card_id: this.resumoRecarga.cardId,
            amount: this.resumoRecarga.amount,
            payment_method: this.resumoRecarga.paymentMethod as PaymentMethod,
        };

        // 1. Cria a recarga
        this.rechargeService.createRecharge(payload).pipe(
            take(1)
        ).subscribe({
            next: (recarga) => {
                // 2. Confirma e atualiza saldo
                this.rechargeService.confirmRecharge(
                    recarga.id,
                    this.resumoRecarga.cardId,
                    this.resumoRecarga.amount
                ).pipe(
                    take(1)
                ).subscribe({
                    next: () => {
                        this.processandoPagamento = false;
                        this.modalAberto = false;

                        this.router.navigate(['/dashboard'], {
                            queryParams: { recarga: 'sucesso' },
                        });
                    },
                    error: (err) => {
                        this.processandoPagamento = false;
                        console.error('Erro ao confirmar recarga:', err);
                        this.erro = 'Erro ao processar a recarga. Tente novamente.';
                    },
                });
            },
            error: (err) => {
                this.processandoPagamento = false;
                console.error('Erro ao criar recarga:', err);
                this.erro = 'Erro ao criar recarga. Tente novamente.';
            },
        });
    }

    // ═══════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════

    formatarSaldo(valor: number): string {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(valor);
    }

    getNomeMetodo(method: string): string {
        const mapa: Record<string, string> = {
            'pix': 'Pix',
            'credit-card': 'Cartão de Crédito',
            'debit-card': 'Cartão de Débito',
            'boleto': 'Boleto Bancário',
        };
        return mapa[method] ?? method;
    }
}