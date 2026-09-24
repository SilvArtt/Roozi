import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderOperadora } from '@shared/componentes/headers/headerOperadora/header-operadora/header-operadora';
import { OperatorRequestService } from '@core/services/operatorRequest/operator-request-service';
import {
    RequisicaoCartaoModel,
    BlockRequestModel,
    DeliveryStatus,
    BlockStatus,
    BlockReason,
} from '@core/models';

type AbaAtiva = 'cartao' | 'bloqueio';

@Component({
    selector: 'app-gerenciador-pedidos',
    imports: [CommonModule, HeaderOperadora],
    templateUrl: './gerenciador-pedidos.html',
    styleUrl: './gerenciador-pedidos.css',
})
export class GerenciadorPedidos implements OnInit {
    private requestService = inject(OperatorRequestService);

    abaAtiva: AbaAtiva = 'cartao';

    pedidosCartao: RequisicaoCartaoModel[] = [];
    pedidosBloqueio: BlockRequestModel[] = [];

    erro = '';
    sucesso = '';

    ngOnInit() {
        this.carregarTudo();
    }

    mudarAba(aba: AbaAtiva) {
        this.abaAtiva = aba;
        this.erro = '';
        this.sucesso = '';
    }

    carregarTudo() {
        this.requestService.getMyCardRequests().subscribe({
            next: (pedidos) => this.pedidosCartao = pedidos,
            error: () => this.erro = 'Erro ao carregar pedidos de cartão.',
        });

        this.requestService.getMyBlockRequests().subscribe({
            next: (pedidos) => this.pedidosBloqueio = pedidos,
            error: () => this.erro = 'Erro ao carregar pedidos de bloqueio.',
        });
    }

    // ─── PEDIDOS DE CARTÃO ───

    get totalPendentesCartao(): number {
        return this.pedidosCartao.filter(p =>
            p.status === DeliveryStatus.PAGAMENTO_PENDENTE ||
            p.status === DeliveryStatus.PROCESSANDO
        ).length;
    }

    aprovarCartao(pedido: RequisicaoCartaoModel) {
        this.requestService.updateCardRequestStatus(pedido.id, DeliveryStatus.PROCESSANDO).subscribe({
            next: () => {
                this.sucesso = 'Pedido aprovado.';
                this.carregarTudo();
            },
            error: () => this.erro = 'Erro ao aprovar pedido.',
        });
    }

    rejeitarCartao(pedido: RequisicaoCartaoModel) {
        this.requestService.updateCardRequestStatus(pedido.id, DeliveryStatus.CANCELADO).subscribe({
            next: () => {
                this.sucesso = 'Pedido rejeitado.';
                this.carregarTudo();
            },
            error: () => this.erro = 'Erro ao rejeitar pedido.',
        });
    }

    verDetalhesCartao(pedido: RequisicaoCartaoModel) {
        console.log('Detalhes do pedido:', pedido);
        // TODO: abrir modal com detalhes
    }

    formatarEntrega(pedido: RequisicaoCartaoModel): string {
        if (pedido.delivery_type === 'pickup') {
            return `Retirada — ${pedido.station ?? 'Estação não informada'}`;
        }
        return `Entrega — ${pedido.address?.city ?? ''}/${pedido.address?.state ?? ''}`;
    }

    formatarStatusCartao(status: DeliveryStatus): string {
        const mapa: Record<DeliveryStatus, string> = {
            [DeliveryStatus.PAGAMENTO_PENDENTE]: 'Aguardando pagamento',
            [DeliveryStatus.PROCESSANDO]: 'Processando',
            [DeliveryStatus.EM_CAMINHO]: 'Em caminho',
            [DeliveryStatus.ENVIADO]: 'Entregue',
            [DeliveryStatus.CANCELADO]: 'Cancelado',
        };
        return mapa[status] ?? status;
    }

    // ─── PEDIDOS DE BLOQUEIO ───

    get totalPendentesBloqueio(): number {
        return this.pedidosBloqueio.filter(p => p.status === BlockStatus.EM_ANDAMENTO).length;
    }

    aprovarBloqueio(pedido: BlockRequestModel) {
        this.requestService.updateBlockRequestStatus(pedido.id, BlockStatus.APROVADO).subscribe({
            next: () => {
                this.sucesso = 'Bloqueio aprovado. Cartão bloqueado.';
                this.carregarTudo();
            },
            error: () => this.erro = 'Erro ao aprovar bloqueio.',
        });
    }

    rejeitarBloqueio(pedido: BlockRequestModel) {
        this.requestService.updateBlockRequestStatus(pedido.id, BlockStatus.REJEITADO).subscribe({
            next: () => {
                this.sucesso = 'Bloqueio rejeitado.';
                this.carregarTudo();
            },
            error: () => this.erro = 'Erro ao rejeitar bloqueio.',
        });
    }

    verDetalhesBloqueio(pedido: BlockRequestModel) {
        console.log('Detalhes do bloqueio:', pedido);
        // TODO: abrir modal com detalhes
    }

    formatarMotivo(motivo: BlockReason): string {
        const mapa: Record<BlockReason, string> = {
            [BlockReason.Loss]: 'Perda ou extravio',
            [BlockReason.Theft]: 'Furto',
            [BlockReason.Robbery]: 'Roubo',
            [BlockReason.UnauthorizedUse]: 'Uso não autorizado',
            [BlockReason.DamagedCard]: 'Cartão danificado',
            [BlockReason.CardNotWorking]: 'Cartão não funciona',
            [BlockReason.SecondCopy]: 'Segunda via',
            [BlockReason.BenefitCancellation]: 'Cancelamento de benefício',
            [BlockReason.RegistrationChange]: 'Alteração cadastral',
            [BlockReason.Fraud]: 'Fraude',
            [BlockReason.ExpiredCard]: 'Cartão vencido',
            [BlockReason.Other]: 'Outro motivo',
        };
        return mapa[motivo] ?? motivo;
    }

    formatarStatusBloqueio(status: BlockStatus): string {
        const mapa: Record<BlockStatus, string> = {
            [BlockStatus.EM_ANDAMENTO]: 'Em andamento',
            [BlockStatus.APROVADO]: 'Aprovado',
            [BlockStatus.REJEITADO]: 'Rejeitado',
        };
        return mapa[status] ?? status;
    }
}