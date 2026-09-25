import {
    Injectable,
    inject,
} from '@angular/core';
import {
    Auth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    onAuthStateChanged,
} from '@angular/fire/auth';
import {
    Firestore,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    DocumentSnapshot,
} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Observable, from, switchMap, map, tap, of, BehaviorSubject } from 'rxjs';
import {
    LoginPayload,
    RegisterPassengerPayload,
    RegisterOperatorPayload,
    User,
    Passenger,
    Operator,
    OperatorCompany,
} from '@core/models';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private auth = inject(Auth);
    private firestore = inject(Firestore);
    private router = inject(Router);

    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    private isRegistering = false;

    get currentUserSnapshot(): User | null {
        return this.currentUserSubject.value;
    }

    constructor() {
        onAuthStateChanged(this.auth, async (firebaseUser) => {
            if (!firebaseUser) {
                if (this.auth.currentUser) {
                    console.warn('[Auth] null falso — ignorando');
                    return;
                }
                this.currentUserSubject.next(null);
                return;
            }

            if (this.isRegistering) {
                return;
            }

            const cached = this.currentUserSubject.value;
            if (cached && cached.id === firebaseUser.uid) {
                return;
            }

            try {
                const userRef = doc(this.firestore, `users/${firebaseUser.uid}`);
                const snap = await getDoc(userRef);

                if (snap.exists()) {
                    this.currentUserSubject.next(this.snapshotToUser(snap));
                } else {
                    console.warn('Perfil não encontrado:', firebaseUser.uid);
                }
            } catch (err) {
                console.error('Erro ao buscar perfil:', err);
            }
        });
    }

    get currentFirebaseUser() {
        return this.auth.currentUser;
    }

    login(payload: LoginPayload): Observable<User> {
        return from(
            signInWithEmailAndPassword(this.auth, payload.email, payload.password)
        ).pipe(
            switchMap((credential) => {
                const userRef = doc(this.firestore, `users/${credential.user.uid}`);
                return from(getDoc(userRef));
            }),
            switchMap((snap) => {
                if (!snap.exists()) {
                    return from(signOut(this.auth)).pipe(
                        switchMap(() => {
                            throw new Error('Perfil do usuário não encontrado no banco.');
                        })
                    );
                }

                const user = this.snapshotToUser(snap);
                this.currentUserSubject.next(user);

                return of(user);
            })
        );
    }

    registerPassenger(payload: RegisterPassengerPayload): Observable<User> {
        this.isRegistering = true;

        return from(
            createUserWithEmailAndPassword(this.auth, payload.email, payload.password)
        ).pipe(
            switchMap((credential) => {
                const uid = credential.user.uid;
                return from(
                    updateProfile(credential.user, { displayName: payload.full_name })
                ).pipe(map(() => uid));
            }),
            switchMap((uid) => {
                const userRef = doc(this.firestore, `users/${uid}`);

                const userDoc: Omit<Passenger, 'id'> = {
                    type: 'passenger',
                    email: payload.email ?? '',
                    full_name: payload.full_name ?? '',
                    username: payload.username ?? '',
                    phone: payload.phone ?? '',
                    cpf: payload.cpf ?? '',
                    lgpd_consent: payload.lgpd_consent ?? false,
                    created_at: new Date(),
                    updated_at: new Date(),
                };

                return from(setDoc(userRef, userDoc)).pipe(
                    map(() => {
                        const user = { id: uid, ...userDoc } as Passenger;
                        this.currentUserSubject.next(user);
                        this.isRegistering = false;
                        return user;
                    })
                );
            }),
            tap({
                error: () => {
                    this.isRegistering = false;
                },
            })
        );
    }

    registerOperator(payload: RegisterOperatorPayload): Observable<User> {
        this.isRegistering = true;

        return from(
            createUserWithEmailAndPassword(this.auth, payload.email, payload.password)
        ).pipe(
            switchMap((credential) => {
                const uid = credential.user.uid;
                return from(
                    updateProfile(credential.user, { displayName: payload.company_name })
                ).pipe(map(() => uid));
            }),
            switchMap((uid) => {
                const userRef = doc(this.firestore, `users/${uid}`);
                const operatorRef = doc(this.firestore, `operators/${uid}`);

                const userDoc: Omit<Operator, 'id'> = {
                    type: 'operator',
                    email: payload.email ?? '',
                    manager_name: payload.manager_name ?? '',
                    company_name: payload.company_name ?? '',
                    company_phone: payload.company_phone ?? '',
                    cnpj: payload.cnpj ?? '',
                    lgpd_consent: payload.lgpd_consent ?? false,
                    created_at: new Date(),
                    updated_at: new Date(),
                };

                const operatorDoc: Omit<OperatorCompany, 'id'> = {
                    user_id: uid,
                    company_name: payload.company_name ?? '',
                    area_ids: payload.area_ids ?? [],
                    available_card_types: payload.available_card_types ?? [],
                    available_categories: payload.available_categories ?? [],
                    billing_system: payload.billing_system ?? '',
                    status: 'active',
                    created_at: new Date(),
                    updated_at: new Date(),
                };

                return from(
                    Promise.all([
                        setDoc(userRef, userDoc),
                        setDoc(operatorRef, operatorDoc),
                    ])
                ).pipe(
                    map(() => {
                        const user = { id: uid, ...userDoc } as Operator;
                        this.currentUserSubject.next(user);
                        this.isRegistering = false;
                        return user;
                    })
                );
            }),
            tap({
                error: () => {
                    this.isRegistering = false;
                },
            })
        );
    }

    logout(): Observable<void> {
        return from(signOut(this.auth)).pipe(
            tap(() => {
                this.currentUserSubject.next(null);
                this.router.navigate(['/login']);
            })
        );
    }

    updateUserProfile(uid: string, data: Partial<User>): Observable<void> {
        const userRef = doc(this.firestore, `users/${uid}`);
        const updates = {
            ...data,
            updated_at: new Date(),
        };

        return from(updateDoc(userRef, updates)).pipe(
            tap(() => {
                const current = this.currentUserSubject.value;
                if (current && current.id === uid) {
                    this.currentUserSubject.next({
                        ...current,
                        ...data,
                    } as User);
                }
            })
        );
    }

    isLoggedIn(): boolean {
        return this.auth.currentUser !== null;
    }

    private snapshotToUser(snap: DocumentSnapshot): User {
        const data = snap.data() ?? {};
        return {
            id: snap.id,
            ...data,
            created_at: this.toDate(data['created_at']),
            updated_at: this.toDate(data['updated_at']),
        } as User;
    }

    private toDate(value: any): Date {
        if (!value) return new Date();
        if (value instanceof Date) return value;
        if (typeof value.toDate === 'function') return value.toDate();
        return new Date(value);
    }
}