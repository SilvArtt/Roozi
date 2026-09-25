import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { take } from 'rxjs';
import { HeaderApp } from '../../shared/componentes/headers/header-app/header-app';
import { CardService } from '@core/services/card/card-service';
import { CardRequestService } from '@core/services/card/cardRequest/card-request-service';
import { TransactionService } from '@core/services/transaction/transaction-service';
import {
    CartaoModel,
    CardType,
    MeuPedido,
    TransacaoModel,
    TimeFilter,
    TransactionTypeFilter,
    tipoTransacao,
} from '@core/models';

@Component({
    selector: 'app-dashboard',
    imports: [CommonModule, ReactiveFormsModule, RouterLink, HeaderApp, FormsModule],
    templateUrl: './dashboard.html',
    styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
    private fb = inject(FormBuilder);
    private cardService = inject(CardService);
    private cardRequestService = inject(CardRequestService);
    private transactionService = inject(TransactionService);

    // Cartões
    cartoes: CartaoModel[] = [];
    carregandoCartoes = true;

    // Pedidos (novo)
    pedidos: MeuPedido[] = [];
    carregandoPedidos = true;

    // Histórico
    transacoes: TransacaoModel[] = [];
    carregandoTransacoes = true;

    // Filtros
    filtroCardId = '';
    filtroPeriodo: TimeFilter = TimeFilter.MENSAL;
    filtroTipo: TransactionTypeFilter = TransactionTypeFilter.TODAS;

    // Modal
    modalAberto = false;
    salvando = false;
    erro = '';
    sucesso = '';

    addCardForm = this.fb.group({
        card_code: ['', Validators.required],
        nickname: [''],
    });

    ngOnInit() {
        this.carregarCartoes();
        this.carregarPedidos();
        this.carregarTransacoes();
    }

    carregarCartoes() {
        this.carregandoCartoes = true;
        this.cardService.getMyCards().pipe(take(1)).subscribe({
            next: (cards) => {
                this.cartoes = cards;
                this.carregandoCartoes = false;
            },
            error: (err) => {
                console.error('Erro ao carregar cartões:', err);
                this.carregandoCartoes = false;
            },
        });
    }

    carregarPedidos() {
        this.carregandoPedidos = true;
        this.cardRequestService.getMyPedidos().pipe(take(1)).subscribe({
            next: (pedidos) => {
                
                this.pedidos = pedidos.filter(p =>
                    p.status === 'pending_payment' ||
                    p.status === 'processing' ||
                    p.status === 'shipped'
                );
                this.carregandoPedidos = false;
            },
            error: (err) => {
                console.error('Erro ao carregar pedidos:', err);
                this.carregandoPedidos = false;
            },
        });
    }

    carregarTransacoes() {
        this.carregandoTransacoes = true;
        this.transactionService.getMyTransactions().pipe(take(1)).subscribe({
            next: (transacoes) => {
                this.transacoes = transacoes;
                this.carregandoTransacoes = false;
            },
            error: (err) => {
                console.error('Erro ao carregar transações:', err);
                this.carregandoTransacoes = false;
            },
        });
    }


    aplicarFiltros() {
        this.transactionService.getFilteredTransactions({
            card_id: this.filtroCardId || undefined,
            time_filter: this.filtroPeriodo,
            type: this.filtroTipo,
        }).pipe(take(1)).subscribe({
            next: (transacoes) => {
                this.transacoes = transacoes;
            },
            error: (err) => {
                console.error('Erro ao filtrar transações:', err);
            },
        });
    }

    onFiltroCardChange() {
        this.aplicarFiltros();
    }

    onFiltroPeriodoChange(event: Event) {
        const value = (event.target as HTMLSelectElement).value as TimeFilter;
        this.filtroPeriodo = value;
        this.aplicarFiltros();
    }

    onFiltroTipoChange(event: Event) {
        const value = (event.target as HTMLSelectElement).value as TransactionTypeFilter;
        this.filtroTipo = value;
        this.aplicarFiltros();
    }

  

    abrirModal() {
        this.modalAberto = true;
        this.erro = '';
        this.sucesso = '';
        this.addCardForm.reset();
    }

    fecharModal() {
        this.modalAberto = false;
        this.addCardForm.reset();
        this.erro = '';
        this.sucesso = '';
    }

    onSubmitAddCard() {
        if (this.addCardForm.invalid) {
            this.addCardForm.markAllAsTouched();
            return;
        }

        this.salvando = true;
        this.erro = '';
        this.sucesso = '';

        const payload = {
            card_code: this.addCardForm.value.card_code!,
            nickname: this.addCardForm.value.nickname ?? '',
            operator_id: '',
            card_type: CardType.FISICO,
        };

        this.cardService.addCard(payload).pipe(take(1)).subscribe({
            next: (card) => {
                this.salvando = false;
                this.sucesso = `Cartão "${card.nickname || card.card_code}" vinculado com sucesso!`;
                this.carregarCartoes();
                this.carregarPedidos();

                setTimeout(() => {
                    this.fecharModal();
                }, 1500);
            },
            error: (err) => {
                this.salvando = false;
                console.error('Erro ao adicionar cartão:', err);
                this.erro = err?.message ?? 'Erro ao adicionar cartão. Tente novamente.';
            },
        });
    }

    copiarCodigo(code: string) {
        navigator.clipboard.writeText(code).then(() => {
            console.log('Código copiado:', code);
        }).catch(err => {
            console.error('Erro ao copiar:', err);
        });
    }

    adicionarComCodigo(code: string) {
        this.addCardForm.patchValue({ card_code: code });
        this.abrirModal();
    }

    isVirtual(pedido: MeuPedido): boolean {
        return pedido.is_virtual;
    }

    getStatusLabel(pedido: MeuPedido): string {
        const mapa: Record<string, string> = {
            'pending_payment': 'Aguardando aprovação',
            'processing': 'Aprovado',
            'shipped': 'Entregue',
            'cancelled': 'Cancelado',
        };
        return mapa[pedido.status] ?? pedido.status;
    }

    formatarSaldo(valor: number): string {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(valor);
    }

    formatarData(date: Date): string {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    isRecarga(tipo: tipoTransacao): boolean {
        return tipo === tipoTransacao.RECARGA;
    }
}