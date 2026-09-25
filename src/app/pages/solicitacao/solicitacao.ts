import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { take } from 'rxjs';
import { HeaderApp } from '../../shared/componentes/headers/header-app/header-app';
import { CepService } from '@core/services/cep/cep-service';
import { RegionService } from '@core/services/region/region-service';
import { OperatorService } from '@core/services/operator/operator-service';
import { CardRequestService } from '@core/services/card/cardRequest/card-request-service';
import { AuthService } from '@core/services/auth/auth-service';
import { debounceTime, distinctUntilChanged, filter, switchMap } from 'rxjs';
import {
    Region,
    OperatorCompany,
    CardType,
    PassengerCategory,
    DeliveryType,
    DeliveryStatus,
    RequisicaoPayLoad,
} from '@core/models';

@Component({
    selector: 'app-solicitacao',
    imports: [ReactiveFormsModule, CommonModule, HeaderApp],
    templateUrl: './solicitacao.html',
    styleUrl: './solicitacao.css',
})
export class Solicitacao implements OnInit {
    private fb = inject(FormBuilder);
    private cepService = inject(CepService);
    private regionService = inject(RegionService);
    private operatorService = inject(OperatorService);
    private cardRequestService = inject(CardRequestService);
    private authService = inject(AuthService);
    private router = inject(Router);

    loading = false;
    buscandoCep = false;
    erroCep = false;
    erro = '';
    sucesso = '';

    // Dados dinâmicos dos selects
    regioes: Region[] = [];
    operadoras: OperatorCompany[] = [];
    tiposDisponiveis: { valor: CardType; label: string }[] = [];
    categoriasDisponiveis: { valor: PassengerCategory; label: string }[] = [];

    // Labels pros enums
    private tiposLabel: Record<string, string> = {
        'physical': 'Cartão Físico',
        'virtual': 'Cartão Virtual',
    };

    private categoriasLabel: Record<string, string> = {
        'comum': 'Comum',
        'estudante': 'Estudante',
        'idoso': 'Idoso',
        'deficiente': 'Deficiente',
        'trabalhador': 'Trabalhador',
        'avulso': 'Avulso',
    };

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
        this.carregarRegioes();
        this.escutarMudancaRegiao();
        this.escutarMudancaOperadora();
        this.escutarMudancaDeliveryType();
        this.escutarCep();
    }

    // ═══════════════════════════════════════════════════════════
    // CARREGAR DADOS
    // ═══════════════════════════════════════════════════════════

    carregarRegioes() {
        this.regionService.getActiveRegions().pipe(take(1)).subscribe({
            next: (regioes) => {
                this.regioes = regioes;
            },
            error: (err) => {
                console.error('Erro ao carregar regiões:', err);
                this.erro = 'Erro ao carregar regiões.';
            },
        });
    }

    // ═══════════════════════════════════════════════════════════
    // CASCATA: Região → Operadoras
    // ═══════════════════════════════════════════════════════════

    private escutarMudancaRegiao() {
        this.solicitacaoForm.get('region_id')?.valueChanges.subscribe((regionId) => {
            // Limpa campos dependentes
            this.solicitacaoForm.patchValue({
                operator_id: '',
                card_type: '',
                passenger_category: '',
            });

            this.operadoras = [];
            this.tiposDisponiveis = [];
            this.categoriasDisponiveis = [];

            if (!regionId) return;

            this.operatorService.getOperatorsByRegion(regionId).pipe(take(1)).subscribe({
                next: (ops) => {
                    this.operadoras = ops;
                },
                error: (err) => {
                    console.error('Erro ao carregar operadoras:', err);
                    this.erro = 'Erro ao carregar operadoras.';
                },
            });
        });
    }

    // ═══════════════════════════════════════════════════════════
    // CASCATA: Operadora → Tipos + Categorias
    // ═══════════════════════════════════════════════════════════

    private escutarMudancaOperadora() {
        this.solicitacaoForm.get('operator_id')?.valueChanges.subscribe((operatorId) => {
            // Limpa campos dependentes
            this.solicitacaoForm.patchValue({
                card_type: '',
                passenger_category: '',
            });

            this.tiposDisponiveis = [];
            this.categoriasDisponiveis = [];

            if (!operatorId) return;

            const op = this.operadoras.find(o => o.id === operatorId);
            if (!op) return;

            // Popula tipos
            this.tiposDisponiveis = (op.available_card_types || []).map(t => ({
                valor: t,
                label: this.tiposLabel[t] ?? t,
            }));

            // Popula categorias
            this.categoriasDisponiveis = (op.available_categories || []).map(c => ({
                valor: c,
                label: this.categoriasLabel[c] ?? c,
            }));
        });
    }

    // ═══════════════════════════════════════════════════════════
    // CASCATA: Delivery Type → limpa campos
    // ═══════════════════════════════════════════════════════════

    private escutarMudancaDeliveryType() {
        this.solicitacaoForm.get('delivery_type')?.valueChanges.subscribe((type) => {
            if (type === 'pickup') {
                this.solicitacaoForm.patchValue({
                    zip_code: '',
                    address_number: '',
                    street: '',
                    complement: '',
                    neighborhood: '',
                    city: '',
                    state: '',
                });
            } else if (type === 'home_delivery') {
                this.solicitacaoForm.patchValue({
                    station: '',
                });
            }
        });
    }

    // ═══════════════════════════════════════════════════════════
    // SUBMIT
    // ═══════════════════════════════════════════════════════════

    onSubmit() {
        this.erro = '';
        this.sucesso = '';

        if (this.solicitacaoForm.invalid) {
            this.solicitacaoForm.markAllAsTouched();
            return;
        }

        const uid = this.authService.currentFirebaseUser?.uid;
        if (!uid) {
            this.erro = 'Usuário não logado.';
            return;
        }

        this.loading = true;

        const formValue = this.solicitacaoForm.getRawValue();
        const deliveryType = formValue.delivery_type as DeliveryType;

        // Monta o payload
        const payload: RequisicaoPayLoad = {
            user_id: uid,
            area_id: formValue.region_id!,
            operator_id: formValue.operator_id!,
            card_type: formValue.card_type as CardType,
            passenger_category: formValue.passenger_category as PassengerCategory,
            cpf: formValue.cpf ?? '',
            delivery_type: deliveryType,
            lgpd_consent: formValue.lgpd!,
        };

        // Se for pickup
        if (deliveryType === 'pickup') {
            payload.station = formValue.station ?? '';
        }

        // Se for home_delivery → monta o address
        if (deliveryType === 'home_delivery') {
            payload.address = {
                cep: formValue.zip_code ?? '',
                street: formValue.street ?? '',
                number: formValue.address_number ?? '',
                complement: formValue.complement ?? '',
                neighborhood: formValue.neighborhood ?? '',
                city: formValue.city ?? '',
                state: formValue.state ?? '',
            };
        }

        this.cardRequestService.createCardRequest(payload).pipe(take(1)).subscribe({
            next: (req) => {
                this.loading = false;
                this.sucesso = 'Solicitação enviada! A operadora vai analisar em breve.';

                setTimeout(() => {
                    this.router.navigate(['/dashboard']);
                }, 1500);
            },
            error: (err) => {
                this.loading = false;
                console.error('Erro ao solicitar cartão:', err);
                this.erro = err?.message ?? 'Erro ao solicitar cartão. Tente novamente.';
            },
        });
    }

    // ═══════════════════════════════════════════════════════════
    // CEP
    // ═══════════════════════════════════════════════════════════

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