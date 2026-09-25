import { inject, Injectable, Injector } from '@angular/core';
import {
    Firestore,
    collection,
    collectionData,
    doc,
    setDoc,
    addDoc,
    orderBy,
    query,
    where,
} from '@angular/fire/firestore';
import { AuthService } from '../auth/auth-service';
import { Observable, of, from, map, take } from 'rxjs';
import {
    TransacaoFilter,
    TransacaoModel,
    tipoTransacao,
    TimeFilter,
    TransactionTypeFilter,
} from '@core/models';

@Injectable({
    providedIn: 'root',
})
export class TransactionService {
    private injector = inject(Injector);
    private authService = inject(AuthService);

    private get firestore(): Firestore {
        return this.injector.get(Firestore);
    }

    getMyTransactions(): Observable<TransacaoModel[]> {
        const uid = this.authService.currentFirebaseUser?.uid;
        if (!uid) return of([]);

        const transactionRef = collection(this.firestore, 'transactions');
        const transactionQuery = query(
            transactionRef,
            where('user_id', '==', uid),
            orderBy('date', 'desc')
        );

        return collectionData(transactionQuery, {
            idField: 'id',
        }) as Observable<TransacaoModel[]>;
    }

    getTransactionsByCard(cardId: string): Observable<TransacaoModel[]> {
        const transactionRef = collection(this.firestore, 'transactions');
        const transactionQuery = query(
            transactionRef,
            where('card_id', '==', cardId),
            orderBy('date', 'desc')
        );

        return collectionData(transactionQuery, {
            idField: 'id',
        }) as Observable<TransacaoModel[]>;
    }

    getFilteredTransactions(filter: TransacaoFilter): Observable<TransacaoModel[]> {
        const uid = this.authService.currentFirebaseUser?.uid;
        if (!uid) return of([]);

        const { startDate, endDate } = this.calculateDateRange(filter.time_filter);

        const conditions: any[] = [
            where('user_id', '==', uid),
        ];

        if (filter.card_id) {
            conditions.push(where('card_id', '==', filter.card_id));
        }

        if (filter.type && filter.type !== 'all') {
            conditions.push(where('type', '==', filter.type));
        }

        conditions.push(where('date', '>=', startDate));
        conditions.push(where('date', '<=', endDate));

        const transactionsRef = collection(this.firestore, 'transactions');

        const q = query(
            transactionsRef,
            ...conditions,
            orderBy('date', 'desc')
        );

        return collectionData(q, {
            idField: 'id',
        }) as Observable<TransacaoModel[]>;
    }

    createRechargeTransaction(
        userId: string,
        cardId: string,
        amount: number,
        cardLabel: string
    ): Observable<void> {
        const newTransaction: Omit<TransacaoModel, 'id'> = {
            user_id: userId,
            card_id: cardId,
            amount,
            type: tipoTransacao.RECARGA,
            title: `Recarga em ${cardLabel}`,
            description: 'Recarga confirmada',
            date: new Date(),
            icon: '💰',
        };

        const transactionRef = collection(this.firestore, 'transactions');

        return from(addDoc(transactionRef, newTransaction)).pipe(
            take(1),
            map(() => undefined)
        );
    }

    private calculateDateRange(timeFilter: TimeFilter): { startDate: Date; endDate: Date } {
        const now = new Date();

        switch (timeFilter) {
            case TimeFilter.DIARIO: {
                const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
                const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
                return { startDate, endDate };
            }

            case TimeFilter.MENSAL: {
                const startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
                const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                return { startDate, endDate };
            }

            case TimeFilter.ANUAL: {
                const startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
                const endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
                return { startDate, endDate };
            }

            default: {
                const startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
                const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                return { startDate, endDate };
            }
        }
    }
}