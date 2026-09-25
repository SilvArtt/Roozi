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
  throwError,
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
      return throwError(() => new Error('Não foi possível solicitar um cartão: usuário não está logado'));
    }

    const isVirtual = payload.card_type === CardType.VIRTUAL;
    const isAvulso = payload.passenger_category === 'avulso';

    // Validações condicionais
    if (!isVirtual) {
      if (payload.delivery_type !== 'pickup' && payload.delivery_type !== 'home_delivery') {
        return throwError(() => new Error('Tipo de entrega inválido'));
      }

      if (payload.delivery_type === 'pickup' && !payload.station) {
        return throwError(() => new Error('Estação obrigatória pra retirada'));
      }

      if (payload.delivery_type === 'home_delivery' && !payload.address) {
        return throwError(() => new Error('Endereço obrigatório pra entrega'));
      }
    }

    const shouldSendCpf = payload.has_cpf_linked && !isAvulso;


    const newCardRequest: Record<string, any> = {
      user_id: uid,
      area_id: payload.area_id,
      operator_id: payload.operator_id,
      card_type: payload.card_type,
      passenger_category: payload.passenger_category,
      has_cpf_linked: shouldSendCpf,
      cpf: shouldSendCpf ? (payload.cpf ?? '') : '',
      status: DeliveryStatus.PAGAMENTO_PENDENTE,
      created_at: new Date(),
      updated_at: new Date(),
    };


    if (!isVirtual && payload.delivery_type) {
      newCardRequest['delivery_type'] = payload.delivery_type;
    }

    if (!isVirtual && payload.delivery_type === 'pickup' && payload.station) {
      newCardRequest['station'] = payload.station;
    }

    if (!isVirtual && payload.delivery_type === 'home_delivery' && payload.address) {
      newCardRequest['address'] = payload.address;
    }

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