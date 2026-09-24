import { inject, Injectable, Injector } from '@angular/core';
import {
    Firestore,
    collection,
    collectionData,
    doc,
    addDoc,
    query,
    updateDoc,
    where,
} from '@angular/fire/firestore';
import { AuthService } from '../auth/auth-service';
import { PaymentStatus, Recarga, RechargePayload, RechargeStatus } from '@core/models';
import { from, map, Observable, of, throwError } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class RechargeService {
    private injector = inject(Injector);
    private authService = inject(AuthService);

    private get firestore(): Firestore {
        return this.injector.get(Firestore);
    }

    createRecharge(payload: RechargePayload): Observable<Recarga> {
        const uid = this.authService.currentFirebaseUser?.uid;

        if (!uid) {
            return throwError(() => new Error('Usuário não logado'));
        }

        const newRecharge = {
            user_id: uid,
            card_id: payload.card_id,
            amount: payload.amount,
            payment_method: payload.payment_method,
            payment_status: PaymentStatus.PENDENTE,
            recarga_status: RechargeStatus.PENDENTE,
            created_at: new Date()
        };

        const rechargeRef = collection(this.firestore, 'recharges');

        return from(addDoc(rechargeRef, newRecharge)).pipe(
            map((ref) => ({ ...newRecharge, id: ref.id } as Recarga))
        );
    }

    getMyRecharges(): Observable<Recarga[]> {
        const uid = this.authService.currentFirebaseUser?.uid;

        if (!uid) return of([]);

        const rechargeRef = collection(this.firestore, 'recharges');

        const rechargeQuery = query(rechargeRef,
            where('user_id', '==', uid)
        );

        return collectionData(rechargeQuery, {
            idField: 'id'
        }) as Observable<Recarga[]>;
    }

    getRechargesByCard(cardId: string): Observable<Recarga[]> {
        const rechargeRef = collection(this.firestore, 'recharges');

        const rechargeQuery = query(
            rechargeRef,
            where('card_id', '==', cardId)
        );

        return collectionData(rechargeQuery, {
            idField: 'id'
        }) as Observable<Recarga[]>;
    }

    confirmRecharge(rechargeId: string): Observable<void> {
        const rechargeRef = doc(this.firestore, `recharges/${rechargeId}`);

        const updateRecharge = updateDoc(rechargeRef, {
            recarga_status: RechargeStatus.CONFIRMADA,
            payment_status: PaymentStatus.FOI_PAGO,
            confirmed_at: new Date()
        });

        return from(updateRecharge);
    }
}