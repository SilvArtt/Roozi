import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
    private destroyRef = inject(DestroyRef);
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
        has_cpf: ['', Validators.required],   
        cpf: [''],                           
        delivery_type: [''],                  
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

    // ═══════════════════════════════════════════════════════════
    // GETTERS AUXILIARES (pro template)
    // ═══════════════════════════════════════════════════════════

    get cardType(): string {
        return this.solicitacaoForm.get('card_type')?.value ?? '';
    }

    get passengerCategory(): string {
        return this.solicitacaoForm.get('passenger_category')?.value ?? '';
    }

    get deliveryType(): string {
        return this.solicitacaoForm.get('delivery_type')?.value ?? '';
    }

    get hasCpf(): string {
        return this.solicitacaoForm.get('has_cpf')?.value ?? '';
    }

    get isVirtual(): boolean {
        return this.cardType === CardType.VIRTUAL;
    }

    get isAvulso(): boolean {
        return this.passengerCategory === PassengerCategory.AVULSO;
    }

    /** Mostra bloco de CPF só se não for avulso E o usuário escolheu "Sim" */
    get mostrarInputCpf(): boolean {
        return !this.isAvulso && this.hasCpf === 'true';
    }

    /** Mostra pergunta de CPF só se NÃO for avulso */
    get mostrarPerguntaCpf(): boolean {
        return !this.isAvulso;
    }

    /** Mostra bloco de entrega só se NÃO for virtual */
    get mostrarEntrega(): boolean {
        return !this.isVirtual && !!this.cardType;
    }

    // ═══════════════════════════════════════════════════════════
    // CICLO DE VIDA
    // ═══════════════════════════════════════════════════════════

    ngOnInit() {
        this.carregarRegioes();
        this.escutarMudancaRegiao();
        this.escutarMudancaOperadora();
        this.escutarMudancaCardType();
        this.escutarMudancaCategoria();
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
        this.solicitacaoForm.get('region_id')?.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((regionId) => {
                this.solicitacaoForm.patchValue({
                    operator_id: '',
                    card_type: '',
                    passenger_category: '',
                    has_cpf: '',
                    cpf: '',
                    delivery_type: '',
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
        this.solicitacaoForm.get('operator_id')?.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((operatorId) => {
                this.solicitacaoForm.patchValue({
                    card_type: '',
                    passenger_category: '',
                    has_cpf: '',
                    cpf: '',
                    delivery_type: '',
                });

                this.tiposDisponiveis = [];
                this.categoriasDisponiveis = [];

                if (!operatorId) return;

                const op = this.operadoras.find(o => o.id === operatorId);
                if (!op) return;

                this.tiposDisponiveis = (op.available_card_types || []).map(t => ({
                    valor: t,
                    label: this.tiposLabel[t] ?? t,
                }));

                this.categoriasDisponiveis = (op.available_categories || []).map(c => ({
                    valor: c,
                    label: this.categoriasLabel[c] ?? c,
                }));
            });
    }

    // ═══════════════════════════════════════════════════════════
    // CASCATA: Card Type → limpa delivery se virtual
    // ═══════════════════════════════════════════════════════════

    private escutarMudancaCardType() {
        this.solicitacaoForm.get('card_type')?.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((type) => {
                if (type === CardType.VIRTUAL) {
                    this.limparCamposEntrega();
                }
                // Se virou físico, o campo delivery_type volta a ser obrigatório
                this.atualizarValidadoresDelivery();
            });
    }

    // ═══════════════════════════════════════════════════════════
    // CASCATA: Categoria → avulso limpa CPF
    // ═══════════════════════════════════════════════════════════

    private escutarMudancaCategoria() {
        this.solicitacaoForm.get('passenger_category')?.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((cat) => {
                if (cat === PassengerCategory.AVULSO) {
                    this.solicitacaoForm.patchValue({
                        has_cpf: '',
                        cpf: '',
                    });
                }
            });
    }

    // ═══════════════════════════════════════════════════════════
    // CASCATA: Delivery Type → limpa campos
    // ═══════════════════════════════════════════════════════════

    private escutarMudancaDeliveryType() {
        this.solicitacaoForm.get('delivery_type')?.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((type) => {
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
    // VALIDADORES CONDICIONAIS
    // ═══════════════════════════════════════════════════════════

    private atualizarValidadoresDelivery() {
        const deliveryCtrl = this.solicitacaoForm.get('delivery_type');

        if (this.isVirtual) {
            deliveryCtrl?.clearValidators();
        } else {
            deliveryCtrl?.setValidators([Validators.required]);
        }
        deliveryCtrl?.updateValueAndValidity();
    }

    private limparCamposEntrega() {
        this.solicitacaoForm.patchValue({
            delivery_type: '',
            station: '',
            zip_code: '',
            address_number: '',
            street: '',
            complement: '',
            neighborhood: '',
            city: '',
            state: '',
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
        const cardType = formValue.card_type as CardType;
        const isVirtual = cardType === CardType.VIRTUAL;
        const isAvulso = formValue.passenger_category === PassengerCategory.AVULSO;
        const hasCpf = formValue.has_cpf === 'true' && !isAvulso;

        const payload: RequisicaoPayLoad = {
            user_id: uid,
            area_id: formValue.region_id!,
            operator_id: formValue.operator_id!,
            card_type: cardType,
            passenger_category: formValue.passenger_category as PassengerCategory,
            has_cpf_linked: hasCpf,
            cpf: hasCpf ? (formValue.cpf ?? '') : undefined,
            lgpd_consent: formValue.lgpd!,
        };

        
        if (!isVirtual) {
            const deliveryType = formValue.delivery_type as DeliveryType;
            payload.delivery_type = deliveryType;

            if (deliveryType === 'pickup') {
                payload.station = formValue.station ?? '';
            }

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
        }

        this.cardRequestService.createCardRequest(payload).pipe(take(1)).subscribe({
            next: () => {
                this.loading = false;
                this.sucesso = isVirtual
                    ? 'Solicitação enviada! Quando a operadora aprovar, seu cartão virtual estará disponível no dashboard.'
                    : 'Solicitação enviada! A operadora vai analisar em breve.';

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
            takeUntilDestroyed(this.destroyRef),
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