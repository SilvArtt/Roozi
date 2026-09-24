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
} from '@angular/fire/firestore';
import { AuthService } from '../auth/auth-service';
import { BlockRequestModel, BlockRequestPayload, BlockStatus } from '@core/models';
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

                const blockReqRef = collection(this.firestore, 'block_requests');

                const newBlockRequest = {
                    user_id: uid,
                    card_id: card.id,
                    operator_id: card.operator_id,
                    holder_name: payload.holder_name,
                    card_type: payload.card_type,
                    has_cpf_linked: payload.has_cpf_linked,
                    cpf: payload.cpf ?? '',
                    reason: payload.reason,
                    other_reason: payload.other_reason ?? '',
                    status: BlockStatus.EM_ANDAMENTO,
                    created_at: new Date()
                };

                return from(addDoc(blockReqRef, newBlockRequest)).pipe(
                    map((ref) => ({ ...newBlockRequest, id: ref.id } as BlockRequestModel))
                );
            })
        );
    }

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
}