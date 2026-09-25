import { inject, Injectable, Injector } from '@angular/core';
import {
    Firestore,
    collection,
    collectionData,
    doc,
    docData,
    query,
    updateDoc,
    where,
} from '@angular/fire/firestore';
import { OperatorCompany } from '@core/models';
import { from, Observable, of } from 'rxjs';
import { AuthService } from '../auth/auth-service';

export type OperatorCompanyUpdate = Partial<
    Pick<OperatorCompany,
        'area_ids' |
        'available_card_types' |
        'available_categories' |
        'billing_system' |
        'company_name'
    >
>;

@Injectable({
    providedIn: 'root',
})
export class OperatorService {
    private injector = inject(Injector);
    private authService = inject(AuthService);

    private get firestore(): Firestore {
        return this.injector.get(Firestore);
    }

    getOperatorsByRegion(regionId: string): Observable<OperatorCompany[]> {
        const OperatorRef = collection(this.firestore, 'operators');
        const OperatorQuery = query(
            OperatorRef,
            where('area_ids', 'array-contains', regionId)
        );

        return collectionData(OperatorQuery, {
            idField: 'id'
        }) as Observable<OperatorCompany[]>;
    }

    getOperatorById(id: string): Observable<OperatorCompany | null> {
        const operatorRef = doc(this.firestore, `operators/${id}`);
        return docData(operatorRef, {
            idField: 'id'
        }) as Observable<OperatorCompany | null>;
    }

    getMyOperatorProfile(): Observable<OperatorCompany | null> {
        const uid = this.authService.currentFirebaseUser?.uid;
        if (!uid) return of(null);

        const operatorRef = doc(this.firestore, `operators/${uid}`);
        return docData(operatorRef, {
            idField: 'id'
        }) as Observable<OperatorCompany | null>;
    }

    updateOperatorProfile(id: string, data: OperatorCompanyUpdate): Observable<void> {
        const operatorRef = doc(this.firestore, `operators/${id}`);
        const update = {
            ...data,
            updated_at: new Date()
        };
        return from(updateDoc(operatorRef, update));
    }
}