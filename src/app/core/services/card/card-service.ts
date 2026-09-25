import { inject, Injectable, Injector } from '@angular/core';
import {
    Firestore,
    collection,
    collectionData,
    doc,
    docData,
    query,
    runTransaction,
    updateDoc,
    where,
} from '@angular/fire/firestore';
import { AddCardPayload, CardStatus, CartaoModel } from '@core/models';
import { from, map, Observable, of, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth-service';

@Injectable({
    providedIn: 'root',
})
export class CardService {
    private injector = inject(Injector);
    private authService = inject(AuthService);

    private get firestore(): Firestore {
        return this.injector.get(Firestore);
    }

    getMyCards(): Observable<CartaoModel[]> {
        const uid = this.authService.currentFirebaseUser?.uid;
        if (!uid) return of([]);

        const cardRef = collection(this.firestore, 'cards');
        const cardQuery = query(cardRef, where('user_id', '==', uid));

        return collectionData(cardQuery, { idField: 'id' }) as Observable<CartaoModel[]>;
    }

    getCardById(id: string): Observable<CartaoModel | null> {
        const cardRef = doc(this.firestore, `cards/${id}`);
        return docData(cardRef, { idField: 'id' }) as Observable<CartaoModel | null>;
    }

    getCardByCode(code: string): Observable<CartaoModel | null> {
        const cardRef = collection(this.firestore, 'cards');
        const cardQuery = query(cardRef, where('card_code', '==', code));

        return collectionData(cardQuery, { idField: 'id' }).pipe(
            map(arr => arr.length > 0 ? arr[0] : null)
        ) as Observable<CartaoModel | null>;
    }

    addCard(payload: AddCardPayload): Observable<CartaoModel> {
        const uid = this.authService.currentFirebaseUser?.uid;

        if (!uid) {
            return throwError(() => new Error('Usuário não logado'));
        }

        return this.getCardByCode(payload.card_code).pipe(
            switchMap((card) => {
                if (!card) {
                    return throwError(() => new Error('Cartão não encontrado'));
                }

                if (card.user_id) {
                    return throwError(() => new Error('Cartão já vinculado a outro usuário'));
                }

                if (card.card_status === CardStatus.BLOQUEADO) {
                    return throwError(() => new Error('Este cartão está bloqueado'));
                }

                // Vincula o cartão
                const cardRef = doc(this.firestore, `cards/${card.id}`);
                const updates = {
                    user_id: uid,
                    nickname: payload.nickname || '',
                    card_status: CardStatus.ATIVO,
                    updated_at: new Date(),
                };

                return from(updateDoc(cardRef, updates)).pipe(
                    switchMap(() => {
                        // Verifica se há cartão antigo bloqueado com saldo congelado
                        return this.getBlockedCardWithFrozenBalance(uid);
                    }),
                    switchMap((blockedCard) => {
                        // Se não tem, retorna o novo cartão
                        if (!blockedCard || !blockedCard.frozen_balance) {
                            return of({ ...card, ...updates } as CartaoModel);
                        }

                        // Transfere saldo do cartão antigo pro novo
                        const frozenBalance = blockedCard.frozen_balance;
                        const newBalance = (card.balance || 0) + frozenBalance;

                        // Atualiza o novo cartão
                        const newCardRef = doc(this.firestore, `cards/${card.id}`);
                        const newCardUpdate = {
                            balance: newBalance,
                            updated_at: new Date(),
                        };

                        // Atualiza o antigo
                        const oldCardRef = doc(this.firestore, `cards/${blockedCard.id}`);
                        const oldCardUpdate = {
                            frozen_balance: 0,
                            transferred_to: card.id,
                            updated_at: new Date(),
                        };

                        return from(
                            Promise.all([
                                updateDoc(newCardRef, newCardUpdate),
                                updateDoc(oldCardRef, oldCardUpdate),
                            ])
                        ).pipe(
                            map(() => ({
                                ...card,
                                ...updates,
                                ...newCardUpdate,
                            } as CartaoModel))
                        );
                    })
                );
            })
        );
    }

    updateCardNickname(cardId: string, nickname: string): Observable<void> {
        const cardRef = doc(this.firestore, `cards/${cardId}`);
        return from(updateDoc(cardRef, {
            nickname: nickname ?? '',
            updated_at: new Date(),
        }));
    }

    trocarCartao(
        cardIdAtual: string,
        novoCardCode: string,
        uid: string
    ): Observable<CartaoModel> {
        if (!uid) {
            return throwError(() => new Error('Usuário não logado'));
        }

        // 1. Verifica o cartão atual (não pode ter saldo)
        return this.getCardById(cardIdAtual).pipe(
            switchMap((cardAtual) => {
                if (!cardAtual) {
                    return throwError(() => new Error('Cartão atual não encontrado'));
                }

                if ((cardAtual.balance ?? 0) > 0) {
                    return throwError(() => new Error(
                        'Não é possível trocar o código de um cartão com saldo. Zere o saldo primeiro.'
                    ));
                }

                // 2. Busca o novo cartão
                return this.getCardByCode(novoCardCode).pipe(
                    switchMap((novoCard) => {
                        if (!novoCard) {
                            return throwError(() => new Error('Novo cartão não encontrado'));
                        }

                        if (novoCard.id === cardIdAtual) {
                            return throwError(() => new Error('O novo código é igual ao atual'));
                        }

                        if (novoCard.user_id) {
                            return throwError(() => new Error('Novo cartão já está vinculado a outro usuário'));
                        }

                        if (novoCard.card_status === CardStatus.BLOQUEADO) {
                            return throwError(() => new Error('Novo cartão está bloqueado'));
                        }

                        // 3. Transaction: desvincula antigo + vincula novo
                        return from(
                            runTransaction(this.firestore, async (transaction) => {
                                const oldCardRef = doc(this.firestore, `cards/${cardIdAtual}`);
                                const newCardRef = doc(this.firestore, `cards/${novoCard.id}`);

                                // Re-lê os dois dentro da transaction
                                const oldSnap = await transaction.get(oldCardRef);
                                const newSnap = await transaction.get(newCardRef);

                                if (!oldSnap.exists()) {
                                    throw new Error('Cartão atual não encontrado');
                                }

                                if (!newSnap.exists()) {
                                    throw new Error('Novo cartão não encontrado');
                                }

                                const oldData = oldSnap.data() as CartaoModel;
                                const newData = newSnap.data() as CartaoModel;

                                if ((oldData.balance ?? 0) > 0) {
                                    throw new Error('Cartão atual tem saldo. Não é possível trocar.');
                                }

                                if (newData.user_id) {
                                    throw new Error('Novo cartão já está vinculado');
                                }

                                if (newData.card_status === CardStatus.BLOQUEADO) {
                                    throw new Error('Novo cartão está bloqueado');
                                }

                                // Desvincula o antigo
                                transaction.update(oldCardRef, {
                                    user_id: '',
                                    nickname: '',
                                    card_status: CardStatus.DISPONIVEL,
                                    updated_at: new Date(),
                                });

                                // Vincula o novo (mantém o nickname do antigo)
                                const novoNickname = oldData.nickname || '';
                                const newUpdate = {
                                    user_id: uid,
                                    nickname: novoNickname,
                                    card_status: CardStatus.ATIVO,
                                    updated_at: new Date(),
                                };
                                transaction.update(newCardRef, newUpdate);

                                return { ...newData, ...newUpdate } as CartaoModel;
                            })
                        );
                    })
                );
            })
        );
    }

    private getBlockedCardWithFrozenBalance(uid: string): Observable<CartaoModel | null> {
        const cardRef = collection(this.firestore, 'cards');
        const q = query(
            cardRef,
            where('user_id', '==', uid),
            where('card_status', '==', CardStatus.BLOQUEADO)
        );

        return collectionData(q, { idField: 'id' }).pipe(
            map((cards) => {
                const withFrozen = (cards as CartaoModel[]).find(
                    c => (c.frozen_balance ?? 0) > 0
                );
                return withFrozen ?? null;
            })
        ) as Observable<CartaoModel | null>;
    }

    updateCardStatus(cardID: string, status: CardStatus): Observable<void> {
        const cardRef = doc(this.firestore, `cards/${cardID}`);
        return from(updateDoc(cardRef, {
            card_status: status,
            updated_at: new Date(),
        }));
    }

    updateCardBalance(cardID: string, newBalance: number): Observable<void> {
        const cardRef = doc(this.firestore, `cards/${cardID}`);
        return from(updateDoc(cardRef, {
            balance: newBalance,
            updated_at: new Date(),
        }));
    }

    freezeCardBalance(cardID: string): Observable<void> {
        return this.getCardById(cardID).pipe(
            switchMap((card) => {
                if (!card) {
                    return throwError(() => new Error('Cartão não encontrado'));
                }

                const cardRef = doc(this.firestore, `cards/${cardID}`);
                const updates = {
                    card_status: CardStatus.BLOQUEADO,
                    frozen_balance: card.balance,
                    balance: 0,
                    blocked_at: new Date(),
                    updated_at: new Date(),
                };

                return from(updateDoc(cardRef, updates));
            })
        );
    }

    removeCard(cardID: string): Observable<void> {
        const cardRef = doc(this.firestore, `cards/${cardID}`);
        return from(updateDoc(cardRef, {
            user_id: '',
            nickname: '',
            card_status: CardStatus.DISPONIVEL,
            updated_at: new Date(),
        }));
    }
}