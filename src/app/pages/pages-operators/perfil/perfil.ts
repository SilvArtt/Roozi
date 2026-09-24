import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HeaderOperadora } from '@shared/componentes/headers/headerOperadora/header-operadora/header-operadora';
import { AuthService } from '@core/services/auth/auth-service';
import { OperatorService } from '@core/services/operator/operator-service';
import { RegionService } from '@core/services/region/region-service';
import {
    Operator,
    CardType,
    PassengerCategory,
    Region,
} from '@core/models';

type AbaAtiva = 'dados' | 'areas' | 'config';

@Component({
    selector: 'app-perfil',
    imports: [ReactiveFormsModule, CommonModule, HeaderOperadora],
    templateUrl: './perfil.html',
    styleUrl: './perfil.css',
})
export class Perfil implements OnInit {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private operatorService = inject(OperatorService);
    private regionService = inject(RegionService);

    abaAtiva: AbaAtiva = 'dados';

    carregando = true;
    salvando = false;
    erro = '';
    sucesso = '';

    regioes: Region[] = [];
    areaIdsSelecionadas: string[] = [];

    cardTypesSelecionados: CardType[] = [];
    categoriesSelecionadas: PassengerCategory[] = [];

    tiposDisponiveis = [
        { valor: CardType.FISICO, label: 'Cartão Físico' },
        { valor: CardType.VIRTUAL, label: 'Cartão Virtual' },
    ];

    categoriasDisponiveis = [
        { valor: PassengerCategory.COMUM, label: 'Comum' },
        { valor: PassengerCategory.ESTUDANTE, label: 'Estudante' },
        { valor: PassengerCategory.IDOSO, label: 'Idoso' },
        { valor: PassengerCategory.DEFICIENTE, label: 'Deficiente' },
        { valor: PassengerCategory.TRABALHADOR, label: 'Trabalhador' },
        { valor: PassengerCategory.AVULSO, label: 'Avulso' },
    ];

    // Aba 1: dados da empresa
    dadosForm = this.fb.group({
        company_name: ['', Validators.required],
        manager_name: ['', Validators.required],
        cnpj: ['', Validators.required],
        company_phone: ['', Validators.required],
    });

    // Aba 3: sistema de bilhetagem (form separado)
    configForm = this.fb.group({
        billing_system: [''],
    });

    ngOnInit() {
        this.carregarPerfil();
        this.carregarRegioes();
    }

    mudarAba(aba: AbaAtiva) {
        this.abaAtiva = aba;
        this.erro = '';
        this.sucesso = '';
    }

    carregarPerfil() {
        this.authService.currentUser$.subscribe((u) => {
            if (u && u.type === 'operator') {
                const op = u as Operator;
                this.dadosForm.patchValue({
                    company_name: op.company_name ?? '',
                    manager_name: op.manager_name ?? '',
                    cnpj: op.cnpj ?? '',
                    company_phone: op.company_phone ?? '',
                });
            }
        });

        this.operatorService.getMyOperatorProfile().subscribe({
            next: (op) => {
                if (op) {
                    this.areaIdsSelecionadas = [...op.area_ids];
                    this.cardTypesSelecionados = [...op.available_card_types];
                    this.categoriesSelecionadas = [...op.available_categories];
                    this.configForm.patchValue({
                        billing_system: op.billing_system ?? '',
                    });
                }
                this.carregando = false;
            },
            error: () => {
                this.erro = 'Erro ao carregar perfil.';
                this.carregando = false;
            },
        });
    }

    carregarRegioes() {
        this.regionService.getActiveRegions().subscribe({
            next: (regioes) => this.regioes = regioes,
            error: () => this.erro = 'Erro ao carregar regiões.',
        });
    }

    // ─── ABA 1: DADOS ───

    salvarDados() {
        if (this.dadosForm.invalid) {
            this.dadosForm.markAllAsTouched();
            return;
        }

        const uid = this.authService.currentFirebaseUser?.uid;
        if (!uid) {
            this.erro = 'Usuário não logado.';
            return;
        }

        this.salvando = true;
        this.erro = '';
        this.sucesso = '';

        this.authService.updateUserProfile(uid, {
            company_name: this.dadosForm.value.company_name!,
            manager_name: this.dadosForm.value.manager_name!,
            cnpj: this.dadosForm.value.cnpj!,
            company_phone: this.dadosForm.value.company_phone!,
        }).subscribe({
            next: () => {
                this.salvando = false;
                this.sucesso = 'Dados salvos com sucesso!';
            },
            error: () => {
                this.salvando = false;
                this.erro = 'Erro ao salvar dados.';
            },
        });
    }

    // ─── ABA 2: ÁREAS ───

    toggleArea(areaId: string) {
        const idx = this.areaIdsSelecionadas.indexOf(areaId);
        if (idx >= 0) {
            this.areaIdsSelecionadas = this.areaIdsSelecionadas.filter(id => id !== areaId);
        } else {
            this.areaIdsSelecionadas = [...this.areaIdsSelecionadas, areaId];
        }
    }

    salvarAreas() {
        const uid = this.authService.currentFirebaseUser?.uid;
        if (!uid) return;

        this.salvando = true;
        this.erro = '';
        this.sucesso = '';

        this.operatorService.updateOperatorProfile(uid, {
            area_ids: this.areaIdsSelecionadas,
        }).subscribe({
            next: () => {
                this.salvando = false;
                this.sucesso = 'Áreas salvas com sucesso!';
            },
            error: () => {
                this.salvando = false;
                this.erro = 'Erro ao salvar áreas.';
            },
        });
    }

    // ─── ABA 3: CONFIG ───

    toggleCardType(tipo: CardType) {
        const idx = this.cardTypesSelecionados.indexOf(tipo);
        if (idx >= 0) {
            this.cardTypesSelecionados = this.cardTypesSelecionados.filter(t => t !== tipo);
        } else {
            this.cardTypesSelecionados = [...this.cardTypesSelecionados, tipo];
        }
    }

    toggleCategory(cat: PassengerCategory) {
        const idx = this.categoriesSelecionadas.indexOf(cat);
        if (idx >= 0) {
            this.categoriesSelecionadas = this.categoriesSelecionadas.filter(c => c !== cat);
        } else {
            this.categoriesSelecionadas = [...this.categoriesSelecionadas, cat];
        }
    }

    salvarConfig() {
        const uid = this.authService.currentFirebaseUser?.uid;
        if (!uid) return;

        this.salvando = true;
        this.erro = '';
        this.sucesso = '';

        this.operatorService.updateOperatorProfile(uid, {
            available_card_types: this.cardTypesSelecionados,
            available_categories: this.categoriesSelecionadas,
            billing_system: this.configForm.value.billing_system ?? '',
        }).subscribe({
            next: () => {
                this.salvando = false;
                this.sucesso = 'Configurações salvas!';
            },
            error: () => {
                this.salvando = false;
                this.erro = 'Erro ao salvar configurações.';
            },
        });
    }
}