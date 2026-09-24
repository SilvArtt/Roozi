import { inject, Injectable, Injector } from '@angular/core';
import {
    Firestore,
    collection,
    collectionData,
    doc,
    docData,
    query,
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

        const cardQuery = query(
            cardRef,
            where('user_id', '==', uid)
        );

        return collectionData(cardQuery, {
            idField: 'id'
        }) as Observable<CartaoModel[]>;
    }

    getCardById(id: string): Observable<CartaoModel | null> {
        const cardRef = doc(this.firestore, `cards/${id}`);

        return docData(cardRef, {
            idField: 'id'
        }) as Observable<CartaoModel | null>;
    }

    getCardByCode(code: string): Observable<CartaoModel | null> {
        const cardRef = collection(this.firestore, 'cards');

        const cardQuery = query(cardRef,
            where('card_code', '==', code)
        );

        const cardArr = collectionData(cardQuery, {
            idField: 'id'
        });

        return cardArr.pipe(
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
                    return throwError(() => new Error('Cartão já vinculado'));
                }

                const cardRef = doc(this.firestore, `cards/${card.id}`);
                const updates = {
                    user_id: uid,
                    nickname: payload.nickname,
                    card_status: CardStatus.ATIVO,
                    updated_at: new Date()
                };

                return from(updateDoc(cardRef, updates)).pipe(
                    map(() => ({ ...card, ...updates } as CartaoModel))
                );
            })
        );
    }

    updateCardStatus(cardID: string, status: CardStatus): Observable<void> {
        const cardRef = doc(this.firestore, `cards/${cardID}`);

        const updateCard = {
            card_status: status,
            updated_at: new Date()
        };

        return from(updateDoc(cardRef, updateCard));
    }

    updateCardBalance(cardID: string, newBalance: number): Observable<void> {
        const cardRef = doc(this.firestore, `cards/${cardID}`);

        const updateCrdBalance = {
            balance: newBalance,
            updated_at: new Date()
        };

        return from(updateDoc(cardRef, updateCrdBalance));
    }

    removeCard(cardID: string): Observable<void> {
        const cardRef = doc(this.firestore, `cards/${cardID}`);

        const cardAvailable = {
            user_id: '',
            nickname: '',
            card_status: CardStatus.DISPONIVEL,
            updated_at: new Date()
        };

        return from(updateDoc(cardRef, cardAvailable));
    }
}