import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { OperatorCardService } from '@core/services/operatorCard/operator-card-service';
import { OperatorRequestService } from '@core/services/operatorRequest/operator-request-service';
import { HeaderOperadora } from '@shared/componentes/headers/headerOperadora/header-operadora/header-operadora';

@Component({
    selector: 'app-operator-dashboard',
    imports: [RouterLink, HeaderOperadora],
    templateUrl: './operator-dashboard.html',
    styleUrl: './operator-dashboard.css',
})
export class OperatorDashboard implements OnInit {
    private destroyRef = inject(DestroyRef);
    private cardService = inject(OperatorCardService);
    private requestService = inject(OperatorRequestService);

    stats = {
        cartoesDisponiveis: 0,
        cartoesVinculados: 0,
        pedidosPendentes: 0,
        bloqueiosPendentes: 0,
    };

    ngOnInit() {
        this.cardService.getAvailableCards()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(cards => {
                this.stats.cartoesDisponiveis = cards.length;
            });

        this.cardService.getLinkedCards()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(cards => {
                this.stats.cartoesVinculados = cards.length;
            });

        this.requestService.getPendingCardRequests()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(reqs => {
                this.stats.pedidosPendentes = reqs.length;
            });

        this.requestService.getPendingBlockRequests()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(reqs => {
                this.stats.bloqueiosPendentes = reqs.length;
            });
    }
}