import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { take } from 'rxjs';
import { HeaderApp } from '../../shared/componentes/headers/header-app/header-app';
import { CardService } from '@core/services/card/card-service';
import { CardRequestService } from '@core/services/card/cardRequest/card-request-service';
import { TransactionService } from '@core/services/transaction/transaction-service';
import { AuthService } from '@core/services/auth/auth-service';
import {
    CartaoModel,
    CardType,
    CardStatus,
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
    private authService = inject(AuthService);

    // Cartões
    cartoes: CartaoModel[] = [];
    carregandoCartoes = true;

    // Pedidos
    pedidos: MeuPedido[] = [];
    carregandoPedidos = true;

    // Histórico
    transacoes: TransacaoModel[] = [];
    carregandoTransacoes = true;

    // Filtros
    filtroCardId = '';
    filtroPeriodo: TimeFilter = TimeFilter.MENSAL;
    filtroTipo: TransactionTypeFilter = TransactionTypeFilter.TODAS;

    // Modal adicionar cartão
    modalAberto = false;
    salvando = false;
    erro = '';
    sucesso = '';

    addCardForm = this.fb.group({
        card_code: ['', Validators.required],
        nickname: [''],
    });

    // ⭐ Modal detalhes
    modalDetalhesAberto = false;
    cartaoSelecionado: CartaoModel | null = null;
    salvandoDetalhes = false;
    erroDetalhes = '';
    sucessoDetalhes = '';

    detalhesForm = this.fb.group({
        nickname: [''],
        card_code: [''],
    });

    // ⭐ Modal confirmação de remoção
    modalRemoverAberto = false;
    removendo = false;
    erroRemover = '';

    ngOnInit() {
        this.carregarCartoes();
        this.carregarPedidos();
        this.carregarTransacoes();
    }

    // ═══════════════════════════════════════════════════════════
    // CARREGAR DADOS
    // ═══════════════════════════════════════════════════════════

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

    // ═══════════════════════════════════════════════════════════
    // MODAL ADICIONAR
    // ═══════════════════════════════════════════════════════════

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

    // ═══════════════════════════════════════════════════════════
    // ⭐ MODAL DETALHES
    // ═══════════════════════════════════════════════════════════

  get saldoCartaoSelecionado(): number {
    return this.cartaoSelecionado?.balance ?? 0;
  }

    abrirDetalhes(card: CartaoModel) {
        this.cartaoSelecionado = card;
        this.modalDetalhesAberto = true;
        this.erroDetalhes = '';
        this.sucessoDetalhes = '';

        this.detalhesForm.patchValue({
            nickname: card.nickname ?? '',
            card_code: card.card_code ?? '',
        });
    }

    fecharDetalhes() {
        this.modalDetalhesAberto = false;
        this.cartaoSelecionado = null;
        this.detalhesForm.reset();
        this.erroDetalhes = '';
        this.sucessoDetalhes = '';
    }

    salvarDetalhes() {
        if (!this.cartaoSelecionado) return;

        const card = this.cartaoSelecionado;
        const novoNickname = this.detalhesForm.value.nickname ?? '';
        const novoCode = (this.detalhesForm.value.card_code ?? '').trim();

        const nicknameMudou = novoNickname !== (card.nickname ?? '');
        const codeMudou = novoCode !== card.card_code;

        if (!nicknameMudou && !codeMudou) {
            this.erroDetalhes = 'Nada foi alterado.';
            return;
        }

        this.salvandoDetalhes = true;
        this.erroDetalhes = '';
        this.sucessoDetalhes = '';

       
        if (codeMudou) {
            const uid = this.authService.currentFirebaseUser?.uid;
            if (!uid) {
                this.salvandoDetalhes = false;
                this.erroDetalhes = 'Usuário não logado.';
                return;
            }

            this.cardService.trocarCartao(card.id, novoCode, uid)
                .pipe(take(1))
                .subscribe({
                    next: () => {
                        this.salvandoDetalhes = false;
                        this.sucessoDetalhes = 'Cartão trocado com sucesso!';
                        this.carregarCartoes();

                        setTimeout(() => {
                            this.fecharDetalhes();
                        }, 1500);
                    },
                    error: (err) => {
                        this.salvandoDetalhes = false;
                        console.error('Erro ao trocar cartão:', err);
                        this.erroDetalhes = err?.message ?? 'Erro ao trocar cartão.';
                    },
                });
            return;
        }

        
        this.cardService.updateCardNickname(card.id, novoNickname)
            .pipe(take(1))
            .subscribe({
                next: () => {
                    this.salvandoDetalhes = false;
                    this.sucessoDetalhes = 'Apelido atualizado!';
                    this.carregarCartoes();

                    setTimeout(() => {
                        this.fecharDetalhes();
                    }, 1000);
                },
                error: (err) => {
                    this.salvandoDetalhes = false;
                    console.error('Erro ao atualizar apelido:', err);
                    this.erroDetalhes = 'Erro ao atualizar apelido.';
                },
            });
    }

    // ═══════════════════════════════════════════════════════════
    // MODAL REMOVER
    // ═══════════════════════════════════════════════════════════

    abrirRemover() {
        this.modalRemoverAberto = true;
        this.erroRemover = '';
    }

    fecharRemover() {
        this.modalRemoverAberto = false;
        this.erroRemover = '';
    }

    confirmarRemover() {
        if (!this.cartaoSelecionado) return;

        this.removendo = true;
        this.erroRemover = '';

        this.cardService.removeCard(this.cartaoSelecionado.id)
            .pipe(take(1))
            .subscribe({
                next: () => {
                    this.removendo = false;
                    this.fecharRemover();
                    this.fecharDetalhes();
                    this.carregarCartoes();
                },
                error: (err) => {
                    this.removendo = false;
                    console.error('Erro ao remover cartão:', err);
                    this.erroRemover = 'Erro ao desvincular cartão.';
                },
            });
    }

    // ═══════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════

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
        }).format(valor ?? 0);
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

    isBloqueado(card: CartaoModel): boolean {
        return card.card_status === CardStatus.BLOQUEADO;
    }

    getCategoriaLabel(cat: string): string {
        const mapa: Record<string, string> = {
            'comum': 'Comum',
            'estudante': 'Estudante',
            'idoso': 'Idoso',
            'deficiente': 'Deficiente',
            'trabalhador': 'Trabalhador',
            'avulso': 'Avulso',
        };
        return mapa[cat] ?? cat;
    }

    getTipoLabel(tipo: string): string {
        return tipo === 'virtual' ? 'Cartão Virtual' : 'Cartão Físico';
    }

    getStatusCartaoLabel(card: CartaoModel): string {
        const mapa: Record<string, string> = {
            'active': 'Ativo',
            'blocked': 'Bloqueado',
            'pending': 'Pendente',
            'expired': 'Expirado',
            'available': 'Disponível',
        };
        return mapa[card.card_status] ?? card.card_status;
    }
}