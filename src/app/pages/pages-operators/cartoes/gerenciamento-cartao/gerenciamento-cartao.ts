import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HeaderOperadora } from '@shared/componentes/headers/headerOperadora/header-operadora/header-operadora';
import { OperatorCardService, CreateCardPayload } from '@core/services/operatorCard/operator-card-service';
import { AuthService } from '@core/services/auth/auth-service';
import { CartaoModel, CardType, PassengerCategory } from '@core/models';

type AbaAtiva = 'lista' | 'cadastrar' | 'importar';

@Component({
    selector: 'app-gerenciamento-cartao',
    imports: [ReactiveFormsModule, CommonModule, HeaderOperadora],
    templateUrl: './gerenciamento-cartao.html',
    styleUrl: './gerenciamento-cartao.css',
})
export class GerenciamentoCartao implements OnInit {
    private fb = inject(FormBuilder);
    private cardService = inject(OperatorCardService);
    private authService = inject(AuthService);

    abaAtiva: AbaAtiva = 'lista';

    cartoes: CartaoModel[] = [];
    loading = false;
    importando = false;

    erro = '';
    sucesso = '';

    // Form de cadastro
    cadastroForm = this.fb.group({
        card_code: ['', Validators.required],
        card_type: [CardType.FISICO, Validators.required],
        passenger_category: [PassengerCategory.COMUM, Validators.required],
        nickname: [''],
    });

    // Importação
    arquivoSelecionado: File | null = null;

    ngOnInit() {
        this.carregarCartoes();
    }

    mudarAba(aba: AbaAtiva) {
        this.abaAtiva = aba;
        this.erro = '';
        this.sucesso = '';
    }

    carregarCartoes() {
        this.cardService.getMyCards().subscribe({
            next: (cartoes) => this.cartoes = cartoes,
            error: () => this.erro = 'Erro ao carregar cartões.',
        });
    }

    // ─── Helpers ───

    private getOperatorName(): string {
        const user = this.authService.currentUserSnapshot;
        return user?.type === 'operator' ? user.company_name : '';
    }

    // ─── CADASTRAR ───

    onSubmitCadastro() {
        if (this.cadastroForm.invalid) {
            this.cadastroForm.markAllAsTouched();
            return;
        }

        this.loading = true;
        this.erro = '';
        this.sucesso = '';

        const payload: CreateCardPayload = {
            card_code: this.cadastroForm.value.card_code!,
            card_type: this.cadastroForm.value.card_type as CardType,
            passenger_category: this.cadastroForm.value.passenger_category as PassengerCategory,
            nickname: this.cadastroForm.value.nickname ?? '',
            operator_name: this.getOperatorName(),
        };

        this.cardService.createCard(payload).subscribe({
            next: () => {
                this.loading = false;
                this.cadastroForm.reset({
                    card_type: CardType.FISICO,
                    passenger_category: PassengerCategory.COMUM,
                });
                this.carregarCartoes();

                // Muda a aba e SÓ DEPOIS seta a mensagem de sucesso,
                // porque mudarAba() limpa o `sucesso`.
                this.mudarAba('lista');
                this.sucesso = 'Cartão cadastrado com sucesso!';
            },
            error: (err) => {
                this.loading = false;
                console.error('Erro ao cadastrar cartão:', err);
                this.erro = 'Erro ao cadastrar cartão. Tente novamente.';
            },
        });
    }

    // IMPORTAR CSV

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        this.arquivoSelecionado = input.files?.[0] ?? null;
        this.erro = '';
        this.sucesso = '';
    }

    onImportar() {
        if (!this.arquivoSelecionado) return;

        this.importando = true;
        this.erro = '';
        this.sucesso = '';

        const reader = new FileReader();

        reader.onload = () => {
            try {
                const texto = String(reader.result ?? '');
                const payloads = this.parseCsv(texto);

                if (payloads.length === 0) {
                    this.importando = false;
                    this.erro = 'Nenhum cartão válido encontrado no arquivo.';
                    return;
                }

                const operatorName = this.getOperatorName();

                const payloadsComOperadora = payloads.map(p => ({
                    ...p,
                    operator_name: operatorName,
                }));

                this.cardService.bulkCreateCards(payloadsComOperadora).subscribe({
                    next: (criados) => {
                        this.importando = false;
                        this.arquivoSelecionado = null;

                        // Limpa o input file do DOM
                        const input = document.getElementById('file') as HTMLInputElement;
                        if (input) input.value = '';

                        this.carregarCartoes();
                        this.mudarAba('lista');
                        this.sucesso = `${criados.length} cartão(ões) importado(s) com sucesso!`;
                    },
                    error: (err) => {
                        this.importando = false;
                        console.error('Erro ao importar:', err);
                        this.erro = 'Erro ao importar cartões.';
                    },
                });
            } catch (e) {
                this.importando = false;
                console.error('Erro ao parsear CSV:', e);
                this.erro = 'Arquivo CSV inválido.';
            }
        };

        reader.onerror = () => {
            this.importando = false;
            this.erro = 'Erro ao ler o arquivo.';
        };

        reader.readAsText(this.arquivoSelecionado);
    }
    private parseCsv(texto: string): CreateCardPayload[] {
        const linhas = texto
            .split(/\r?\n/)
            .map(l => l.trim())
            .filter(l => l.length > 0);

        if (linhas.length === 0) return [];

        // Detecta se a primeira linha é cabeçalho
        const primeira = linhas[0].toLowerCase();
        const temCabecalho = primeira.includes('card_code');
        const dados = temCabecalho ? linhas.slice(1) : linhas;

        const payloads: CreateCardPayload[] = [];

        for (const linha of dados) {
            const partes = linha.split(',').map(p => p.trim());
            const [card_code, card_type, passenger_category, nickname] = partes;

            if (!card_code || !card_type) continue;

            // Valida tipo
            const tipoValido = Object.values(CardType).includes(card_type as CardType);
            if (!tipoValido) continue;

            // Categoria (opcional, default COMUM)
            const categoria = Object.values(PassengerCategory).includes(
                passenger_category as PassengerCategory
            )
                ? (passenger_category as PassengerCategory)
                : PassengerCategory.COMUM;

            payloads.push({
                card_code,
                card_type: card_type as CardType,
                passenger_category: categoria,
                nickname: nickname ?? '',
            });
        }

        return payloads;
    }
}