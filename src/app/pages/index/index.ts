import { Component, OnDestroy, OnInit } from '@angular/core';
import { Footer } from '../../shared/componentes/footer/footer';
import { HeaderHome } from '../../shared/componentes/headers/header-home/header-home';

interface Objetivo {
    icon: string;
    titulo: string;
    descricao: string;
}

@Component({
    selector: 'app-index',
    imports: [Footer, HeaderHome],
    templateUrl: './index.html',
    styleUrl: './index.css',
})
export class Index implements OnInit, OnDestroy {
    objetivos: Objetivo[] = [
        {
            icon: '⚡',
            titulo: 'Praticidade',
            descricao: 'Emissão, gerenciamento e bloqueio do seu cartão de passagem em um único lugar, sem precisar recorrer a múltiplos canais de atendimento.',
        },
        {
            icon: '🚀',
            titulo: 'Facilidade',
            descricao: 'Recarregue, ative ou bloqueie seu cartão em poucos toques, reduzindo filas presenciais e resolvendo imprevistos na hora.',
        },
        {
            icon: '📊',
            titulo: 'Controle',
            descricao: 'Acompanhe de forma clara quanto você gasta com transporte por dia, mês e ano, e planeje melhor o seu orçamento.',
        },
    ];

    currentIndex = 0;
    private autoPlayInterval?: ReturnType<typeof setInterval>;

    // ═══════════════════════════════════════════════════════════
    // CICLO DE VIDA
    // ═══════════════════════════════════════════════════════════

    ngOnInit() {
        this.iniciarAutoPlay();
    }

    ngOnDestroy() {
        this.pararAutoPlay();
    }

    // ═══════════════════════════════════════════════════════════
    // NAVEGAÇÃO DO CARROSSEL
    // ═══════════════════════════════════════════════════════════

  
    next() {
        if (this.currentIndex < this.objetivos.length - 1) {
            this.currentIndex++;
        } else {
            this.currentIndex = 0;
        }
        this.reiniciarAutoPlay();
    }

    prev() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
        } else {
            this.currentIndex = this.objetivos.length - 1;
        }
        this.reiniciarAutoPlay();
    }

  
    goTo(index: number) {
        this.currentIndex = index;
        this.reiniciarAutoPlay();
    }

    // ═══════════════════════════════════════════════════════════
    // AUTO-PLAY
    // ═══════════════════════════════════════════════════════════

    private iniciarAutoPlay() {
        this.autoPlayInterval = setInterval(() => {
            this.currentIndex = (this.currentIndex + 1) % this.objetivos.length;
        }, 6000);
    }

 
    private pararAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = undefined;
        }
    }

    private reiniciarAutoPlay() {
        this.pararAutoPlay();
        this.iniciarAutoPlay();
    }
}