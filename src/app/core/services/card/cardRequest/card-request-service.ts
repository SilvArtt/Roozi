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
    CardType,
    DeliveryStatus,
    MeuPedido,
    RequisicaoCartaoModel,
    RequisicaoPayLoad,
} from '@core/models';
import { AuthService } from '@core/services/auth/auth-service';
import {
    from,
    map,
    Observable,
    of,
    take,
} from 'rxjs';

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
            return new Observable(observer => {
                observer.error(new Error("Não foi possível solicitar um cartão: usuário não está logado"));
            });
        }

        if (payload.delivery_type !== 'pickup' && payload.delivery_type !== 'home_delivery') {
            return new Observable(observer => {
                observer.error(new Error('Tipo de entrega inválido'));
            });
        }

        if (payload.delivery_type === 'pickup' && !payload.station) {
            return new Observable(observer => {
                observer.error(new Error('Estação obrigatória pra retirada'));
            });
        }

        if (payload.delivery_type === 'home_delivery' && !payload.address) {
            return new Observable(observer => {
                observer.error(new Error('Endereço obrigatório pra entrega'));
            });
        }

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
            created_at: new Date(),
            updated_at: new Date(),
        };

        const cardReqRef = collection(this.firestore, 'card_requests');

        return from(addDoc(cardReqRef, newCardRequest)).pipe(
            take(1),
            map((ref) => ({ ...newCardRequest, id: ref.id } as RequisicaoCartaoModel))
        );
    }


    getMyCardRequests(): Observable<RequisicaoCartaoModel[]> {
        const uid = this.authService.currentFirebaseUser?.uid;
        if (!uid) return of([]);

        const cardReqRef = collection(this.firestore, 'card_requests');
        const cardReqQuery = query(cardReqRef, where('user_id', '==', uid));

        return collectionData(cardReqQuery, { idField: 'id' }) as Observable<RequisicaoCartaoModel[]>;
    }


    getMyPedidos(): Observable<MeuPedido[]> {
        const uid = this.authService.currentFirebaseUser?.uid;
        if (!uid) return of([]);

        const reqRef = collection(this.firestore, 'card_requests');
        const reqQuery = query(reqRef, where('user_id', '==', uid));

        return collectionData(reqQuery, { idField: 'id' }).pipe(
            take(1),
            map((requests: any[]) => {
                if (!requests || requests.length === 0) {
                    return [];
                }

                return requests.map(r => this.toMeuPedido(r));
            })
        );
    }

    getCardRequestById(id: string): Observable<RequisicaoCartaoModel | null> {
        const cardReqRef = doc(this.firestore, `card_requests/${id}`);

        return docData(cardReqRef, {
            idField: 'id'
        }) as Observable<RequisicaoCartaoModel | null>;
    }

    // ═══════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════

    private toMeuPedido(req: any): MeuPedido {
        return {
            id: req.id,
            operator_id: req.operator_id ?? '',
            operator_name: req.operator_name ?? 'Operadora',
            card_type: req.card_type,
            passenger_category: req.passenger_category,
            status: req.status,
            card_code: req.card_code,
            card_id: req.card_id,
            is_virtual: req.card_type === CardType.VIRTUAL,
            created_at: this.toDate(req.created_at),
        };
    }

    private toDate(value: any): Date {
        if (!value) return new Date();
        if (value instanceof Date) return value;
        if (typeof value.toDate === 'function') return value.toDate();
        return new Date(value);
    }
}