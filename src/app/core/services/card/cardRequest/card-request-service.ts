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
import {
    DeliveryStatus,
    RequisicaoCartaoModel,
    RequisicaoPayLoad
} from '@core/models';
import { AuthService } from '@core/services/auth/auth-service';
import { from, map, Observable, of, throwError } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class CardRequestService {
    private injector = inject(Injector);
    private authService = inject(AuthService);

    private get firestore(): Firestore {
        return this.injector.get(Firestore);
    }

    createCardRequest(payload: RequisicaoPayLoad): Observable<RequisicaoCartaoModel> {
        const uid = this.authService.currentFirebaseUser?.uid;

        if (!uid) {
            return throwError(() => new Error("Não foi possivel solicitar um cartão á este usuario porque ele não está logado"));
        }

        if (payload.delivery_type !== 'pickup' && payload.delivery_type !== 'home_delivery') {
            return throwError(() => new Error('Tipo de entrega inválido'));
        }

        if (payload.delivery_type === 'pickup' && !payload.station) {
            return throwError(() => new Error('Estação obrigatória pra retirada'));
        } else if (payload.delivery_type === 'home_delivery' && !payload.address) {
            return throwError(() => new Error('Endereço obrigatório pra entrega'));
        } else {
            const newCardRequest = {
                user_id: uid,
                area_id: payload.area_id,
                operator_id: payload.operator_id,
                card_type: payload.card_type,
                passenger_category: payload.passenger_category,
                cpf: payload.cpf ?? '',
                delivery_type: payload.delivery_type,
                station: payload.station ?? '',
                address: payload.address ?? null,
                status: DeliveryStatus.PAGAMENTO_PENDENTE,
                created_at: new Date()
            };

            const cardReqRef = collection(this.firestore, 'card_requests');

            return from(addDoc(cardReqRef, newCardRequest)).pipe(
                map((ref) => ({ ...newCardRequest, id: ref.id } as RequisicaoCartaoModel))
            );
        }
    }

    getMyCardRequests(): Observable<RequisicaoCartaoModel[]> {
        const uid = this.authService.currentFirebaseUser?.uid;

        if (!uid) return of([]);

        const cardReqRef = collection(this.firestore, 'card_requests');
        const cardReqQuery = query(cardReqRef,
            where('user_id', '==', uid)
        );

        return collectionData(cardReqQuery, {
            idField: 'id'
        }) as Observable<RequisicaoCartaoModel[]>;
    }

    getCardRequestById(id: string): Observable<RequisicaoCartaoModel | null> {
        const cardReqRef = doc(this.firestore, `card_requests/${id}`);

        return docData(cardReqRef, {
            idField: 'id'
        }) as Observable<RequisicaoCartaoModel | null>;
    }
}