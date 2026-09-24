import { inject, Injectable, Injector } from '@angular/core';
import {
    Firestore,
    collection,
    collectionData,
    doc,
    docData,
    updateDoc,
    query,
    where,
} from '@angular/fire/firestore';
import { Observable, from, of, switchMap } from 'rxjs';

import { AuthService } from '../auth/auth-service';
import { CardService } from '../card/card-service';
import {
    RequisicaoCartaoModel,
    BlockRequestModel,
    DeliveryStatus,
    BlockStatus,
    CardStatus,
} from '@core/models';

@Injectable({
    providedIn: 'root',
})
export class OperatorRequestService {
    private injector = inject(Injector);
    private authService = inject(AuthService);
    private cardService = inject(CardService);

    private get firestore(): Firestore {
        return this.injector.get(Firestore);
    }

    getMyCardRequests(): Observable<RequisicaoCartaoModel[]> {
        const uid = this.authService.currentFirebaseUser?.uid;
        if (!uid) return of([]);

        const cardRef = collection(this.firestore, 'card_requests');
        const cardQuery = query(cardRef, where('operator_id', '==', uid));

        return collectionData(cardQuery, { idField: 'id' }) as Observable<RequisicaoCartaoModel[]>;
    }

    getPendingCardRequests(): Observable<RequisicaoCartaoModel[]> {
        const uid = this.authService.currentFirebaseUser?.uid;
        if (!uid) return of([]);

        const cardRef = collection(this.firestore, 'card_requests');
        const q = query(
            cardRef,
            where('operator_id', '==', uid),
            where('status', '==', DeliveryStatus.PAGAMENTO_PENDENTE)
        );

        return collectionData(q, { idField: 'id' }) as Observable<RequisicaoCartaoModel[]>;
    }

    getCardRequestById(id: string): Observable<RequisicaoCartaoModel | null> {
        const cardRef = doc(this.firestore, `card_requests/${id}`);
        return docData(cardRef, { idField: 'id' }) as Observable<RequisicaoCartaoModel | null>;
    }

    updateCardRequestStatus(id: string, status: DeliveryStatus): Observable<void> {
        const cardRef = doc(this.firestore, `card_requests/${id}`);
        return from(updateDoc(cardRef, {
            status,
            updated_at: new Date(),
        }));
    }

    getMyBlockRequests(): Observable<BlockRequestModel[]> {
        const uid = this.authService.currentFirebaseUser?.uid;
        if (!uid) return of([]);

        const blockRef = collection(this.firestore, 'block_requests');
        const q = query(blockRef, where('operator_id', '==', uid));

        return collectionData(q, { idField: 'id' }) as Observable<BlockRequestModel[]>;
    }

    getPendingBlockRequests(): Observable<BlockRequestModel[]> {
        const uid = this.authService.currentFirebaseUser?.uid;
        if (!uid) return of([]);

        const blockRef = collection(this.firestore, 'block_requests');
        const q = query(
            blockRef,
            where('operator_id', '==', uid),
            where('status', '==', BlockStatus.EM_ANDAMENTO)
        );

        return collectionData(q, { idField: 'id' }) as Observable<BlockRequestModel[]>;
    }

    getBlockRequestById(id: string): Observable<BlockRequestModel | null> {
        const blockRef = doc(this.firestore, `block_requests/${id}`);
        return docData(blockRef, { idField: 'id' }) as Observable<BlockRequestModel | null>;
    }

    updateBlockRequestStatus(id: string, status: BlockStatus): Observable<void> {
        const blockRef = doc(this.firestore, `block_requests/${id}`);

        return from(updateDoc(blockRef, {
            status,
            updated_at: new Date(),
        })).pipe(
            switchMap(() => {
                if (status !== BlockStatus.APROVADO) {
                    return of(undefined);
                }

                return this.getBlockRequestById(id).pipe(
                    switchMap((req) => {
                        if (!req?.card_id) return of(undefined);
                        return this.cardService.updateCardStatus(req.card_id, CardStatus.BLOQUEADO);
                    })
                );
            })
        );
    }
}