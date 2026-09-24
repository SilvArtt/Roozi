import { inject, Injectable, Injector } from '@angular/core';
import {
    Firestore,
    collection,
    collectionData,
    orderBy,
    query,
    where,
} from '@angular/fire/firestore';
import { AuthService } from '../auth/auth-service';
import { Observable, of } from 'rxjs';
import { TransacaoFilter, TransacaoModel } from '@core/models';

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
        const transactionQuery = query(transactionRef,
            where('user_id', '==', uid)
        );

        return collectionData(transactionQuery, {
            idField: 'id'
        }) as Observable<TransacaoModel[]>;
    }

    getTransactionsByCard(cardId: string): Observable<TransacaoModel[]> {
        const transactionRef = collection(this.firestore, 'transactions');
        const transactionQuery = query(transactionRef,
            where('card_id', '==', cardId)
        );

        return collectionData(transactionQuery, {
            idField: 'id'
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
            idField: 'id'
        }) as Observable<TransacaoModel[]>;
    }

    private calculateDateRange(timeFilter: string): { startDate: Date; endDate: Date } {
        const now = new Date();

        switch (timeFilter) {
            case 'daily': {
                const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
                const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
                return { startDate, endDate };
            }

            case 'monthly': {
                const startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
                const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                return { startDate, endDate };
            }

            case 'yearly': {
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