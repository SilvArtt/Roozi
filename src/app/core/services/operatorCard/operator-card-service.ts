import { inject, Injectable, Injector } from '@angular/core';
import {
    Firestore,
    collection,
    collectionData,
    doc,
    docData,
    setDoc,
    updateDoc,
    query,
    where,
} from '@angular/fire/firestore';  
import { Observable, from, of, switchMap, map, firstValueFrom, throwError } from 'rxjs';

import { AuthService } from '../auth/auth-service';
import { CartaoModel, CardStatus, CardType, PassengerCategory } from '@core/models';

export interface CreateCardPayload {
    card_code: string;
    card_type: CardType;
    passenger_category?: PassengerCategory;
    nickname?: string;
    operator_name?: string;
}

@Injectable({
    providedIn: 'root',
})
export class OperatorCardService {
    private injector = inject(Injector);
    private authService = inject(AuthService);

    private get firestore(): Firestore {
        return this.injector.get(Firestore);
    }

    getMyCards(): Observable<CartaoModel[]> {
        const uid = this.authService.currentFirebaseUser?.uid;
        if (!uid) return of([]);

        const cardsRef = collection(this.firestore, 'cards');
        const q = query(cardsRef, where('operator_id', '==', uid));

        return collectionData(q, { idField: 'id' }) as Observable<CartaoModel[]>;
    }

    getAvailableCards(): Observable<CartaoModel[]> {
        const uid = this.authService.currentFirebaseUser?.uid;
        if (!uid) return of([]);

        const cardsRef = collection(this.firestore, 'cards');
        const q = query(
            cardsRef,
            where('operator_id', '==', uid),
            where('card_status', '==', CardStatus.DISPONIVEL)
        );

        return collectionData(q, { idField: 'id' }) as Observable<CartaoModel[]>;
    }

    getLinkedCards(): Observable<CartaoModel[]> {
        const uid = this.authService.currentFirebaseUser?.uid;
        if (!uid) return of([]);

        const cardsRef = collection(this.firestore, 'cards');
        const q = query(
            cardsRef,
            where('operator_id', '==', uid),
            where('card_status', '==', CardStatus.ATIVO)
        );

        return collectionData(q, { idField: 'id' }) as Observable<CartaoModel[]>;
    }

    getCardById(id: string): Observable<CartaoModel | null> {
        const cardRef = doc(this.firestore, `cards/${id}`);
        return docData(cardRef, { idField: 'id' }) as Observable<CartaoModel | null>;
    }

    createCard(payload: CreateCardPayload): Observable<CartaoModel> {
        const uid = this.authService.currentFirebaseUser?.uid;
        if (!uid) {
            return throwError(() => new Error('Operadora não logada'));
        }

        const cardRef = doc(collection(this.firestore, 'cards'));

        const newCard: CartaoModel = {
            id: cardRef.id,
            user_id: '',
            operator_id: uid,
            operator_name: payload.operator_name ?? '',
            nickname: payload.nickname ?? '',
            card_code: payload.card_code,
            masked_number: '•••• ' + payload.card_code.slice(-4),
            card_type: payload.card_type,
            card_status: CardStatus.DISPONIVEL,
            balance: 0,
            passenger_category: payload.passenger_category ?? PassengerCategory.COMUM,
            created_at: new Date(),
            updated_at: new Date(),
        };

        return from(setDoc(cardRef, newCard)).pipe(
            map(() => newCard)
        );
    }

    bulkCreateCards(payloads: CreateCardPayload[]): Observable<CartaoModel[]> {
        const uid = this.authService.currentFirebaseUser?.uid;
        if (!uid) {
            return throwError(() => new Error('Operadora não logada'));
        }

        return from(firstValueFrom(this.getMyCards())).pipe(
            switchMap((existing) => {
                const existingCodes = new Set((existing ?? []).map(c => c.card_code));
                const novos = payloads.filter(p => !existingCodes.has(p.card_code));

                const criados: CartaoModel[] = [];
                const promises: Promise<void>[] = [];

                for (const p of novos) {
                    const cardRef = doc(collection(this.firestore, 'cards'));
                    const newCard: CartaoModel = {
                        id: cardRef.id,
                        user_id: '',
                        operator_id: uid,
                        operator_name: p.operator_name ?? '',
                        nickname: p.nickname ?? '',
                        card_code: p.card_code,
                        masked_number: '•••• ' + p.card_code.slice(-4),
                        card_type: p.card_type,
                        card_status: CardStatus.DISPONIVEL,
                        balance: 0,
                        passenger_category: p.passenger_category ?? PassengerCategory.COMUM,
                        created_at: new Date(),
                        updated_at: new Date(),
                    };
                    criados.push(newCard);
                    promises.push(setDoc(cardRef, newCard));
                }

                return from(Promise.all(promises)).pipe(
                    map(() => criados)
                );
            })
        );
    }

    updateCardStatus(id: string, status: CardStatus): Observable<void> {
        const cardRef = doc(this.firestore, `cards/${id}`);
        return from(updateDoc(cardRef, {
            card_status: status,
            updated_at: new Date(),
        }));
    }

    updateCard(id: string, data: Partial<CartaoModel>): Observable<void> {
        const cardRef = doc(this.firestore, `cards/${id}`);
        return from(updateDoc(cardRef, {
            ...data,
            updated_at: new Date(),
        }));
    }

    removeCard(id: string): Observable<void> {
        const cardRef = doc(this.firestore, `cards/${id}`);
        return from(updateDoc(cardRef, {
            user_id: '',
            nickname: '',
            card_status: CardStatus.DISPONIVEL,
            updated_at: new Date(),
        }));
    }
}