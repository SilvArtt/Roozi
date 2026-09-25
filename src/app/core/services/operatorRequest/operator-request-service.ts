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
import { Observable, from, of, switchMap, take, map, throwError } from 'rxjs';

import { AuthService } from '../auth/auth-service';
import { CardService } from '../card/card-service';
import {
    RequisicaoCartaoModel,
    BlockRequestModel,
    DeliveryStatus,
    BlockStatus,
    CardStatus,
    CartaoModel,
    CardType,
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

   
    approveCardRequest(request: RequisicaoCartaoModel): Observable<CartaoModel> {
        const uid = this.authService.currentFirebaseUser?.uid;
        if (!uid) {
            return throwError(() => new Error('Operadora não logada'));
        }

        if (request.status !== DeliveryStatus.PAGAMENTO_PENDENTE) {
            return throwError(() => new Error('Este pedido já foi processado'));
        }

        const requestRef = doc(this.firestore, `card_requests/${request.id}`);
        const operatorName = this.getOperatorName();

        
        const cardRef = doc(collection(this.firestore, 'cards'));
        const cardCode = this.generateCardCode();
        const isVirtual = request.card_type === CardType.VIRTUAL;

        const newCard: CartaoModel = {
            id: cardRef.id,
            user_id: isVirtual ? request.user_id : '',
            operator_id: uid,
            operator_name: operatorName,
            nickname: isVirtual ? 'Meu cartão virtual' : '',
            card_code: cardCode,
            masked_number: '•••• ' + cardCode.slice(-4),
            card_type: request.card_type,
            card_status: isVirtual ? CardStatus.ATIVO : CardStatus.DISPONIVEL,
            balance: 0,
            passenger_category: request.passenger_category,
            created_at: new Date(),
            updated_at: new Date(),
        };

        return from(setDoc(cardRef, newCard)).pipe(
            take(1),
            switchMap(() => {
                // 2. Atualiza o card_request com os dados do cartão criado
                return from(updateDoc(requestRef, {
                    status: DeliveryStatus.PROCESSANDO,
                    card_id: cardRef.id,
                    card_code: cardCode,
                    operator_name: operatorName,
                    updated_at: new Date(),
                })).pipe(
                    take(1),
                    map(() => newCard)
                );
            })
        );
    }

    updateCardRequestStatus(id: string, status: DeliveryStatus): Observable<void> {
        const cardRef = doc(this.firestore, `card_requests/${id}`);
        return from(updateDoc(cardRef, {
            status,
            updated_at: new Date(),
        })).pipe(take(1));
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

    
    approveBlockRequest(request: BlockRequestModel): Observable<void> {
        if (request.status !== BlockStatus.EM_ANDAMENTO) {
            return throwError(() => new Error('Este bloqueio já foi processado'));
        }

        const blockRef = doc(this.firestore, `block_requests/${request.id}`);

        return from(updateDoc(blockRef, {
            status: BlockStatus.APROVADO,
            updated_at: new Date(),
        })).pipe(
            take(1),
            switchMap(() => {
                return this.cardService.freezeCardBalance(request.card_id).pipe(take(1));
            })
        );
    }

    rejectBlockRequest(id: string): Observable<void> {
        const blockRef = doc(this.firestore, `block_requests/${id}`);
        return from(updateDoc(blockRef, {
            status: BlockStatus.REJEITADO,
            updated_at: new Date(),
        })).pipe(take(1));
    }

    

    private getOperatorName(): string {
        const user = this.authService.currentUserSnapshot;
        return user?.type === 'operator' ? user.company_name : 'Operadora';
    }

    private generateCardCode(): string {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
        return timestamp + random;
    }
}