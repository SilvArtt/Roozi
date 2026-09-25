import { inject, Injectable, Injector } from '@angular/core';
import {
    Firestore,
    collection,
    collectionData,
    doc,
    docData,
    addDoc,
    query,
    where,
    getDoc,
} from '@angular/fire/firestore';
import { AuthService } from '../auth/auth-service';
import {
    BlockRequestModel,
    BlockRequestPayload,
    BlockStatus,
    Passenger,
} from '@core/models';
import { CardService } from '../card/card-service';
import { from, map, Observable, of, switchMap, throwError } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class BlockRequestService {
    private injector = inject(Injector);
    private authService = inject(AuthService);
    private cardService = inject(CardService);

    private get firestore(): Firestore {
        return this.injector.get(Firestore);
    }

    createBlockRequest(payload: BlockRequestPayload): Observable<BlockRequestModel> {
        const uid = this.authService.currentFirebaseUser?.uid;

        if (!uid) {
            return throwError(() => new Error('Usuário não logado'));
        }

        return this.cardService.getCardByCode(payload.card_code).pipe(
            switchMap((card) => {
                if (!card) {
                    return throwError(() => new Error('Cartão não encontrado'));
                }

                
                if (card.user_id) {
                    return this.validarDono(card.user_id, payload).pipe(
                        switchMap(() => this.criarBlockRequest(uid, card.id, card.operator_id, payload))
                    );
                }

                
                return this.criarBlockRequest(uid, card.id, card.operator_id, payload);
            })
        );
    }

    // ═══════════════════════════════════════════════════════════
    // VALIDAÇÃO DO DONO
    // ═══════════════════════════════════════════════════════════

    private validarDono(userId: string, payload: BlockRequestPayload): Observable<void> {
        const userRef = doc(this.firestore, `users/${userId}`);

        return from(getDoc(userRef)).pipe(
            switchMap((snap) => {
                if (!snap.exists()) {
                    return throwError(() => new Error('Titular do cartão não encontrado'));
                }

                const dono = snap.data() as Passenger;

                // 1) Valida nome
                const nomeConfere = this.normalizarNome(dono.full_name) ===
                                    this.normalizarNome(payload.holder_name);

                if (!nomeConfere) {
                    return throwError(() => new Error(
                        'Nome não confere com o titular do cartão.'
                    ));
                }

                
                if (payload.has_cpf_linked && dono.cpf) {
                    const cpfLimpo = this.limparCpf(payload.cpf ?? '');
                    const cpfDonoLimpo = this.limparCpf(dono.cpf);

                    if (cpfLimpo && cpfLimpo !== cpfDonoLimpo) {
                        return throwError(() => new Error(
                            'CPF não confere com o titular do cartão.'
                        ));
                    }
                }

                return of(undefined);
            })
        );
    }

    // ═══════════════════════════════════════════════════════════
    // CRIAÇÃO DO BLOCK REQUEST
    // ═══════════════════════════════════════════════════════════

    private criarBlockRequest(
        uid: string,
        cardId: string,
        operatorId: string,
        payload: BlockRequestPayload
    ): Observable<BlockRequestModel> {
        const blockReqRef = collection(this.firestore, 'block_requests');

        
        const newBlockRequest = {
            user_id: uid,
            card_id: cardId,
            operator_id: operatorId,
            holder_name: payload.holder_name ?? '',
            card_type: payload.card_type,
            has_cpf_linked: payload.has_cpf_linked ?? false,
            cpf: payload.has_cpf_linked ? (payload.cpf ?? '') : '',
            reason: payload.reason,
            other_reason: payload.other_reason ?? '',
            status: BlockStatus.EM_ANDAMENTO,
            created_at: new Date(),
        };

        return from(addDoc(blockReqRef, newBlockRequest)).pipe(
            map((ref) => ({ ...newBlockRequest, id: ref.id } as BlockRequestModel))
        );
    }

    // ═══════════════════════════════════════════════════════════
    // GETS
    // ═══════════════════════════════════════════════════════════

    getMyBlockRequests(): Observable<BlockRequestModel[]> {
        const uid = this.authService.currentFirebaseUser?.uid;

        if (!uid) return of([]);

        const blockReqRef = collection(this.firestore, 'block_requests');

        const blockReqQuery = query(blockReqRef,
            where('user_id', '==', uid)
        );

        return collectionData(blockReqQuery, {
            idField: 'id'
        }) as Observable<BlockRequestModel[]>;
    }

    getBlockRequestById(id: string): Observable<BlockRequestModel | null> {
        const blockReqRef = doc(this.firestore, `block_requests/${id}`);

        return docData(blockReqRef, {
            idField: 'id'
        }) as Observable<BlockRequestModel | null>;
    }

    // ═══════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════

    private normalizarNome(nome: string): string {
        return (nome ?? '')
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, ' ');
    }

    private limparCpf(cpf: string): string {
        return (cpf ?? '').replace(/\D/g, '');
    }
}